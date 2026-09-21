export const LEITE_FLOW = {
  systemName: 'LEITE FLOW',
  tagline: 'Logística & Gestão de Coleta de Leite Materno',
  hospitalName: 'Hospital Materno Infantil de Marília',
  department: 'Banco de Leite Humano (BLH)',
  address: 'Rua São Luiz, 375 — Centro, Marília - SP',
  phone: '(14) 3402-5555',
  coords: [-22.21735, -49.94692] as [number, number],
  van: {
    model: 'Fiorino LEITE FLOW — Coleta Domiciliar',
    plate: 'LF-2026',
    driver: 'Equipe de Coleta Externa',
    registration: 'Matrícula #3891',
    boxTempMin: -15.0,
    boxTempIdeal: -18.0,
  }
};

// Compatibilidade
export const BLH_MARILIA = LEITE_FLOW;
