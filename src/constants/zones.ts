import { ZoneConfig } from '../types/route';

export const ZONAS_SEMANA: ZoneConfig[] = [
  { 
    dia: "Segunda", 
    zona: "Norte", 
    desc: "Palmital, Santa Antonieta, Jd. Cavalari, Jd. Primavera", 
    cor: "#235347",
    approxCoords: [-22.185, -49.952]
  },
  { 
    dia: "Terça", 
    zona: "Sul", 
    desc: "Nova Marília, Costa e Silva, Jóquei Clube, Teotônio Vilela", 
    cor: "#b87d28",
    approxCoords: [-22.245, -49.945]
  },
  { 
    dia: "Quarta", 
    zona: "Oeste", 
    desc: "Maria Izabel, Alto Cafezal, Jd. Califórnia, Polon", 
    cor: "#357262",
    approxCoords: [-22.220, -49.970]
  },
  { 
    dia: "Quinta", 
    zona: "Leste", 
    desc: "Cascata, Fragata, Aeroporto, Jd. Esmeralda", 
    cor: "#cf6656",
    approxCoords: [-22.226, -49.928]
  },
  { 
    dia: "Sexta", 
    zona: "Rural", 
    desc: "Distrito de Maracá, Padre Nóbrega, Avencas, Rosália", 
    cor: "#496374",
    approxCoords: [-22.140, -50.010]
  }
];

export const ZONE_BY_DAY: Record<string, ZoneConfig> = ZONAS_SEMANA.reduce((acc, z) => {
  acc[z.dia] = z;
  return acc;
}, {} as Record<string, ZoneConfig>);

export const DAY_BY_ZONE: Record<string, string> = {
  "Norte": "Segunda",
  "Sul": "Terça",
  "Oeste": "Quarta",
  "Leste": "Quinta",
  "Rural": "Sexta"
};
