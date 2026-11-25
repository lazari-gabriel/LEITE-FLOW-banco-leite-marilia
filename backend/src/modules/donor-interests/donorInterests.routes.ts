import crypto from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireRoles } from '../../middlewares/auth.js';
import { normalizeDigits, serializeDonorForRole } from '../../lib/domain.js';
import { recordAudit } from '../../lib/audit.js';
import {
  createValidatedDonor,
  donorFormSchema,
  DonorValidationError,
} from '../donors/donorCreation.service.js';

export const CONSENT_VERSION = 'LGPD-CAPTACAO-v1.0';

const INTEREST_STATUSES = [
  'NOVA',
  'AGUARDANDO_ANALISE',
  'AGUARDANDO_CONTATO',
  'EM_CONTATO',
  'AGUARDANDO_RETORNO',
  'ENCAMINHADA_CADASTRO',
  'NAO_PROSSEGUIU',
  'ENCERRADA',
] as const;

const MANUAL_UPDATABLE_STATUSES = [
  'NOVA',
  'AGUARDANDO_ANALISE',
  'AGUARDANDO_CONTATO',
  'EM_CONTATO',
  'AGUARDANDO_RETORNO',
  'NAO_PROSSEGUIU',
  'ENCERRADA',
] as const;

const CLOSED_STATUSES = new Set<string>(['ENCAMINHADA_CADASTRO', 'NAO_PROSSEGUIU', 'ENCERRADA']);

const publicInterestSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(4, 'Informe seu nome completo.')
      .max(120, 'Nome muito longo.')
      .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, {
        message: 'Informe seu nome e sobrenome.',
      }),
    birthDate: z
      .string()
      .trim()
      .optional()
      .default('')
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), {
        message: 'Data de nascimento inválida.',
      }),
    city: z.string().trim().min(2, 'Informe a cidade.').max(80).default('Marília'),
    neighborhood: z.string().trim().min(2, 'Informe o bairro.').max(100),
    cep: z
      .string()
      .trim()
      .optional()
      .default('')
      .refine((v) => !v || normalizeDigits(v).length === 8, {
        message: 'CEP deve conter 8 dígitos.',
      }),
    suggestedZone: z
      .enum(['Norte', 'Sul', 'Oeste', 'Leste', 'Rural', ''])
      .optional()
      .default(''),
    phone: z
      .string()
      .trim()
      .min(10, 'Informe um telefone celular válido com DDD.')
      .max(25)
      .refine((v) => {
        const d = normalizeDigits(v);
        return d.length === 10 || d.length === 11;
      }, 'Informe um telefone celular válido com DDD (10 ou 11 dígitos).'),
    isWhatsappSame: z.boolean().default(true),
    whatsapp: z.string().trim().max(25).optional().default(''),
    email: z
      .string()
      .trim()
      .max(120)
      .optional()
      .default('')
      .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: 'Informe um e-mail válido.',
      }),
    preferredContact: z.enum(['WHATSAPP', 'LIGACAO', 'EMAIL']).default('WHATSAPP'),
    bestContactTime: z
      .enum(['MANHA', 'TARDE', 'COMERCIAL', 'QUALQUER_HORARIO'])
      .default('QUALQUER_HORARIO'),
    donatedBefore: z.boolean().default(false),
    knowsProcess: z.enum(['SIM', 'PARCIALMENTE', 'NAO']).default('NAO'),
    hasQuestions: z.boolean().default(false),
    questionsText: z.string().trim().max(500).optional().default(''),
    discoveryChannel: z
      .enum([
        'SITE',
        'REDES_SOCIAIS',
        'MATERNIDADE_HOSPITAL',
        'UBS_POSTO_SAUDE',
        'INDICACAO',
        'CAMPANHA',
        'OUTRO',
      ])
      .default('SITE'),
    sourceOrigin: z.string().trim().max(80).optional().default('SITE_INSTITUCIONAL'),
    consentAccepted: z.literal(true, {
      errorMap: () => ({
        message: 'É necessário concordar com o aviso de privacidade e consentimento LGPD.',
      }),
    }),
    // Campos anti-spam
    website: z.string().optional().default(''),
    elapsedMs: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isWhatsappSame && data.whatsapp) {
      const wDigits = normalizeDigits(data.whatsapp);
      if (wDigits.length !== 10 && wDigits.length !== 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['whatsapp'],
          message: 'Informe um WhatsApp válido com DDD.',
        });
      }
    }
    if (data.preferredContact === 'EMAIL' && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Informe um e-mail quando a preferência de contato for E-mail.',
      });
    }
    if (data.birthDate) {
      const d = new Date(`${data.birthDate}T00:00:00`);
      const now = new Date();
      if (isNaN(d.getTime()) || d > now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthDate'],
          message: 'Data de nascimento inválida.',
        });
      }
    }
  });

