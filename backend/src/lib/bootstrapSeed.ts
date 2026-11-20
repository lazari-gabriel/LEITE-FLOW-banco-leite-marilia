import { prisma } from './prisma.js';
import { hashPassword } from './crypto.js';

/**
 * Bootstrap idempotente executado no startup da API.
 * Garante usuários RBAC iniciais, frota, equipe, rotas base e estoque inicial
 * mesmo em ambientes gratuitos sem acesso a Shell interativo (ex.: Render Free).
 */
export async function ensureInitialBootstrapData(): Promise<void> {
  const defaultUsers = [
    {
      name: 'Administrador BLH Marília',
      email: 'admin@leiteflow.org',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@2026',
      role: 'ADMIN',
    },
    {
      name: 'Enfª Cláudia Guimarães (Coordenação)',
      email: 'coordenacao@leiteflow.org',
      password: process.env.SEED_COORD_PASSWORD || 'Coord@2026',
      role: 'COORDENADOR_BLH',
    },
    {
      name: 'Carlos Alberto Silva (Coleta Externa)',
      email: 'coletor@leiteflow.org',
      password: process.env.SEED_COLETOR_PASSWORD || 'Coleta@2026',
      role: 'COLETOR_CAMPO',
    },
    {
      name: 'Téc. Mariana Souza (Laboratório BLH)',
      email: 'laboratorio@leiteflow.org',
      password: process.env.SEED_LAB_PASSWORD || 'Lab@2026',
      role: 'LABORATORIO',
    },
  ];

  for (const u of defaultUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          passwordHash: await hashPassword(u.password),
          role: u.role,
          active: true,
        },
      });
    }
  }

  const vehicles = [
    { name: 'Van 01 - Mercedes-Benz Sprinter BLH', plate: 'BRA-2E19', type: 'Van Furgão Isotérmica', capacityBottles: 24 },
    { name: 'Fiorino 02 - Fiat Refrigerada', plate: 'BLH-4F20', type: 'Utilitário Térmico', capacityBottles: 16 },
    { name: 'Spin 03 - Chevrolet Apoio & Urgência', plate: 'SPN-8K11', type: 'Veículo Leve com Caixa Portátil', capacityBottles: 10 },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: {},
      create: v,
    });
  }

  if ((await prisma.staffMember.count()) === 0) {
    await prisma.staffMember.createMany({
      data: [
        { name: 'Carlos Alberto Silva', role: 'motorista', phone: '(14) 99812-4411' },
        { name: 'Marcos Pereira', role: 'motorista', phone: '(14) 99745-8833' },
        { name: 'Roberto Fernandes', role: 'motorista', phone: '(14) 99611-2290' },
        { name: 'Enfª Cláudia Guimarães', role: 'coletor', phone: '(14) 99123-5567' },
        { name: 'Téc. Mariana Souza', role: 'coletor', phone: '(14) 99889-1122' },
        { name: 'Téc. Bruna Rezende', role: 'coletor', phone: '(14) 99778-3344' },
      ],
    });
  }

  if ((await prisma.route.count()) === 0) {
    const today = new Date().toISOString().split('T')[0];
    await prisma.route.createMany({
      data: [
        {
          code: 'ROT-01',
          name: 'Van 01 - Rota Norte Principal',
          scheduledDate: today,
          day: 'Segunda',
          zone: 'Norte',
          shift: 'Manhã',
          vehicleName: 'Van 01 - Mercedes-Benz Sprinter BLH',
          vehiclePlate: 'BRA-2E19',
          driverName: 'Carlos Alberto Silva',
          collectorName: 'Enfª Cláudia Guimarães',
          status: 'planning',
          notes: 'Rota regular matutina para os bairros da Zona Norte.',
        },
        {
          code: 'ROT-02',
          name: 'Fiorino 02 - Coleta Externa & Maternidade',
          scheduledDate: today,
          day: 'Segunda',
          zone: 'Norte',
          shift: 'Tarde',
          vehicleName: 'Fiorino 02 - Fiat Refrigerada',
          vehiclePlate: 'BLH-4F20',
          driverName: 'Marcos Pereira',
          collectorName: 'Téc. Mariana Souza',
          status: 'planning',
          notes: 'Apoio vespertino para coletas excedentes e altas recentes.',
        },
        {
          code: 'ROT-03',
          name: 'Van 01 - Rota Sul Regular',
          scheduledDate: today,
          day: 'Terça',
          zone: 'Sul',
          shift: 'Manhã',
          vehicleName: 'Van 01 - Mercedes-Benz Sprinter BLH',
          vehiclePlate: 'BRA-2E19',
          driverName: 'Carlos Alberto Silva',
          collectorName: 'Enfª Cláudia Guimarães',
          status: 'planning',
        },
        {
          code: 'ROT-04',
          name: 'Van 01 - Rota Oeste Regular',
          scheduledDate: today,
          day: 'Quarta',
          zone: 'Oeste',
          shift: 'Manhã',
          vehicleName: 'Van 01 - Mercedes-Benz Sprinter BLH',
          vehiclePlate: 'BRA-2E19',
          driverName: 'Carlos Alberto Silva',
          collectorName: 'Téc. Mariana Souza',
          status: 'planning',
        },
        {
          code: 'ROT-05',
          name: 'Van 01 - Rota Leste Regular',
          scheduledDate: today,
          day: 'Quinta',
          zone: 'Leste',
          shift: 'Manhã',
          vehicleName: 'Van 01 - Mercedes-Benz Sprinter BLH',
          vehiclePlate: 'BRA-2E19',
          driverName: 'Marcos Pereira',
          collectorName: 'Enfª Cláudia Guimarães',
          status: 'planning',
        },
        {
          code: 'ROT-06',
          name: 'Fiorino 02 - Rota Rural & Distritos',
          scheduledDate: today,
          day: 'Sexta',
          zone: 'Rural',
          shift: 'Integral',
          vehicleName: 'Fiorino 02 - Fiat Refrigerada',
          vehiclePlate: 'BLH-4F20',
          driverName: 'Roberto Fernandes',
          collectorName: 'Téc. Bruna Rezende',
          status: 'planning',
        },
      ],
    });
  }

  if ((await prisma.glassInventoryMovement.count()) === 0) {
    await prisma.glassInventoryMovement.create({
      data: {
        type: 'INITIAL_STOCK',
        quantity: 142,
        notes: 'Inventário inicial de frascos de vidro esterilizados no BLH Marília',
      },
    });
  }
}
