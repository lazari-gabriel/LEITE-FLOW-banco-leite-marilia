import { Bottle, CollectionFormData } from '../types/bottle';
import { Donor } from '../types/donor';

/**
 * Gera código identificador único do frasco no formato LEITE FLOW:
 * Ex: LF-2026-000123
 */
export function generateBottleCode(sequenceNumber: number): string {
  const currentYear = new Date().getFullYear();
  const seq = String(sequenceNumber).padStart(6, '0');
  return `LF-${currentYear}-${seq}`;
}

/**
 * Validade do leite cru congelado: exatamente 15 dias a partir da 1ª extração / coleta
 * conforme protocolo ANVISA e diretriz do Banco de Leite de Marília
 */
export function calculateRawMilkExpiry(fromDate: Date = new Date()): string {
  const val = new Date(fromDate);
  val.setDate(val.getDate() + 15);
  return val.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function formatDateTime(date: Date = new Date()): string {
  const dataStr = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const horaStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${dataStr} ${horaStr}`;
}

export function createBottleFromCollection(
  formData: CollectionFormData,
  donor: Donor,
  nextId: number,
  sequenceIndex: number
): Bottle {
  const now = new Date();

  return {
    id: nextId,
    codigo: generateBottleCode(sequenceIndex),
    doadoraId: donor.id,
    doadoraNome: donor.nome,
    zona: donor.zona,
    volume: formData.volume,
    temp: formData.temp,
    classe: formData.classe,
    extracao: donor.extracao || "Ordenha Manual",
    equipamento: donor.equipamento || "Freezer",
    dataHoraColeta: formatDateTime(now),
    validadeCru: calculateRawMilkExpiry(now),
    statusPast: "Em Triagem",
    acidez: "3.6 °D",
    crematocrito: "670 Kcal/L",
    destinoUTI: "Aguardando Pasteurização",
    responsavel: `Equipe LEITE FLOW ${donor.zona} (Matr. 3891)`
  };
}