const statusUpdateSchema = z
  .object({
    status: z.enum(MANUAL_UPDATABLE_STATUSES),
    closureReason: z.string().trim().max(300).optional(),
    notes: z.string().trim().max(500).optional(),
    nextFollowUpAt: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.status === 'NAO_PROSSEGUIU' || data.status === 'ENCERRADA') &&
      (!data.closureReason || data.closureReason.trim().length < 3)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['closureReason'],
        message: 'Informe o motivo ao finalizar ou encerrar a solicitação.',
      });
    }
  });

const notesUpdateSchema = z.object({
  adminNotes: z.string().trim().max(1000).optional().nullable(),
  suggestedZone: z.enum(['Norte', 'Sul', 'Oeste', 'Leste', 'Rural']).optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
  assignedToUserId: z.string().optional().nullable(),
});

const contactAttemptSchema = z.object({
  channel: z.enum(['WHATSAPP', 'LIGACAO', 'EMAIL', 'PRESENCIAL']),
  outcome: z.enum([
    'ATENDEU',
    'SEM_RESPOSTA',
    'CAIXA_POSTAL',
    'RETORNO_AGENDADO',
    'NUMERO_INVALIDO',
  ]),
  notes: z.string().trim().max(500).optional().default(''),
  nextFollowUpAt: z.string().optional().nullable(),
  nextStatus: z.enum(MANUAL_UPDATABLE_STATUSES).optional(),
});

