import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/crypto.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco LEITE FLOW...');

  // 1. Usuários iniciais com perfis RBAC distintos
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

  // 2. Frota inicial
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

  // 3. Equipe operacional
  const staffCount = await prisma.staffMember.count();
  if (staffCount === 0) {
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

  // 4. Rotas-base da semana (apenas se banco vazio)
  const routeCount = await prisma.route.count();
  if (routeCount === 0) {
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

  // 5. Movimento inicial do estoque de vidros (para reconciliação real)
  const stockCount = await prisma.glassInventoryMovement.count();
  if (stockCount === 0) {
    await prisma.glassInventoryMovement.create({
      data: {
        type: 'INITIAL_STOCK',
        quantity: 142,
        notes: 'Inventário inicial de frascos de vidro esterilizados no BLH Marília',
      },
    });
  }

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
