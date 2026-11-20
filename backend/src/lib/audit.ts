import { FastifyRequest } from 'fastify';
import { prisma } from './prisma.js';

export interface AuditInput {
  request?: FastifyRequest;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  details?: Record<string, unknown>;
}

/**
 * Grava trilha imutável de auditoria (append-only) removendo campos sensíveis.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const reqUser = input.request?.user;
    const sanitizedDetails = input.details ? redactSensitiveFields(input.details) : undefined;

    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? reqUser?.sub ?? null,
        userEmail: input.userEmail ?? reqUser?.email ?? null,
        userRole: input.userRole ?? reqUser?.role ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId !== undefined && input.entityId !== null ? String(input.entityId) : null,
        detailsJson: sanitizedDetails ? JSON.stringify(sanitizedDetails) : null,
        ipAddress: input.request?.ip ?? null,
      },
    });
  } catch (err) {
    console.error('[AUDIT_ERROR]', err);
  }
}

const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'cpf', 'sus', 'token', 'refreshToken']);

function redactSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) {
      result[k] = '[REDACTED]';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = redactSensitiveFields(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}
