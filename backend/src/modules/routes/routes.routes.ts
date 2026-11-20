import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRoles } from '../../middlewares/auth.js';
import { recordAudit } from '../../lib/audit.js';
import { BLH_COORDS } from '../../lib/domain.js';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function optimizeTwoOpt(
  nodes: { id: number; lat: number; lng: number }[],
  origin: [number, number] = BLH_COORDS
): number[] {
  if (nodes.length <= 2) return nodes.map((n) => n.id);

  // 1. Nearest Neighbor inicial
  const pool = [...nodes];
  const order: typeof nodes = [];
  let cur: [number, number] = origin;
  while (pool.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const d = haversineKm(cur[0], cur[1], pool[i].lat, pool[i].lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = pool.splice(bestIdx, 1)[0];
    order.push(next);
    cur = [next.lat, next.lng];
  }

  // 2. Refinamento 2-opt (elimina cruzamentos considerando partida e retorno ao BLH)
  const tourDist = (arr: typeof nodes) => {
    let sum = haversineKm(origin[0], origin[1], arr[0].lat, arr[0].lng);
    for (let i = 0; i < arr.length - 1; i++) {
      sum += haversineKm(arr[i].lat, arr[i].lng, arr[i + 1].lat, arr[i + 1].lng);
    }
    sum += haversineKm(arr[arr.length - 1].lat, arr[arr.length - 1].lng, origin[0], origin[1]);
    return sum;
  };

  let improved = true;
  let bestD = tourDist(order);
  while (improved) {
    improved = false;
    for (let i = 0; i < order.length - 1; i++) {
      for (let k = i + 1; k < order.length; k++) {
        const candidate = [
          ...order.slice(0, i),
          ...order.slice(i, k + 1).reverse(),
          ...order.slice(k + 1),
        ];
        const candD = tourDist(candidate);
        if (candD + 0.001 < bestD) {
          order.splice(0, order.length, ...candidate);
          bestD = candD;
          improved = true;
        }
      }
    }
  }

  return order.map((n) => n.id);
}

const routeCreateSchema = z.object({
  name: z.string().trim().min(1),
  day: z.enum(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']),
  zone: z.enum(['Norte', 'Sul', 'Oeste', 'Leste', 'Rural']),
  scheduledDate: z.string().optional(),
  driverName: z.string().trim().min(1),
  collectorName: z.string().trim().optional().default('Equipe BLH'),
  vehicleName: z.string().trim().min(1),
  vehiclePlate: z.string().trim().optional().default(''),
  shift: z.enum(['Manhã', 'Tarde', 'Integral']).default('Manhã'),
  donorIds: z.array(z.number().int().positive()).optional(),
  autoFillZoneDonors: z.boolean().optional(),
  notes: z.string().optional(),
});

const routeUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  shift: z.enum(['Manhã', 'Tarde', 'Integral']).optional(),
  vehicleName: z.string().trim().min(1).optional(),
  vehiclePlate: z.string().trim().optional(),
  driverName: z.string().trim().min(1).optional(),
  collectorName: z.string().trim().optional(),
  notes: z.string().optional(),
  donorIds: z.array(z.number().int().positive()).optional(),
});

const skipStopSchema = z.object({
  donorId: z.number().int().positive(),
  motivo: z.string().trim().min(3),
});

async function generateNextRouteCode(): Promise<string> {
  const routes = await prisma.route.findMany({ select: { code: true } });
  let maxNum = 0;
  for (const r of routes) {
    const m = /^ROT-(\d+)$/i.exec(r.code);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  }
  return `ROT-${String(maxNum + 1).padStart(2, '0')}`;
}

