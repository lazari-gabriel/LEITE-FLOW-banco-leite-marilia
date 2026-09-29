import { RouteAssignment, RouteShift } from '../types/route';

export interface FleetVehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  capacityBottles: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: 'motorista' | 'coletor';
  phone: string;
}

export const FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: 'veh-01',
    name: 'Van 01 - Mercedes-Benz Sprinter BLH',
    plate: 'BRA-2E19',
    type: 'Van Furgão Isotérmica',
    capacityBottles: 24
  },
  {
    id: 'veh-02',
    name: 'Fiorino 02 - Fiat Refrigerada',
    plate: 'BLH-4F20',
    type: 'Utilitário Térmico',
    capacityBottles: 16
  },
  {
    id: 'veh-03',
    name: 'Spin 03 - Chevrolet Apoio & Urgência',
    plate: 'SPN-8K11',
    type: 'Veículo Leve com Caixa Portátil',
    capacityBottles: 10
  }
];

export const FLEET_DRIVERS: CrewMember[] = [
  { id: 'drv-01', name: 'Carlos Alberto Silva', role: 'motorista', phone: '(14) 99812-4411' },
  { id: 'drv-02', name: 'Marcos Pereira', role: 'motorista', phone: '(14) 99745-8833' },
  { id: 'drv-03', name: 'Roberto Fernandes', role: 'motorista', phone: '(14) 99611-2290' }
];

export const FLEET_COLLECTORS: CrewMember[] = [
  { id: 'col-01', name: 'Enfª Cláudia Guimarães', role: 'coletor', phone: '(14) 99123-5567' },
  { id: 'col-02', name: 'Téc. Mariana Souza', role: 'coletor', phone: '(14) 99889-1122' },
  { id: 'col-03', name: 'Téc. Bruna Rezende', role: 'coletor', phone: '(14) 99778-3344' }
];

export const INITIAL_ROUTES: RouteAssignment[] = [
  {
    id: 'rot-segunda-01',
    code: 'ROT-01',
    name: 'Van 01 - Rota Norte Principal',
    day: 'Segunda',
    zone: 'Norte',
    donorIds: [],
    driverName: 'Carlos Alberto Silva',
    collectorName: 'Enfª Cláudia Guimarães',
    vehicleName: 'Van 01 - Mercedes-Benz Sprinter BLH',
    vehiclePlate: 'BRA-2E19',
    shift: 'Manhã',
    createdAt: '2026-09-28T07:30:00.000Z',
    status: 'planning',
    skippedStops: [],
    notes: 'Rota regular matutina para os bairros da Zona Norte.'
  },
  {
    id: 'rot-segunda-02',
    code: 'ROT-02',
    name: 'Fiorino 02 - Coleta Externa & Maternidade',
    day: 'Segunda',
    zone: 'Norte',
    donorIds: [],
    driverName: 'Marcos Pereira',
    collectorName: 'Téc. Mariana Souza',
    vehicleName: 'Fiorino 02 - Fiat Refrigerada',
    vehiclePlate: 'BLH-4F20',
    shift: 'Tarde',
    createdAt: '2026-09-28T12:00:00.000Z',
    status: 'planning',
    skippedStops: [],
    notes: 'Apoio vespertino para coletas excedentes e altas recentes.'
  },
  {
    id: 'rot-terca-01',
    code: 'ROT-03',
    name: 'Van 01 - Rota Sul Regular',
    day: 'Terça',
    zone: 'Sul',
    donorIds: [],
    driverName: 'Carlos Alberto Silva',
    collectorName: 'Enfª Cláudia Guimarães',
    vehicleName: 'Van 01 - Mercedes-Benz Sprinter BLH',
    vehiclePlate: 'BRA-2E19',
    shift: 'Manhã',
    createdAt: '2026-09-29T07:30:00.000Z',
    status: 'planning',
    skippedStops: []
  },
  {
    id: 'rot-quarta-01',
    code: 'ROT-04',
    name: 'Van 01 - Rota Oeste Regular',
    day: 'Quarta',
    zone: 'Oeste',
    donorIds: [],
    driverName: 'Carlos Alberto Silva',
    collectorName: 'Téc. Mariana Souza',
    vehicleName: 'Van 01 - Mercedes-Benz Sprinter BLH',
    vehiclePlate: 'BRA-2E19',
    shift: 'Manhã',
    createdAt: '2026-09-30T07:30:00.000Z',
    status: 'planning',
    skippedStops: []
  },
  {
    id: 'rot-quinta-01',
    code: 'ROT-05',
    name: 'Van 01 - Rota Leste Regular',
    day: 'Quinta',
    zone: 'Leste',
    donorIds: [],
    driverName: 'Marcos Pereira',
    collectorName: 'Enfª Cláudia Guimarães',
    vehicleName: 'Van 01 - Mercedes-Benz Sprinter BLH',
    vehiclePlate: 'BRA-2E19',
    shift: 'Manhã',
    createdAt: '2026-10-01T07:30:00.000Z',
    status: 'planning',
    skippedStops: []
  },
  {
    id: 'rot-sexta-01',
    code: 'ROT-06',
    name: 'Fiorino 02 - Rota Rural & Distritos',
    day: 'Sexta',
    zone: 'Rural',
    donorIds: [],
    driverName: 'Roberto Fernandes',
    collectorName: 'Téc. Bruna Rezende',
    vehicleName: 'Fiorino 02 - Fiat Refrigerada',
    vehiclePlate: 'BLH-4F20',
    shift: 'Integral',
    createdAt: '2026-10-02T07:00:00.000Z',
    status: 'planning',
    skippedStops: []
  }
];
