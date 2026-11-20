import { FastifyReply, FastifyRequest } from 'fastify';

export type UserRole = 'ADMIN' | 'COORDENADOR_BLH' | 'COLETOR_CAMPO' | 'LABORATORIO';

export interface AuthJwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthJwtPayload;
    user: AuthJwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({
      type: 'about:blank',
      title: 'Não autenticado',
      status: 401,
      detail: 'Sessão ausente ou expirada. Faça login novamente.',
    });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        type: 'about:blank',
        title: 'Acesso negado',
        status: 403,
        detail: `Perfil '${request.user.role}' não possui permissão para esta operação.`,
      });
    }
  };
}
