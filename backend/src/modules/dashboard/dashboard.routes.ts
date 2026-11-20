import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRoles } from '../../middlewares/auth.js';

export async function dashboardRoutes(app: FastifyInstance) {
  // Indicadores reais calculados diretamente do banco de dados (zero mocks!)
  app.get(
    '/dashboard/summary',
    {
      preHandler: [authenticate],
      schema: { tags: ['Dashboard'], summary: 'Retorna indicadores operacionais reais do BLH' },
    },
    async () => {
      const [donors, bottles, movements] = await Promise.all([
        prisma.donor.findMany({ select: { aptidao: true, statusCadastro: true } }),
        prisma.bottle.findMany({ select: { volume: true, temp: true, statusPast: true } }),
        prisma.glassInventoryMovement.findMany({ select: { type: true, quantity: true } }),
      ]);

      const totalDonors = donors.length;
      const activeDonors = donors.filter((d) => d.statusCadastro === 'ativa').length;
      const inactiveDonors = donors.filter((d) => d.statusCadastro === 'inativa').length;
      const aptDonors = donors.filter(
        (d) => d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
      ).length;
      const inaptDonors = donors.filter(
        (d) => (d.aptidao === 'Inapta' && d.statusCadastro === 'ativa') || d.statusCadastro === 'inativa'
      ).length;

      const totalBottles = bottles.length;
      const totalVolumeMl = bottles.reduce((acc, b) => acc + b.volume, 0);
      const averageTemp =
        totalBottles > 0
          ? (bottles.reduce((acc, b) => acc + b.temp, 0) / totalBottles).toFixed(1)
          : null;

      // Estoque patrimonial real a partir do ledger de movimentos
      let initialStock = 0;
      let delivered = 0;
      let collected = 0;
      let returnedEmpty = 0;
      let broken = 0;

      for (const m of movements) {
        if (m.type === 'INITIAL_STOCK') initialStock += m.quantity;
        else if (m.type === 'DELIVERED_TO_DONOR') delivered += m.quantity;
        else if (m.type === 'COLLECTED_FROM_DONOR') collected += m.quantity;
        else if (m.type === 'RETURNED_EMPTY') returnedEmpty += m.quantity;
        else if (m.type === 'BROKEN_LOST') broken += m.quantity;
      }

      const inventoryStock = Math.max(0, initialStock - delivered + returnedEmpty - broken);
      const bottlesWithMothers = Math.max(0, delivered - collected - returnedEmpty);
      const returnRate =
        delivered > 0
          ? `${Math.min(100, (((collected + returnedEmpty) / delivered) * 100)).toFixed(1)}%`
          : '—';

      return {
        stats: {
          totalDonors,
          activeDonors,
          inactiveDonors,
          aptDonors,
          inaptDonors,
          totalBottles,
          totalVolumeMl,
          averageTemp: averageTemp ?? '—',
          inventoryStock,
          bottlesWithMothers,
          returnRate,
        },
      };
    }
  );

  // Frota e equipe reais do banco
  app.get(
    '/fleet',
    {
      preHandler: [authenticate],
      schema: { tags: ['Frota'], summary: 'Listar veículos, motoristas e coletores cadastrados' },
    },
    async () => {
      const [vehicles, staff] = await Promise.all([
        prisma.vehicle.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
        prisma.staffMember.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      ]);
      return {
        vehicles,
        drivers: staff.filter((s) => s.role === 'motorista'),
        collectors: staff.filter((s) => s.role === 'coletor'),
      };
    }
  );

  // Trilha de auditoria (restrita a ADMIN e COORDENADOR_BLH)
  app.get(
    '/audit-logs',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: { tags: ['Auditoria'], summary: 'Consultar logs imutáveis de auditoria' },
    },
    async () => {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return { data: logs };
    }
  );
}