function serializeRoute(
  route: {
    id: string;
    code: string;
    name: string;
    scheduledDate: string;
    day: string;
    zone: string;
    shift: string;
    vehicleName: string;
    vehiclePlate: string | null;
    driverName: string;
    collectorName: string | null;
    status: string;
    notes: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    visits: {
      id: string;
      donorId: number;
      stopOrder: number;
      status: string;
      skipReason: string | null;
      skippedAt: Date | null;
      completedAt: Date | null;
      arrivedAt: Date | null;
      bottles: { id: number }[];
    }[];
  }
) {
  const orderedVisits = [...route.visits].sort((a, b) => a.stopOrder - b.stopOrder);
  return {
    id: route.id,
    code: route.code,
    name: route.name,
    scheduledDate: route.scheduledDate,
    day: route.day,
    zone: route.zone,
    shift: route.shift,
    vehicleName: route.vehicleName,
    vehiclePlate: route.vehiclePlate ?? undefined,
    driverName: route.driverName,
    collectorName: route.collectorName ?? undefined,
    status: route.status,
    notes: route.notes ?? undefined,
    createdAt: route.createdAt.toISOString(),
    startedAt: route.startedAt?.toISOString(),
    completedAt: route.completedAt?.toISOString(),
    donorIds: orderedVisits.map((v) => v.donorId),
    skippedStops: orderedVisits
      .filter((v) => v.status === 'skipped')
      .map((v) => ({
        donorId: v.donorId,
        motivo: v.skipReason || 'Não realizada',
        skippedAt: (v.skippedAt ?? new Date()).toISOString(),
      })),
    visits: orderedVisits.map((v) => ({
      id: v.id,
      donorId: v.donorId,
      stopOrder: v.stopOrder,
      status: v.status,
      skipReason: v.skipReason ?? undefined,
      arrivedAt: v.arrivedAt?.toISOString(),
      completedAt: v.completedAt?.toISOString(),
      bottleIds: v.bottles.map((b) => b.id),
    })),
  };
}

