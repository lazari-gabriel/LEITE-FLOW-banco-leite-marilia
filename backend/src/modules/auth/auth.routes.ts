import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { generateRandomToken, hashOpaqueToken, verifyPassword } from '../../lib/crypto.js';
import { authenticate, UserRole } from '../../middlewares/auth.js';
import { env } from '../../config/env.js';
import { recordAudit } from '../../lib/audit.js';

const REFRESH_COOKIE_NAME = 'lf_refresh_token';

const loginBodySchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha inválida'),
});

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/auth/login',
    {
      config: {
        rateLimit: { max: 15, timeWindow: '1 minute' },
      },
      schema: {
        tags: ['Auth'],
        summary: 'Autenticar usuário e emitir access token + refresh cookie HttpOnly',
      },
    },
    async (request, reply) => {
      const parsed = loginBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          type: 'about:blank',
          title: 'Dados inválidos',
          status: 400,
          detail: 'Informe um e-mail e senha válidos.',
        });
      }

      const email = parsed.data.email.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.active) {
        await recordAudit({
          request,
          userEmail: email,
          action: 'AUTH_LOGIN_FAILED',
          entity: 'User',
          details: { reason: 'user_not_found_or_inactive' },
        });
        return reply.status(401).send({
          type: 'about:blank',
          title: 'Credenciais inválidas',
          status: 401,
          detail: 'E-mail ou senha incorretos.',
        });
      }

      const valid = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!valid) {
        await recordAudit({
          request,
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          action: 'AUTH_LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          details: { reason: 'invalid_password' },
        });
        return reply.status(401).send({
          type: 'about:blank',
          title: 'Credenciais inválidas',
          status: 401,
          detail: 'E-mail ou senha incorretos.',
        });
      }

      const accessToken = app.jwt.sign(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        },
        { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
      );

      const rawRefresh = generateRandomToken(48);
      const tokenHash = hashOpaqueToken(rawRefresh);
      const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 86400_000);

      await prisma.refreshToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      });

      reply.setCookie(REFRESH_COOKIE_NAME, rawRefresh, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        path: '/api/v1/auth',
        expires: expiresAt,
      });

      await recordAudit({
        request,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'AUTH_LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
      });

      return reply.send({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  );

  app.post(
    '/auth/refresh',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Rotacionar refresh token e emitir novo access token',
      },
    },
    async (request, reply) => {
      const rawCookie = request.cookies[REFRESH_COOKIE_NAME];
      if (!rawCookie) {
        return reply.status(401).send({
          type: 'about:blank',
          title: 'Sessão expirada',
          status: 401,
          detail: 'Refresh token ausente.',
        });
      }

      const tokenHash = hashOpaqueToken(rawCookie);
      const stored = await prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.active) {
        reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
        return reply.status(401).send({
          type: 'about:blank',
          title: 'Sessão inválida',
          status: 401,
          detail: 'Faça login novamente.',
        });
      }

      // Rotação do refresh token (revoga o antigo e emite novo)
      const nextRawRefresh = generateRandomToken(48);
      const nextHash = hashOpaqueToken(nextRawRefresh);
      const nextExpiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 86400_000);

      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date() },
        }),
        prisma.refreshToken.create({
          data: {
            tokenHash: nextHash,
            userId: stored.user.id,
            expiresAt: nextExpiresAt,
          },
        }),
      ]);

      const accessToken = app.jwt.sign(
        {
          sub: stored.user.id,
          email: stored.user.email,
          name: stored.user.name,
          role: stored.user.role as UserRole,
        },
        { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
      );

      reply.setCookie(REFRESH_COOKIE_NAME, nextRawRefresh, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        path: '/api/v1/auth',
        expires: nextExpiresAt,
      });

      return reply.send({
        accessToken,
        user: {
          id: stored.user.id,
          name: stored.user.name,
          email: stored.user.email,
          role: stored.user.role,
        },
      });
    }
  );

  app.post(
    '/auth/logout',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Encerrar sessão e revogar refresh token',
      },
    },
    async (request, reply) => {
      const rawCookie = request.cookies[REFRESH_COOKIE_NAME];
      if (rawCookie) {
        const tokenHash = hashOpaqueToken(rawCookie);
        await prisma.refreshToken.updateMany({
          where: { tokenHash, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
      return reply.status(204).send();
    }
  );

  app.get(
    '/auth/me',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Retorna o usuário autenticado atual',
      },
    },
    async (request) => {
      return {
        user: {
          id: request.user.sub,
          name: request.user.name,
          email: request.user.email,
          role: request.user.role,
        },
      };
    }
  );
}
