import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { corsOrigins, env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { donorsRoutes } from './modules/donors/donors.routes.js';
import { routesRoutes } from './modules/routes/routes.routes.js';
import { bottlesRoutes } from './modules/bottles/bottles.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { geoRoutes } from './modules/geo/geo.routes.js';
import { donorInterestsRoutes } from './modules/donor-interests/donorInterests.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            level: env.NODE_ENV === 'production' ? 'info' : 'debug',
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.cpf',
                'req.body.sus',
                'req.body.phone',
                'req.body.whatsapp',
                'req.body.email',
              ],
              censor: '[REDACTED]',
            },
          },
  });

  await app.register(helmet, {
    contentSecurityPolicy: false, // Swagger UI usa inline scripts em /docs
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error('Origem não permitida pelo CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(cookie);

  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'LEITE FLOW API — BLH Marília',
        description: 'API REST oficial de gestão logística, triagem clínica e rastreabilidade de leite humano.',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Healthcheck público para Render / Railway / Fly.io
  app.get('/health', async () => ({
    status: 'ok',
    service: 'leiteflow-backend',
    timestamp: new Date().toISOString(),
  }));

  // Rotas versionadas /api/v1
  await app.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(donorsRoutes);
      await api.register(routesRoutes);
      await api.register(bottlesRoutes);
      await api.register(dashboardRoutes);
      await api.register(geoRoutes);
      await api.register(donorInterestsRoutes);
    },
    { prefix: '/api/v1' }
  );

  // Tratamento centralizado de erros (RFC 7807)
  app.setErrorHandler((error, _request, reply) => {
    const errObj = error instanceof Error ? error : new Error(String(error));
    const statusCode =
      typeof (error as { statusCode?: number }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;

    if (statusCode >= 500) {
      app.log.error(error);
    }

    reply.status(statusCode).send({
      type: 'about:blank',
      title: statusCode >= 500 ? 'Erro interno do servidor' : errObj.name || 'Erro na requisição',
      status: statusCode,
      detail:
        statusCode >= 500 && env.NODE_ENV === 'production'
          ? 'Ocorreu um erro inesperado. Tente novamente.'
          : errObj.message,
    });
  });

  return app;
}