function hashIp(ip?: string): string | null {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

async function generateNextProtocol(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CAP-${year}-`;
  const latest = await prisma.donorInterest.findFirst({
    where: { protocol: { startsWith: prefix } },
    orderBy: { protocol: 'desc' },
    select: { protocol: true },
  });

  let nextSeq = 1;
  if (latest) {
    const match = /-(\d+)$/.exec(latest.protocol);
    if (match) nextSeq = Number(match[1]) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(6, '0')}`;
}

function normalizeNameForCompare(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function findPossibleDonorDuplicates(phoneNormalized: string, fullName: string) {
  const donors = await prisma.donor.findMany({
    select: {
      id: true,
      code: true,
      nome: true,
      telefone: true,
      zona: true,
      aptidao: true,
      statusCadastro: true,
      bairro: true,
    },
  });

  const targetName = normalizeNameForCompare(fullName);
  const phoneTail = phoneNormalized.length >= 8 ? phoneNormalized.slice(-8) : phoneNormalized;

  const matches: Array<{
    donorId: number;
    code: string;
    nome: string;
    zona: string;
    bairro: string;
    aptidao: string;
    statusCadastro: string;
    matchReason: 'TELEFONE' | 'NOME' | 'TELEFONE_E_NOME';
  }> = [];

  for (const d of donors) {
    const dPhone = normalizeDigits(d.telefone);
    const phoneMatch =
      phoneNormalized.length >= 10 &&
      (dPhone === phoneNormalized || (phoneTail.length === 8 && dPhone.endsWith(phoneTail)));
    const dName = normalizeNameForCompare(d.nome);
    const nameMatch = targetName.length >= 4 && dName === targetName;

    if (phoneMatch || nameMatch) {
      matches.push({
        donorId: d.id,
        code: d.code,
        nome: d.nome,
        zona: d.zona,
        bairro: d.bairro,
        aptidao: d.aptidao,
        statusCadastro: d.statusCadastro,
        matchReason:
          phoneMatch && nameMatch ? 'TELEFONE_E_NOME' : phoneMatch ? 'TELEFONE' : 'NOME',
      });
    }
  }

  return matches;
}

export async function donorInterestsRoutes(app: FastifyInstance) {
  // ── 1. ENDPOINT PÚBLICO (WRITE-ONLY, SEM EXPOSIÇÃO DE DADOS DE TERCEIROS) ───
  app.post(
    '/public/donor-interests',
    {
      config: {
        rateLimit: { max: 5, timeWindow: '15 minutes' },
      },
      schema: {
        tags: ['Captação Pública'],
        summary: 'Registrar interesse público em se tornar doadora de leite humano',
      },
    },
    async (request, reply) => {
      const parsed = publicInterestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          type: 'about:blank',
          title: 'Dados inválidos',
          status: 400,
          detail: 'Verifique os campos obrigatórios do formulário de interesse.',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;

      // Proteção anti-bot (honeypot + tempo mínimo de preenchimento)
      if (data.website && data.website.trim().length > 0) {
        return reply.status(400).send({
          type: 'about:blank',
          title: 'Solicitação inválida',
          status: 400,
          detail: 'Não foi possível validar o envio do formulário.',
        });
      }
      if (typeof data.elapsedMs === 'number' && data.elapsedMs < 2000) {
        return reply.status(400).send({
          type: 'about:blank',
          title: 'Envio muito rápido',
          status: 400,
          detail: 'Revise seus dados antes de enviar a solicitação.',
        });
      }

      const phoneNormalized = normalizeDigits(data.phone);
      const whatsappRaw = data.isWhatsappSame ? data.phone : data.whatsapp || '';
      const whatsappNormalized = whatsappRaw ? normalizeDigits(whatsappRaw) : null;

      // Deduplicação silenciosa (anti-enumeração): evita ruído se mesmo telefone enviou nos últimos 7 dias em aberto
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);
      const recentOpen = await prisma.donorInterest.findFirst({
        where: {
          phoneNormalized,
          status: { notIn: ['ENCAMINHADA_CADASTRO', 'NAO_PROSSEGUIU', 'ENCERRADA'] },
          createdAt: { gte: sevenDaysAgo },
          anonymizedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentOpen) {
        return reply.status(201).send({
          protocol: recentOpen.protocol,
          submittedAt: recentOpen.createdAt.toISOString(),
          message:
            'Recebemos seu interesse! A equipe do Banco de Leite Humano de Marília entrará em contato pelo canal informado.',
        });
      }

      const protocol = await generateNextProtocol();
      const now = new Date();

      const created = await prisma.$transaction(async (tx) => {
        const interest = await tx.donorInterest.create({
          data: {
            protocol,
            fullName: data.fullName,
            birthDate: data.birthDate || null,
            city: data.city || 'Marília',
            neighborhood: data.neighborhood,
            cep: data.cep ? normalizeDigits(data.cep) : null,
            suggestedZone: data.suggestedZone || null,
            phone: data.phone,
            phoneNormalized,
            isWhatsappSame: data.isWhatsappSame,
            whatsapp: whatsappRaw || null,
            whatsappNormalized,
            email: data.email || null,
            preferredContact: data.preferredContact,
            bestContactTime: data.bestContactTime,
            donatedBefore: data.donatedBefore,
            knowsProcess: data.knowsProcess,
            hasQuestions: data.hasQuestions || Boolean(data.questionsText),
            questionsText: data.questionsText || null,
            discoveryChannel: data.discoveryChannel,
            sourceOrigin: data.sourceOrigin || 'SITE_INSTITUCIONAL',
            consentAccepted: true,
            consentAcceptedAt: now,
            consentVersion: CONSENT_VERSION,
            consentIpHash: hashIp(request.ip),
            status: 'NOVA',
          },
        });

        await tx.donorInterestEvent.create({
          data: {
            interestId: interest.id,
            eventType: 'CREATED',
            toStatus: 'NOVA',
            notes: `Solicitação recebida via ${interest.sourceOrigin} (${interest.discoveryChannel}).`,
          },
        });

        return interest;
      });

      await recordAudit({
        request,
        action: 'DONOR_INTEREST_CREATED',
        entity: 'DonorInterest',
        entityId: created.id,
        details: {
          protocol: created.protocol,
          city: created.city,
          suggestedZone: created.suggestedZone,
          discoveryChannel: created.discoveryChannel,
          consentVersion: created.consentVersion,
        },
      });

      return reply.status(201).send({
        protocol: created.protocol,
        submittedAt: created.createdAt.toISOString(),
        message:
          'Recebemos seu interesse! A equipe do Banco de Leite Humano de Marília entrará em contato pelo canal informado.',
      });
    }
  );

  // ── 2. RESUMO / NOTIFICAÇÕES INTERNAS (ADMIN E COORDENADOR_BLH) ────────────
  app.get(
    '/donor-interests/summary',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: {
        tags: ['Captação de Doadoras'],
        summary: 'Retornar contadores de solicitações de interesse para badges e dashboard',
      },
    },
    async () => {
      const [all, latest] = await Promise.all([
        prisma.donorInterest.findMany({
          select: { status: true },
        }),
        prisma.donorInterest.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      const countsByStatus: Record<string, number> = {};
      for (const s of INTEREST_STATUSES) countsByStatus[s] = 0;
      for (const item of all) {
        countsByStatus[item.status] = (countsByStatus[item.status] ?? 0) + 1;
      }

      const totalNew = countsByStatus.NOVA ?? 0;
      const totalInProgress =
        (countsByStatus.AGUARDANDO_ANALISE ?? 0) +
        (countsByStatus.AGUARDANDO_CONTATO ?? 0) +
        (countsByStatus.EM_CONTATO ?? 0) +
        (countsByStatus.AGUARDANDO_RETORNO ?? 0);
      const totalConverted = countsByStatus.ENCAMINHADA_CADASTRO ?? 0;

      return {
        summary: {
          totalAll: all.length,
          totalNew,
          totalPending: totalNew + totalInProgress,
          totalInProgress,
          totalConverted,
          countsByStatus,
          lastSubmissionAt: latest?.createdAt.toISOString() ?? null,
        },
      };
    }
  );

  // ── 3. LISTAGEM PAGINADA E FILTRADA (ADMIN E COORDENADOR_BLH) ──────────────
  app.get(
    '/donor-interests',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: {
        tags: ['Captação de Doadoras'],
        summary: 'Listar solicitações de captação com filtros e contadores',
      },
    },
    async (request) => {
      const q = request.query as Record<string, string | undefined>;
      const status = q.status && q.status !== 'TODOS' ? q.status : undefined;
      const search = q.search?.trim().toLowerCase() || '';
      const city = q.city?.trim().toLowerCase() || '';
      const zone = q.zone && q.zone !== 'Todas' ? q.zone : undefined;
      const unreviewedOnly = q.unreviewedOnly === 'true';
      const page = Math.max(1, Number(q.page) || 1);
      const pageSize = Math.min(50, Math.max(5, Number(q.pageSize) || 10));

      const allItems = await prisma.donorInterest.findMany({
        include: {
          assignedTo: { select: { id: true, name: true } },
          convertedBy: { select: { id: true, name: true } },
          convertedDonor: {
            select: { id: true, code: true, nome: true, aptidao: true, statusCadastro: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const countsByStatus: Record<string, number> = {};
      for (const s of INTEREST_STATUSES) countsByStatus[s] = 0;
      for (const item of allItems) {
        countsByStatus[item.status] = (countsByStatus[item.status] ?? 0) + 1;
      }

      const filtered = allItems.filter((item) => {
        if (unreviewedOnly && item.status !== 'NOVA') return false;
        if (status && item.status !== status) return false;
        if (zone && item.suggestedZone !== zone) return false;
        if (city && !item.city.toLowerCase().includes(city)) return false;
        if (search) {
          const searchDigits = normalizeDigits(search);
          const matchText =
            item.fullName.toLowerCase().includes(search) ||
            item.protocol.toLowerCase().includes(search) ||
            item.neighborhood.toLowerCase().includes(search) ||
            item.city.toLowerCase().includes(search) ||
            (item.email || '').toLowerCase().includes(search);
          const matchPhone =
            searchDigits.length >= 4 && item.phoneNormalized.includes(searchDigits);
          if (!matchText && !matchPhone) return false;
        }
        return true;
      });

      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);

      return {
        data: pageItems,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          countsByStatus,
        },
      };
    }
  );

  // ── 4. DETALHES + TIMELINE + PRÉ-DUPLICIDADE ───────────────────────────────
  app.get(
    '/donor-interests/:id',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: {
        tags: ['Captação de Doadoras'],
        summary: 'Consultar detalhes completos, timeline de atendimento e possíveis duplicidades',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const interest = await prisma.donorInterest.findUnique({
        where: { id },
        include: {
          assignedTo: { select: { id: true, name: true } },
          convertedBy: { select: { id: true, name: true } },
          convertedDonor: {
            select: { id: true, code: true, nome: true, aptidao: true, statusCadastro: true },
          },
          events: {
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!interest) {
        return reply.status(404).send({
          type: 'about:blank',
          title: 'Solicitação não encontrada',
          status: 404,
          detail: 'A solicitação de captação informada não foi encontrada.',
        });
      }

      const possibleDuplicates = interest.anonymizedAt
        ? []
        : await findPossibleDonorDuplicates(interest.phoneNormalized, interest.fullName);

      return {
        interest,
        possibleDuplicates,
      };
    }
  );

  // ── 5. VERIFICAÇÃO DE DUPLICIDADE PRÉ-CONVERSÃO ────────────────────────────
  app.get(
    '/donor-interests/:id/duplicate-check',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: {
        tags: ['Captação de Doadoras'],
        summary: 'Verificar possíveis doadoras duplicadas antes de iniciar o cadastro oficial',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const interest = await prisma.donorInterest.findUnique({ where: { id } });
      if (!interest) {
        return reply.status(404).send({ title: 'Solicitação não encontrada', status: 404 });
      }
      if (interest.anonymizedAt) {
        return { matches: [] };
      }

      const matches = await findPossibleDonorDuplicates(
        interest.phoneNormalized,
        interest.fullName
      );
      return { matches };
    }
  );

  // ── 6. ATUALIZAR STATUS DE ATENDIMENTO ─────────────────────────────────────
  app.patch(
    '/donor-interests/:id/status',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: {
        tags: ['Captação de Doadoras'],
        summary: 'Atualizar status de acompanhamento da solicitação',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = statusUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          type: 'about:blank',
          title: 'Dados inválidos',
          status: 400,
          detail: 'Verifique o status e o motivo informados.',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const existing = await prisma.donorInterest.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ title: 'Solicitação não encontrada', status: 404 });
      }
      if (existing.status === 'ENCAMINHADA_CADASTRO' && existing.convertedDonorId) {
        return reply.status(409).send({
          type: 'about:blank',
          title: 'Solicitação já convertida',
          status: 409,
          detail:
            'Esta solicitação já foi convertida em cadastro oficial de doadora e não pode ter seu status alterado.',
        });
      }

      const { status, closureReason, notes, nextFollowUpAt } = parsed.data;
      const isClosing = status === 'NAO_PROSSEGUIU' || status === 'ENCERRADA';
      const retentionExpiresAt = isClosing
        ? new Date(Date.now() + 180 * 86400_000)
        : null;

      const updated = await prisma.$transaction(async (tx) => {
        const next = await tx.donorInterest.update({
          where: { id },
          data: {
            status,
            closureReason: isClosing ? closureReason?.trim() || null : null,
            retentionExpiresAt,
            ...(notes !== undefined ? { adminNotes: notes || null } : {}),
            ...(nextFollowUpAt !== undefined
              ? { nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null }
              : {}),
            assignedToUserId: existing.assignedToUserId ?? request.user.sub,
          },
          include: {
            assignedTo: { select: { id: true, name: true } },
            convertedBy: { select: { id: true, name: true } },
            convertedDonor: {
              select: { id: true, code: true, nome: true, aptidao: true, statusCadastro: true },
            },
            events: {
              include: { user: { select: { id: true, name: true, role: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        await tx.donorInterestEvent.create({
          data: {
            interestId: id,
            eventType: 'STATUS_CHANGED',
            fromStatus: existing.status,
            toStatus: status,
            notes: [closureReason, notes].filter(Boolean).join(' — ') || null,
            userId: request.user.sub,
          },
        });

        return next;
      });

      await recordAudit({
        request,
        action: 'DONOR_INTEREST_STATUS_UPDATED',
        entity: 'DonorInterest',
        entityId: id,
        details: {
          protocol: existing.protocol,
          fromStatus: existing.status,
          toStatus: status,
        },
      });

      const refreshed = await prisma.donorInterest.findUniqueOrThrow({
        where: { id },
        include: {
          assignedTo: { select: { id: true, name: true } },
          convertedBy: { select: { id: true, name: true } },
          convertedDonor: {
            select: { id: true, code: true, nome: true, aptidao: true, statusCadastro: true },
          },
          events: {
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return { interest: refreshed ?? updated };
    }
  );

  // ── 7. ATUALIZAR OBSERVAÇÕES ADMINISTRATIVAS ───────────────────────────────
  app.patch(
    '/donor-interests/:id/notes',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: {
        tags: ['Captação de Doadoras'],
        summary: 'Salvar observações administrativas, zona sugerida ou retorno agendado',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = notesUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          title: 'Dados inválidos',
          status: 400,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const existing = await prisma.donorInterest.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ title: 'Solicitação não encontrada', status: 404 });
      }

      const data = parsed.data;
      await prisma.$transaction(async (tx) => {
        await tx.donorInterest.update({
          where: { id },
          data: {
            ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes || null } : {}),
            ...(data.suggestedZone !== undefined ? { suggestedZone: data.suggestedZone } : {}),
            ...(data.nextFollowUpAt !== undefined
              ? { nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null }
              : {}),
            ...(data.assignedToUserId !== undefined
              ? { assignedToUserId: data.assignedToUserId }
              : {}),
          },
        });

        if (data.adminNotes) {
          await tx.donorInterestEvent.create({
            data: {
              interestId: id,
              eventType: 'NOTE_ADDED',
              notes: data.adminNotes,
              userId: request.user.sub,
            },
          });
        }
      });

      await recordAudit({
        request,
        action: 'DONOR_INTEREST_NOTES_UPDATED',
        entity: 'DonorInterest',
        entityId: id,
        details: { protocol: existing.protocol },
      });

      const refreshed = await prisma.donorInterest.findUniqueOrThrow({
        where: { id },
        include: {
          assignedTo: { select: { id: true, name: true } },
          convertedBy: { select: { id: true, name: true } },
          convertedDonor: {
            select: { id: true, code: true, nome: true, aptidao: true, statusCadastro: true },
          },
          events: {
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return { interest: refreshed };
    }
  );

  // ── 8. REGISTRAR TENTATIVA DE CONTATO ──────────────────────────────────────
  app.post(
    '/donor-interests/:id/contacts',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: {
        tags: ['Captação de Doadoras'],
        summary: 'Registrar tentativa de contato com a interessada',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = contactAttemptSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          title: 'Dados inválidos',
          status: 400,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const existing = await prisma.donorInterest.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ title: 'Solicitação não encontrada', status: 404 });
      }
      if (existing.status === 'ENCAMINHADA_CADASTRO' && existing.convertedDonorId) {
        return reply.status(409).send({
          title: 'Solicitação já convertida',
          status: 409,
          detail: 'Não é necessário registrar novas tentativas de captação após conversão.',
        });
      }

      const { channel, outcome, notes, nextFollowUpAt, nextStatus } = parsed.data;
      const computedNextStatus =
        nextStatus ??
        (outcome === 'RETORNO_AGENDADO' || outcome === 'SEM_RESPOSTA' || outcome === 'CAIXA_POSTAL'
          ? 'AGUARDANDO_RETORNO'
          : CLOSED_STATUSES.has(existing.status)
          ? existing.status
          : 'EM_CONTATO');

      const now = new Date();
      await prisma.$transaction(async (tx) => {
        await tx.donorInterest.update({
          where: { id },
          data: {
            status: computedNextStatus,
            contactAttemptsCount: { increment: 1 },
            lastContactAt: now,
            assignedToUserId: existing.assignedToUserId ?? request.user.sub,
            ...(nextFollowUpAt !== undefined
              ? { nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null }
              : {}),
          },
        });

        await tx.donorInterestEvent.create({
          data: {
            interestId: id,
            eventType: 'CONTACT_ATTEMPT',
            fromStatus: existing.status,
            toStatus: computedNextStatus,
            channel,
            outcome,
            notes: notes || null,
            userId: request.user.sub,
          },
        });
      });

      await recordAudit({
        request,
        action: 'DONOR_INTEREST_CONTACT_LOGGED',
        entity: 'DonorInterest',
        entityId: id,
        details: {
          protocol: existing.protocol,
          channel,
          outcome,
          toStatus: computedNextStatus,
        },
      });

      const refreshed = await prisma.donorInterest.findUniqueOrThrow({
        where: { id },
        include: {
          assignedTo: { select: { id: true, name: true } },
          convertedBy: { select: { id: true, name: true } },
          convertedDonor: {
            select: { id: true, code: true, nome: true, aptidao: true, statusCadastro: true },
          },
          events: {
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return reply.status(201).send({ interest: refreshed });
    }
  );

  // ── 9. CONVERSÃO ATÔMICA EM DOADORA OFICIAL + TRIAGEM GO/NO-GO ─────────────
  app.post(
    '/donor-interests/:id/convert',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: {
        tags: ['Captação de Doadoras'],
        summary: 'Converter solicitação de captação em cadastro oficial de doadora (transação atômica)',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const parsed = donorFormSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          type: 'about:blank',
          title: 'Dados de cadastro inválidos',
          status: 400,
          detail: 'Verifique os campos obrigatórios da ficha de triagem oficial.',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const existing = await prisma.donorInterest.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({
          type: 'about:blank',
          title: 'Solicitação não encontrada',
          status: 404,
          detail: 'Solicitação de captação não localizada.',
        });
      }
      if (existing.anonymizedAt) {
        return reply.status(409).send({
          type: 'about:blank',
          title: 'Solicitação anonimizada',
          status: 409,
          detail: 'Não é possível converter uma solicitação já anonimizada por solicitação LGPD.',
        });
      }
      if (existing.convertedDonorId || existing.status === 'ENCAMINHADA_CADASTRO') {
        return reply.status(409).send({
          type: 'about:blank',
          title: 'Solicitação já convertida',
          status: 409,
          detail: 'Esta solicitação já foi convertida em cadastro oficial de doadora.',
        });
      }

      try {
        const result = await prisma.$transaction(async (tx) => {
          const { created: donor, verdict } = await createValidatedDonor(
            tx,
            parsed.data,
            existing.consentAcceptedAt
          );

          const updatedInterest = await tx.donorInterest.update({
            where: { id },
            data: {
              status: 'ENCAMINHADA_CADASTRO',
              convertedDonorId: donor.id,
              convertedAt: new Date(),
              convertedByUserId: request.user.sub,
              assignedToUserId: existing.assignedToUserId ?? request.user.sub,
              closureReason: null,
              retentionExpiresAt: null,
            },
            include: {
              assignedTo: { select: { id: true, name: true } },
              convertedBy: { select: { id: true, name: true } },
              convertedDonor: {
                select: { id: true, code: true, nome: true, aptidao: true, statusCadastro: true },
              },
            },
          });

          await tx.donorInterestEvent.create({
            data: {
              interestId: id,
              eventType: 'CONVERTED',
              fromStatus: existing.status,
              toStatus: 'ENCAMINHADA_CADASTRO',
              notes: `Convertida no cadastro oficial ${donor.code} (Aptidão inicial: ${donor.aptidao}).`,
              userId: request.user.sub,
            },
          });

          return { donor, verdict, interest: updatedInterest };
        });

        await recordAudit({
          request,
          action: 'DONOR_INTEREST_CONVERTED',
          entity: 'DonorInterest',
          entityId: id,
          details: {
            protocol: existing.protocol,
            donorId: result.donor.id,
            donorCode: result.donor.code,
            aptidao: result.donor.aptidao,
          },
        });

        await recordAudit({
          request,
          action: 'DONOR_CREATED',
          entity: 'Donor',
          entityId: result.donor.id,
          details: {
            code: result.donor.code,
            zona: result.donor.zona,
            aptidao: result.donor.aptidao,
            originProtocol: existing.protocol,
          },
        });

        return reply.status(201).send({
          donor: {
            ...serializeDonorForRole(result.donor, request.user.role),
            interestOriginProtocol: existing.protocol,
          },
          verdict: result.verdict,
          interest: result.interest,
        });
      } catch (err) {
        if (err instanceof DonorValidationError) {
          return reply.status(err.status).send({
            type: 'about:blank',
            title: err.title,
            status: err.status,
            detail: err.message,
          });
        }
        throw err;
      }
    }
  );

  // ── 10. ANONIMIZAÇÃO LGPD (SOMENTE ADMIN) ──────────────────────────────────
  app.post(
    '/donor-interests/:id/anonymize',
    {
      preHandler: [requireRoles('ADMIN')],
      schema: {
        tags: ['Captação de Doadoras'],
        summary: 'Anonimizar dados pessoais de uma solicitação conforme direito de eliminação LGPD',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await prisma.donorInterest.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ title: 'Solicitação não encontrada', status: 404 });
      }
      if (existing.anonymizedAt) {
        return reply.status(409).send({
          title: 'Solicitação já anonimizada',
          status: 409,
          detail: 'Os dados pessoais desta solicitação já foram anonimizados.',
        });
      }

      const now = new Date();
      const updated = await prisma.$transaction(async (tx) => {
        const anon = await tx.donorInterest.update({
          where: { id },
          data: {
            fullName: `Titular Anonimizada (${existing.protocol})`,
            birthDate: null,
            cep: null,
            phone: 'ANONIMIZADO',
            phoneNormalized: `ANON-${existing.id.slice(-8)}`,
            whatsapp: null,
            whatsappNormalized: null,
            email: null,
            questionsText: null,
            adminNotes: null,
            consentIpHash: null,
            status:
              existing.status === 'ENCAMINHADA_CADASTRO' ? existing.status : 'ENCERRADA',
            closureReason:
              existing.closureReason || 'Dados pessoais anonimizados por solicitação LGPD',
            anonymizedAt: now,
          },
        });

        await tx.donorInterestEvent.create({
          data: {
            interestId: id,
            eventType: 'ANONYMIZED',
            fromStatus: existing.status,
            toStatus: anon.status,
            notes: 'Dados pessoais removidos/anonimizados em conformidade com a LGPD.',
            userId: request.user.sub,
          },
        });

        return anon;
      });

      await recordAudit({
        request,
        action: 'DONOR_INTEREST_ANONYMIZED',
        entity: 'DonorInterest',
        entityId: id,
        details: { protocol: existing.protocol },
      });

      return { interest: updated };
    }
  );
}