export async function routesRoutes(app: FastifyInstance) {
  // Listar todas as rotas com visitas
  app.get(
    '/routes',
    {
      preHandler: [authenticate],
      schema: { tags: ['Rotas'], summary: 'Listar rotas da frota e paradas vinculadas' },
    },
    async () => {
      const routes = await prisma.route.findMany({
        include: {
          visits: {
            include: { bottles: { select: { id: true } } },
            orderBy: { stopOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
      return { data: routes.map(serializeRoute) };
    }
  );

  // Criar rota
  app.post(
    '/routes',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: { tags: ['Rotas'], summary: 'Criar nova rota na frota' },
    },
    async (request, reply) => {
      const parsed = routeCreateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          title: 'Dados inválidos',
          status: 400,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;
      const code = await generateNextRouteCode();
      const scheduledDate = data.scheduledDate || new Date().toISOString().split('T')[0];

      let donorIds = data.donorIds ?? [];
      if (data.autoFillZoneDonors && donorIds.length === 0) {
        const sameDayRoutes = await prisma.route.findMany({
          where: { day: data.day, status: { not: 'canceled' } },
          include: { visits: { select: { donorId: true } } },
        });
        const assignedSet = new Set(sameDayRoutes.flatMap((r) => r.visits.map((v) => v.donorId)));
        const available = await prisma.donor.findMany({
          where: { zona: data.zone, aptidao: 'Apta', statusCadastro: 'ativa' },
          select: { id: true },
        });
        donorIds = available.map((d) => d.id).filter((id) => !assignedSet.has(id));
      }

      const uniqueDonorIds = [...new Set(donorIds)];

      const created = await prisma.route.create({
        data: {
          code,
          name: data.name,
          scheduledDate,
          day: data.day,
          zone: data.zone,
          shift: data.shift,
          vehicleName: data.vehicleName,
          vehiclePlate: data.vehiclePlate || null,
          driverName: data.driverName,
          collectorName: data.collectorName || 'Equipe BLH',
          status: 'planning',
          notes: data.notes || null,
          visits: {
            create: uniqueDonorIds.map((donorId, idx) => ({
              donorId,
              stopOrder: idx + 1,
              status: 'pending',
            })),
          },
        },
        include: { visits: { include: { bottles: { select: { id: true } } } } },
      });

      await recordAudit({
        request,
        action: 'ROUTE_CREATED',
        entity: 'Route',
        entityId: created.id,
        details: { code: created.code, zone: created.zone, stops: uniqueDonorIds.length },
      });

      return reply.status(201).send({ route: serializeRoute(created) });
    }
  );

  // Atualizar metadados ou lista de paradas da rota (apenas em planejamento para paradas)
  app.patch(
    '/routes/:id',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: { tags: ['Rotas'], summary: 'Atualizar metadados ou paradas da rota' },
    },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const existing = await prisma.route.findUnique({
        where: { id },
        include: { visits: true },
      });
      if (!existing) {
        return reply.status(404).send({ title: 'Rota não encontrada', status: 404 });
      }

      const parsed = routeUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          title: 'Dados inválidos',
          status: 400,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { donorIds, ...meta } = parsed.data;

      if (existing.status !== 'planning') {
        return reply.status(409).send({
          title: 'Rota travada',
          status: 409,
          detail: 'Rotas só podem ser editadas enquanto estão em planejamento.',
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (donorIds !== undefined) {
          const uniqueIds = [...new Set(donorIds)];
          await tx.collectionVisit.deleteMany({ where: { routeId: id } });
          if (uniqueIds.length > 0) {
            await tx.collectionVisit.createMany({
              data: uniqueIds.map((donorId, idx) => ({
                routeId: id,
                donorId,
                stopOrder: idx + 1,
                status: 'pending',
              })),
            });
          }
        }

        return tx.route.update({
          where: { id },
          data: {
            ...(meta.name !== undefined ? { name: meta.name } : {}),
            ...(meta.shift !== undefined ? { shift: meta.shift } : {}),
            ...(meta.vehicleName !== undefined ? { vehicleName: meta.vehicleName } : {}),
            ...(meta.vehiclePlate !== undefined ? { vehiclePlate: meta.vehiclePlate || null } : {}),
            ...(meta.driverName !== undefined ? { driverName: meta.driverName } : {}),
            ...(meta.collectorName !== undefined ? { collectorName: meta.collectorName || null } : {}),
            ...(meta.notes !== undefined ? { notes: meta.notes || null } : {}),
          },
          include: { visits: { include: { bottles: { select: { id: true } } } } },
        });
      });

      await recordAudit({
        request,
        action: 'ROUTE_UPDATED',
        entity: 'Route',
        entityId: updated.id,
        details: { code: updated.code },
      });

      return reply.send({ route: serializeRoute(updated) });
    }
  );

  // Iniciar rota (transição validada: planning -> active)
  app.post(
    '/routes/:id/start',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH', 'COLETOR_CAMPO')],
      schema: { tags: ['Rotas'], summary: 'Iniciar rota em campo (planning -> active)' },
    },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const route = await prisma.route.findUnique({
        where: { id },
        include: { visits: true },
      });
      if (!route) return reply.status(404).send({ title: 'Rota não encontrada', status: 404 });
      if (route.status !== 'planning') {
        return reply.status(409).send({
          title: 'Transição inválida',
          status: 409,
          detail: `Não é possível iniciar uma rota com status '${route.status}'.`,
        });
      }
      if (route.visits.length === 0) {
        return reply.status(422).send({
          title: 'Rota sem paradas',
          status: 422,
          detail: 'Adicione ao menos uma doadora antes de iniciar a rota.',
        });
      }

      const updated = await prisma.route.update({
        where: { id },
        data: { status: 'active', startedAt: new Date() },
        include: { visits: { include: { bottles: { select: { id: true } } } } },
      });

      await recordAudit({
        request,
        action: 'ROUTE_STARTED',
        entity: 'Route',
        entityId: updated.id,
        details: { code: updated.code },
      });

      return reply.send({ route: serializeRoute(updated) });
    }
  );

  // Finalizar rota (transição validada: active -> completed)
  app.post(
    '/routes/:id/finish',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH', 'COLETOR_CAMPO')],
      schema: { tags: ['Rotas'], summary: 'Finalizar rota (active -> completed)' },
    },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const route = await prisma.route.findUnique({
        where: { id },
        include: { visits: true },
      });
      if (!route) return reply.status(404).send({ title: 'Rota não encontrada', status: 404 });
      if (route.status !== 'active') {
        return reply.status(409).send({
          title: 'Transição inválida',
          status: 409,
          detail: `Apenas rotas ativas podem ser finalizadas (status atual: '${route.status}').`,
        });
      }

      if (route.visits.length === 0) {
        return reply.status(422).send({
          title: 'Rota sem paradas',
          status: 422,
          detail: 'Não é possível concluir uma rota sem nenhuma doadora vinculada.',
        });
      }

      const pendingCount = route.visits.filter(
        (v) => v.status !== 'completed' && v.status !== 'skipped'
      ).length;
      if (pendingCount > 0) {
        return reply.status(422).send({
          title: 'Paradas pendentes',
          status: 422,
          detail: `Ainda existem ${pendingCount} parada(s) sem conclusão ou justificativa.`,
        });
      }

      const updated = await prisma.route.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() },
        include: { visits: { include: { bottles: { select: { id: true } } } } },
      });

      await recordAudit({
        request,
        action: 'ROUTE_FINISHED',
        entity: 'Route',
        entityId: updated.id,
        details: { code: updated.code },
      });

      return reply.send({ route: serializeRoute(updated) });
    }
  );

  // Reabrir rota ativa que ficou sem nenhuma parada (evita deadlock operacional)
  app.post(
    '/routes/:id/reopen',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: {
        tags: ['Rotas'],
        summary: 'Retornar rota ativa vazia para planejamento (active sem paradas -> planning)',
      },
    },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const route = await prisma.route.findUnique({
        where: { id },
        include: { visits: true },
      });
      if (!route) return reply.status(404).send({ title: 'Rota não encontrada', status: 404 });
      if (route.status !== 'active') {
        return reply.status(409).send({
          title: 'Transição inválida',
          status: 409,
          detail: `Apenas rotas em trânsito sem paradas podem retornar ao planejamento (status atual: '${route.status}').`,
        });
      }
      if (route.visits.length > 0) {
        return reply.status(409).send({
          title: 'Rota possui paradas vinculadas',
          status: 409,
          detail: 'Rotas em trânsito com doadoras vinculadas não podem retornar ao planejamento.',
        });
      }

      const updated = await prisma.route.update({
        where: { id },
        data: { status: 'planning', startedAt: null },
        include: { visits: { include: { bottles: { select: { id: true } } } } },
      });

      await recordAudit({
        request,
        action: 'ROUTE_REOPENED_EMPTY',
        entity: 'Route',
        entityId: updated.id,
        details: { code: updated.code },
      });

      return reply.send({ route: serializeRoute(updated) });
    }
  );

  // Registrar parada não realizada (skip)
  app.post(
    '/routes/:id/skip',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH', 'COLETOR_CAMPO')],
      schema: { tags: ['Rotas'], summary: 'Marcar parada como não realizada com motivo' },
    },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const parsed = skipStopSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ title: 'Motivo obrigatório', status: 400 });
      }

      const route = await prisma.route.findUnique({ where: { id } });
      if (!route) return reply.status(404).send({ title: 'Rota não encontrada', status: 404 });
      if (route.status !== 'active') {
        return reply.status(409).send({
          title: 'Rota não está ativa',
          status: 409,
          detail: 'Inicie a rota antes de registrar ocorrências em paradas.',
        });
      }

      const visit = await prisma.collectionVisit.findUnique({
        where: { routeId_donorId: { routeId: id, donorId: parsed.data.donorId } },
      });
      if (!visit) {
        return reply.status(404).send({ title: 'Parada não encontrada nesta rota', status: 404 });
      }

      await prisma.collectionVisit.update({
        where: { id: visit.id },
        data: {
          status: 'skipped',
          skipReason: parsed.data.motivo,
          skippedAt: new Date(),
        },
      });

      const updated = await prisma.route.findUniqueOrThrow({
        where: { id },
        include: { visits: { include: { bottles: { select: { id: true } } } } },
      });

      await recordAudit({
        request,
        action: 'VISIT_SKIPPED',
        entity: 'CollectionVisit',
        entityId: visit.id,
        details: { routeId: id, donorId: parsed.data.donorId, motivo: parsed.data.motivo },
      });

      return reply.send({ route: serializeRoute(updated) });
    }
  );

  // Duplicar rota (SEM copiar paradas já alocadas no mesmo dia para evitar conflito!)
  app.post(
    '/routes/:id/duplicate',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: { tags: ['Rotas'], summary: 'Duplicar estrutura da rota sem conflito de doadoras' },
    },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const source = await prisma.route.findUnique({ where: { id } });
      if (!source) return reply.status(404).send({ title: 'Rota não encontrada', status: 404 });
      if (source.status !== 'planning') {
        return reply.status(409).send({
          title: 'Rota travada',
          status: 409,
          detail: 'Rotas só podem ser duplicadas enquanto estão em planejamento.',
        });
      }

      const code = await generateNextRouteCode();
      const created = await prisma.route.create({
        data: {
          code,
          name: `${source.name} (Cópia)`,
          scheduledDate: new Date().toISOString().split('T')[0],
          day: source.day,
          zone: source.zone,
          shift: source.shift,
          vehicleName: source.vehicleName,
          vehiclePlate: source.vehiclePlate,
          driverName: source.driverName,
          collectorName: source.collectorName,
          status: 'planning',
          notes: source.notes,
        },
        include: { visits: { include: { bottles: { select: { id: true } } } } },
      });

      await recordAudit({
        request,
        action: 'ROUTE_DUPLICATED',
        entity: 'Route',
        entityId: created.id,
        details: { sourceRouteId: source.id, code: created.code },
      });

      return reply.status(201).send({ route: serializeRoute(created) });
    }
  );

  // Otimizar sequência da rota no servidor (Nearest Neighbor + 2-opt)
  app.post(
    '/routes/:id/optimize',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: { tags: ['Rotas'], summary: 'Otimizar ordem das paradas com Nearest Neighbor + 2-opt' },
    },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const route = await prisma.route.findUnique({
        where: { id },
        include: {
          visits: {
            include: { donor: { select: { id: true, lat: true, lng: true } } },
            orderBy: { stopOrder: 'asc' },
          },
        },
      });
      if (!route) return reply.status(404).send({ title: 'Rota não encontrada', status: 404 });
      if (route.status !== 'planning') {
        return reply.status(409).send({
          title: 'Rota travada',
          status: 409,
          detail: 'Apenas rotas em planejamento podem ser reordenadas.',
        });
      }

      const nodes = route.visits.map((v) => ({
        id: v.donor.id,
        lat: v.donor.lat,
        lng: v.donor.lng,
      }));
      const optimizedIds = optimizeTwoOpt(nodes);

      await prisma.$transaction(
        optimizedIds.map((donorId, idx) =>
          prisma.collectionVisit.update({
            where: { routeId_donorId: { routeId: id, donorId } },
            data: { stopOrder: idx + 1 },
          })
        )
      );

      const updated = await prisma.route.findUniqueOrThrow({
        where: { id },
        include: { visits: { include: { bottles: { select: { id: true } } } } },
      });

      await recordAudit({
        request,
        action: 'ROUTE_OPTIMIZED_2OPT',
        entity: 'Route',
        entityId: id,
        details: { code: route.code, stopsCount: optimizedIds.length },
      });

      return reply.send({ route: serializeRoute(updated) });
    }
  );

  // Excluir rota (bloqueado se active)
  app.delete(
    '/routes/:id',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: { tags: ['Rotas'], summary: 'Excluir rota em planejamento ou concluída' },
    },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const route = await prisma.route.findUnique({ where: { id } });
      if (!route) return reply.status(404).send({ title: 'Rota não encontrada', status: 404 });
      if (route.status === 'active') {
        return reply.status(409).send({
          title: 'Rota em trânsito',
          status: 409,
          detail: 'Finalize a rota antes de removê-la.',
        });
      }

      await prisma.route.delete({ where: { id } });
      await recordAudit({
        request,
        action: 'ROUTE_DELETED',
        entity: 'Route',
        entityId: id,
        details: { code: route.code },
      });

      return reply.status(204).send();
    }
  );
}
