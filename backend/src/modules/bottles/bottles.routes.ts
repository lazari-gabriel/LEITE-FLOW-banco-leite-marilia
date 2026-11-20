import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRoles } from '../../middlewares/auth.js';
import { calculateRawMilkExpiryDate, formatDateTimeBR } from '../../lib/domain.js';
import { recordAudit } from '../../lib/audit.js';

const createCollectionSchema = z.object({
  doadoraId: z.number().int().positive(),
  routeId: z.string().optional(),
  volume: z.number().int().min(10).max(2000),
  temp: z.number().min(-40).max(40),
  classe: z.enum(['C', 'T', 'M']),
  frascosEntregues: z.number().int().min(0).max(50).default(0),
  firstExpressionAt: z.string().optional(),
  observacao: z.string().max(500).optional(),
});

const batchCollectionSchema = z.object({
  doadoraId: z.number().int().positive(),
  routeId: z.string().optional(),
  frascosEntregues: z.number().int().min(0).max(50).default(0),
  observacao: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        volume: z.number().int().min(10).max(2000),
        temp: z.number().min(-40).max(40),
        classe: z.enum(['C', 'T', 'M']),
        firstExpressionAt: z.string().min(8),
        observacao: z.string().max(500).optional(),
      })
    )
    .min(1)
    .max(20),
});

const labUpdateSchema = z.object({
  acidezDornicNum: z.number().min(0).max(25),
  crematocritoKcal: z.number().int().min(100).max(1500),
  microbiologyPassed: z.boolean().optional(),
  statusPast: z.enum(['Em Análise', 'Em Quarentena', 'Pasteurizado', 'Descartado']),
  discardReason: z.string().optional(),
});

const dispenseSchema = z.object({
  destinoUTI: z.string().trim().min(2),
});

const labelPrintSchema = z.object({
  labelType: z.enum(['coleta', 'estocagem', 'pasteurizacao']),
  format: z.enum(['60x40mm', '100x50mm', 'A4_BATCH', 'ZPL']).default('60x40mm'),
  reason: z.string().trim().optional(),
});

const voidLabelSchema = z.object({
  voidReason: z.string().trim().min(3),
});

async function getNextBottleSequenceStart(): Promise<{ prefix: string; startSeq: number }> {
  const year = new Date().getFullYear();
  const prefix = `LF-${year}-`;
  const latest = await prisma.bottle.findFirst({
    where: { codigo: { startsWith: prefix } },
    orderBy: { id: 'desc' },
    select: { codigo: true },
  });

  let startSeq = 1;
  if (latest) {
    const match = /-(\d+)$/.exec(latest.codigo);
    if (match) startSeq = Number(match[1]) + 1;
  }

  return { prefix, startSeq };
}

function serializeBottle(b: {
  id: number;
  codigo: string;
  donorId: number;
  visitId: string | null;
  doadoraNome: string;
  zona: string;
  volume: number;
  temp: number;
  classe: string;
  extracao: string;
  equipamento: string;
  firstExpressionAt: Date | null;
  dataHoraColeta: string;
  validadeCru: string;
  statusPast: string;
  acidez: string | null;
  acidezDornicNum: number | null;
  crematocrito: string | null;
  crematocritoKcal: number | null;
  microbiologyPassed: boolean | null;
  pasteurizedAt: Date | null;
  pasteurizedExpiresAt: Date | null;
  destinoUTI: string;
  discardReason: string | null;
  responsavel: string;
  frascosEntregues: number | null;
  observacao: string | null;
  donor?: { parto: string } | null;
}) {
  return {
    id: b.id,
    codigo: b.codigo,
    doadoraId: b.donorId,
    visitId: b.visitId ?? undefined,
    doadoraNome: b.doadoraNome,
    babyBirthDate: b.donor?.parto ?? undefined,
    zona: b.zona,
    volume: b.volume,
    temp: b.temp,
    classe: b.classe,
    extracao: b.extracao,
    equipamento: b.equipamento,
    firstExpressionAt: b.firstExpressionAt?.toISOString(),
    dataHoraColeta: b.dataHoraColeta,
    validadeCru: b.validadeCru,
    statusPast: b.statusPast,
    acidez: b.acidez,
    acidezDornicNum: b.acidezDornicNum ?? undefined,
    crematocrito: b.crematocrito,
    crematocritoKcal: b.crematocritoKcal ?? undefined,
    microbiologyPassed: b.microbiologyPassed ?? undefined,
    pasteurizedAt: b.pasteurizedAt?.toISOString(),
    pasteurizedExpiresAt: b.pasteurizedExpiresAt
      ? b.pasteurizedExpiresAt.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : undefined,
    destinoUTI: b.destinoUTI,
    discardReason: b.discardReason ?? undefined,
    responsavel: b.responsavel,
    frascosEntregues: b.frascosEntregues ?? undefined,
    observacao: b.observacao ?? undefined,
  };
}

export async function bottlesRoutes(app: FastifyInstance) {
  // Listar frascos com data de nascimento do bebê da doadora
  app.get(
    '/bottles',
    {
      preHandler: [authenticate],
      schema: { tags: ['Frascos & Laboratório'], summary: 'Listar frascos coletados' },
    },
    async () => {
      const bottles = await prisma.bottle.findMany({
        include: { donor: { select: { parto: true } } },
        orderBy: { id: 'desc' },
      });
      return { data: bottles.map(serializeBottle) };
    }
  );

  // Registrar coleta individual (compatibilidade + cálculo exato a partir da 1ª ordenha)
  app.post(
    '/bottles',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH', 'COLETOR_CAMPO')],
      schema: { tags: ['Frascos & Laboratório'], summary: 'Registrar coleta domiciliar de 1 frasco' },
    },
    async (request, reply) => {
      const parsed = createCollectionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          title: 'Dados de coleta inválidos',
          status: 400,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;
      const donor = await prisma.donor.findUnique({ where: { id: data.doadoraId } });
      if (!donor) return reply.status(404).send({ title: 'Doadora não encontrada', status: 404 });
      if (donor.aptidao !== 'Apta' || donor.statusCadastro !== 'ativa') {
        return reply.status(422).send({
          title: 'Doadora não liberada para coleta',
          status: 422,
          detail: 'Apenas doadoras ativas e com aptidão Apta (GO) podem ter coletas registradas.',
        });
      }

      const now = new Date();
      const firstExpr = data.firstExpressionAt ? new Date(data.firstExpressionAt) : now;
      const validFirstExpr = isNaN(firstExpr.getTime()) ? now : firstExpr;
      const expiry = calculateRawMilkExpiryDate(validFirstExpr);
      const { prefix, startSeq } = await getNextBottleSequenceStart();
      const codigo = `${prefix}${String(startSeq).padStart(6, '0')}`;

      let visitId: string | null = null;
      let responsavel = request.user.name;

      if (data.routeId) {
        const route = await prisma.route.findUnique({ where: { id: data.routeId } });
        if (route?.collectorName) responsavel = route.collectorName;
        const visit = await prisma.collectionVisit.findUnique({
          where: { routeId_donorId: { routeId: data.routeId, donorId: donor.id } },
        });
        if (visit) visitId = visit.id;
      }

      const created = await prisma.$transaction(async (tx) => {
        const bottle = await tx.bottle.create({
          data: {
            codigo,
            donorId: donor.id,
            visitId,
            doadoraNome: donor.nome,
            zona: donor.zona,
            volume: data.volume,
            temp: data.temp,
            classe: data.classe,
            extracao: donor.extracao || 'Ordenha Manual',
            equipamento: donor.equipamento || 'Freezer',
            firstExpressionAt: validFirstExpr,
            dataHoraColeta: formatDateTimeBR(now),
            collectedAt: now,
            validadeCru: expiry.formatted,
            rawExpiresAt: expiry.date,
            statusPast: 'Em Triagem',
            acidez: null,
            crematocrito: null,
            destinoUTI: 'Aguardando Análise Laboratorial',
            responsavel,
            frascosEntregues: data.frascosEntregues,
            observacao: data.observacao || null,
          },
          include: { donor: { select: { parto: true } } },
        });

        if (visitId) {
          await tx.collectionVisit.update({
            where: { id: visitId },
            data: {
              status: 'completed',
              completedAt: now,
              emptyJarsDelivered: { increment: data.frascosEntregues },
              notes: data.observacao || undefined,
            },
          });
        }

        await tx.glassInventoryMovement.create({
          data: {
            donorId: donor.id,
            visitId,
            type: 'COLLECTED_FROM_DONOR',
            quantity: 1,
            notes: `Coleta do frasco ${codigo}`,
            userId: request.user.sub,
          },
        });

        if (data.frascosEntregues > 0) {
          await tx.glassInventoryMovement.create({
            data: {
              donorId: donor.id,
              visitId,
              type: 'DELIVERED_TO_DONOR',
              quantity: data.frascosEntregues,
              notes: `Entrega de ${data.frascosEntregues} frasco(s) estéreis na visita`,
              userId: request.user.sub,
            },
          });
        }

        return bottle;
      });

      await recordAudit({
        request,
        action: 'BOTTLE_COLLECTED',
        entity: 'Bottle',
        entityId: created.id,
        details: { codigo: created.codigo, donorId: created.donorId, volume: created.volume },
      });

      return reply.status(201).send({ bottle: serializeBottle(created) });
    }
  );

  // Registrar coleta MULTI-FRASCO atômica em uma mesma visita (1:N)
  app.post(
    '/bottles/batch',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH', 'COLETOR_CAMPO')],
      schema: { tags: ['Frascos & Laboratório'], summary: 'Registrar múltiplos frascos em uma mesma visita' },
    },
    async (request, reply) => {
      const parsed = batchCollectionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          title: 'Dados de coleta em lote inválidos',
          status: 400,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;
      const donor = await prisma.donor.findUnique({ where: { id: data.doadoraId } });
      if (!donor) return reply.status(404).send({ title: 'Doadora não encontrada', status: 404 });
      if (donor.aptidao !== 'Apta' || donor.statusCadastro !== 'ativa') {
        return reply.status(422).send({
          title: 'Doadora não liberada para coleta',
          status: 422,
          detail: 'Apenas doadoras ativas e com aptidão Apta (GO) podem ter coletas registradas.',
        });
      }

      const now = new Date();
      const { prefix, startSeq } = await getNextBottleSequenceStart();
      let visitId: string | null = null;
      let responsavel = request.user.name;

      if (data.routeId) {
        const route = await prisma.route.findUnique({ where: { id: data.routeId } });
        if (route?.collectorName) responsavel = route.collectorName;
        const visit = await prisma.collectionVisit.findUnique({
          where: { routeId_donorId: { routeId: data.routeId, donorId: donor.id } },
        });
        if (visit) visitId = visit.id;
      }

      const createdBottles = await prisma.$transaction(async (tx) => {
        const created = [];
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          const firstExpr = new Date(item.firstExpressionAt);
          const validFirstExpr = isNaN(firstExpr.getTime()) ? now : firstExpr;
          const expiry = calculateRawMilkExpiryDate(validFirstExpr);
          const codigo = `${prefix}${String(startSeq + i).padStart(6, '0')}`;

          const b = await tx.bottle.create({
            data: {
              codigo,
              donorId: donor.id,
              visitId,
              doadoraNome: donor.nome,
              zona: donor.zona,
              volume: item.volume,
              temp: item.temp,
              classe: item.classe,
              extracao: donor.extracao || 'Ordenha Manual',
              equipamento: donor.equipamento || 'Freezer',
              firstExpressionAt: validFirstExpr,
              dataHoraColeta: formatDateTimeBR(now),
              collectedAt: now,
              validadeCru: expiry.formatted,
              rawExpiresAt: expiry.date,
              statusPast: 'Em Triagem',
              acidez: null,
              crematocrito: null,
              destinoUTI: 'Aguardando Análise Laboratorial',
              responsavel,
              frascosEntregues: i === 0 ? data.frascosEntregues : 0,
              observacao: item.observacao || data.observacao || null,
            },
            include: { donor: { select: { parto: true } } },
          });
          created.push(b);
        }

        if (visitId) {
          await tx.collectionVisit.update({
            where: { id: visitId },
            data: {
              status: 'completed',
              completedAt: now,
              emptyJarsDelivered: { increment: data.frascosEntregues },
              notes: data.observacao || undefined,
            },
          });
        }

        await tx.glassInventoryMovement.create({
          data: {
            donorId: donor.id,
            visitId,
            type: 'COLLECTED_FROM_DONOR',
            quantity: created.length,
            notes: `Coleta de ${created.length} frasco(s): ${created.map((c) => c.codigo).join(', ')}`,
            userId: request.user.sub,
          },
        });

        if (data.frascosEntregues > 0) {
          await tx.glassInventoryMovement.create({
            data: {
              donorId: donor.id,
              visitId,
              type: 'DELIVERED_TO_DONOR',
              quantity: data.frascosEntregues,
              notes: `Entrega de ${data.frascosEntregues} frasco(s) estéreis na visita`,
              userId: request.user.sub,
            },
          });
        }

        return created;
      });

      await recordAudit({
        request,
        action: 'BOTTLES_BATCH_COLLECTED',
        entity: 'CollectionVisit',
        entityId: visitId ?? String(donor.id),
        details: {
          donorId: donor.id,
          count: createdBottles.length,
          codes: createdBottles.map((c) => c.codigo),
        },
      });

      return reply.status(201).send({ bottles: createdBottles.map(serializeBottle) });
    }
  );

  // Registro laboratorial (Acidez Dornic, Crematócrito, Pasteurização / Descarte)
  app.patch(
    '/bottles/:id/lab',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH', 'LABORATORIO')],
      schema: { tags: ['Frascos & Laboratório'], summary: 'Registrar análise físico-química e pasteurização' },
    },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      const parsed = labUpdateSchema.safeParse(request.body);
      if (isNaN(id) || !parsed.success) {
        return reply.status(400).send({
          title: 'Dados laboratoriais inválidos',
          status: 400,
          errors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
        });
      }

      const bottle = await prisma.bottle.findUnique({ where: { id } });
      if (!bottle) return reply.status(404).send({ title: 'Frasco não encontrado', status: 404 });

      const d = parsed.data;
      if (d.statusPast === 'Pasteurizado' && d.acidezDornicNum > 8.0) {
        return reply.status(422).send({
          title: 'Reprovação por Acidez Dornic',
          status: 422,
          detail: 'Acidez Dornic > 8.0 °D impede liberação para pasteurização (RDC 171/2006).',
        });
      }
      if (d.statusPast === 'Pasteurizado' && d.microbiologyPassed === false) {
        return reply.status(422).send({
          title: 'Reprovação Microbiológica',
          status: 422,
          detail: 'Frasco com cultura microbiológica positiva não pode ser liberado como Pasteurizado.',
        });
      }

      const now = new Date();
      const pastExp = new Date(now);
      pastExp.setMonth(pastExp.getMonth() + 6);

      const updated = await prisma.bottle.update({
        where: { id },
        data: {
          acidezDornicNum: d.acidezDornicNum,
          acidez: `${d.acidezDornicNum.toFixed(1)} °D`,
          crematocritoKcal: d.crematocritoKcal,
          crematocrito: `${d.crematocritoKcal} Kcal/L`,
          microbiologyPassed: d.microbiologyPassed ?? null,
          statusPast: d.statusPast,
          discardReason: d.discardReason || null,
          ...(d.statusPast === 'Pasteurizado'
            ? {
                pasteurizedAt: now,
                pasteurizedExpiresAt: pastExp,
                destinoUTI: 'Liberado para Estoque UTI',
              }
            : d.statusPast === 'Descartado'
            ? {
                destinoUTI: `Descartado (${d.discardReason || 'Fora dos padrões sanitários'})`,
              }
            : {}),
        },
        include: { donor: { select: { parto: true } } },
      });

      await recordAudit({
        request,
        action: 'BOTTLE_LAB_UPDATED',
        entity: 'Bottle',
        entityId: updated.id,
        details: { statusPast: updated.statusPast, acidez: updated.acidez, crematocrito: updated.crematocrito },
      });

      return reply.send({ bottle: serializeBottle(updated) });
    }
  );

  // Dispensação UTI (apenas frascos Pasteurizados)
  app.patch(
    '/bottles/:id/dispense',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH', 'LABORATORIO')],
      schema: { tags: ['Frascos & Laboratório'], summary: 'Dispensar frasco pasteurizado à UTI Neonatal' },
    },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      const parsed = dispenseSchema.safeParse(request.body);
      if (isNaN(id) || !parsed.success) {
        return reply.status(400).send({ title: 'Destino UTI obrigatório', status: 400 });
      }

      const bottle = await prisma.bottle.findUnique({ where: { id } });
      if (!bottle) return reply.status(404).send({ title: 'Frasco não encontrado', status: 404 });
      if (bottle.statusPast !== 'Pasteurizado') {
        return reply.status(422).send({
          title: 'Frasco não liberado',
          status: 422,
          detail: 'Apenas frascos com status Pasteurizado podem ser dispensados para a UTI Neonatal.',
        });
      }

      const updated = await prisma.bottle.update({
        where: { id },
        data: {
          statusPast: 'Dispensado',
          destinoUTI: parsed.data.destinoUTI,
        },
        include: { donor: { select: { parto: true } } },
      });

      await recordAudit({
        request,
        action: 'BOTTLE_DISPENSED',
        entity: 'Bottle',
        entityId: updated.id,
        details: { destinoUTI: updated.destinoUTI },
      });

      return reply.send({ bottle: serializeBottle(updated) });
    }
  );

  // Listar histórico de emissões/reimpressões de etiquetas de um frasco
  app.get(
    '/bottles/:id/labels',
    {
      preHandler: [authenticate],
      schema: { tags: ['Etiquetas'], summary: 'Listar histórico de impressões e reimpressões do frasco' },
    },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (isNaN(id)) return reply.status(400).send({ title: 'ID inválido', status: 400 });

      const logs = await prisma.labelPrintLog.findMany({
        where: { bottleId: id },
        include: { printedBy: { select: { name: true, role: true } } },
        orderBy: { printedAt: 'desc' },
      });

      return {
        data: logs.map((l) => ({
          id: l.id,
          bottleId: l.bottleId,
          labelType: l.labelType,
          copyNumber: l.copyNumber,
          format: l.format,
          reason: l.reason,
          status: l.status,
          voidReason: l.voidReason,
          printedByName: l.printedBy?.name || 'Sistema',
          printedAt: l.printedAt.toISOString(),
        })),
      };
    }
  );

  // Registro auditado de emissão/reimpressão de etiqueta
  app.post(
    '/bottles/:id/labels',
    {
      preHandler: [authenticate],
      schema: { tags: ['Etiquetas'], summary: 'Registrar emissão/reimpressão auditada de etiqueta' },
    },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      const parsed = labelPrintSchema.safeParse(request.body);
      if (isNaN(id) || !parsed.success) {
        return reply.status(400).send({ title: 'Dados inválidos', status: 400 });
      }

      const bottle = await prisma.bottle.findUnique({ where: { id } });
      if (!bottle) return reply.status(404).send({ title: 'Frasco não encontrado', status: 404 });

      if (
        parsed.data.labelType === 'pasteurizacao' &&
        bottle.statusPast !== 'Pasteurizado' &&
        bottle.statusPast !== 'Dispensado'
      ) {
        return reply.status(422).send({
          title: 'Emissão bloqueada por segurança sanitária',
          status: 422,
          detail:
            'A etiqueta de UTI Neonatal (Modelo 3) só pode ser emitida após análise e liberação de pasteurização.',
        });
      }

      const previousCount = await prisma.labelPrintLog.count({
        where: { bottleId: id, labelType: parsed.data.labelType, status: 'valid' },
      });

      if (previousCount >= 1 && !parsed.data.reason) {
        return reply.status(422).send({
          title: 'Motivo de reimpressão obrigatório',
          status: 422,
          detail: 'Informe o motivo para emitir uma segunda via ou reimpressão da etiqueta.',
        });
      }

      const log = await prisma.labelPrintLog.create({
        data: {
          bottleId: id,
          labelType: parsed.data.labelType,
          copyNumber: previousCount + 1,
          format: parsed.data.format,
          reason: parsed.data.reason || (previousCount === 0 ? 'Emissão inicial' : null),
          printedByUserId: request.user.sub,
        },
        include: { printedBy: { select: { name: true } } },
      });

      await recordAudit({
        request,
        action: previousCount === 0 ? 'LABEL_PRINTED' : 'LABEL_REPRINTED',
        entity: 'LabelPrintLog',
        entityId: log.id,
        details: { bottleCode: bottle.codigo, labelType: log.labelType, copyNumber: log.copyNumber },
      });

      return reply.status(201).send({
        printLog: {
          id: log.id,
          bottleId: log.bottleId,
          labelType: log.labelType,
          copyNumber: log.copyNumber,
          format: log.format,
          reason: log.reason,
          status: log.status,
          printedByName: log.printedBy?.name || request.user.name,
          printedAt: log.printedAt.toISOString(),
        },
      });
    }
  );

  // Anular / invalidar uma etiqueta impressa
  app.patch(
    '/labels/:printId/void',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH', 'LABORATORIO')],
      schema: { tags: ['Etiquetas'], summary: 'Anular/cancelar etiqueta impressa com motivo auditado' },
    },
    async (request, reply) => {
      const printId = (request.params as { printId: string }).printId;
      const parsed = voidLabelSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ title: 'Motivo obrigatório para anulação', status: 400 });
      }

      const existing = await prisma.labelPrintLog.findUnique({ where: { id: printId } });
      if (!existing) return reply.status(404).send({ title: 'Registro de etiqueta não encontrado', status: 404 });

      const updated = await prisma.labelPrintLog.update({
        where: { id: printId },
        data: { status: 'voided', voidReason: parsed.data.voidReason },
      });

      await recordAudit({
        request,
        action: 'LABEL_VOIDED',
        entity: 'LabelPrintLog',
        entityId: updated.id,
        details: { bottleId: updated.bottleId, voidReason: parsed.data.voidReason },
      });

      return reply.send({ printLog: updated });
    }
  );
}
