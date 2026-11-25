import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  BLH_COORDS,
  evaluateGoNoGo,
  extractNeighborhood,
  isValidCNS,
  isValidCPF,
  normalizeDigits,
  ZONE_APPROX_COORDS,
} from '../../lib/domain.js';

export const donorFormSchema = z.object({
  nome: z.string().trim().min(2),
  bebe: z.string().trim().min(1),
  sus: z.string().trim().min(15),
  cpf: z.string().trim().optional().default(''),
  nascimento: z.string().optional().default(''),
  parto: z.string().min(8),
  telefone: z.string().trim().min(10),
  zona: z.enum(['Norte', 'Sul', 'Oeste', 'Leste', 'Rural']),
  endereco: z.string().trim().min(3),
  lat: z.number().min(-23).max(-21).optional(),
  lng: z.number().min(-51).max(-49).optional(),
  geocodeStatus: z.enum(['verified', 'approximate', 'failed']).optional(),
  vacinaFebre: z.boolean().default(true),
  vacinaDtpa: z.boolean().default(true),
  transfusao: z.string().optional().default('Não'),
  transfusaoData: z.string().optional().nullable(),
  tatuagem: z.string().optional().default('Não'),
  tatuagemData: z.string().optional().nullable(),
  fumo: z.enum(['nao', 'sim_pouco', 'sim_ativo']).default('nao'),
  alcool: z.enum(['nao', 'raro', 'frequente']).default('nao'),
  medicacao: z.string().optional().default(''),
  aguaPotavel: z.boolean().default(true),
  redeEsgoto: z.boolean().default(true),
  renda: z.string().optional().default(''),
  pesoBebe: z.string().optional().default(''),
  apgar: z.string().optional().default(''),
  malformacao: z.enum(['nao', 'sim']).default('nao'),
  intercorrencias: z
    .object({
      infeccao: z.boolean().default(false),
      hipertensao: z.boolean().default(false),
      diabetes: z.boolean().default(false),
      hepatite: z.boolean().default(false),
    })
    .default({ infeccao: false, hipertensao: false, diabetes: false, hepatite: false }),
  equipamento: z.enum(['Freezer', 'Duplex', 'Simples']).default('Duplex'),
  extracao: z.enum(['Ordenha Manual', 'Bomba Elétrica', 'Bomba Manual']).default('Ordenha Manual'),
  produtosJunto: z.boolean().default(false),
  soro1Data: z.string().optional().default(''),
  soro1Res: z.enum(['normal', 'alterada', 'pendente']).default('pendente'),
  soro2Data: z.string().optional().default(''),
  soro2Res: z.enum(['normal', 'alterada', 'pendente']).default('pendente'),
  soro3Data: z.string().optional().default(''),
  soro3Res: z.enum(['normal', 'alterada', 'pendente']).default('pendente'),
  statusCadastro: z.enum(['ativa', 'inativa']).optional(),
});

export type ValidatedDonorFormData = z.infer<typeof donorFormSchema>;

export function zoneFallbackCoords(zona: string): [number, number] {
  const base = ZONE_APPROX_COORDS[zona] ?? BLH_COORDS;
  return [
    Number((base[0] + (Math.random() - 0.5) * 0.015).toFixed(6)),
    Number((base[1] + (Math.random() - 0.5) * 0.015).toFixed(6)),
  ];
}

export class DonorValidationError extends Error {
  status: number;
  title: string;

  constructor(status: number, title: string, detail: string) {
    super(detail);
    this.status = status;
    this.title = title;
  }
}

export async function createValidatedDonor(
  tx: Prisma.TransactionClient,
  data: ValidatedDonorFormData,
  consentAcceptedAtOverride?: Date
) {
  const susNormalized = normalizeDigits(data.sus);
  const cpfNormalized = data.cpf ? normalizeDigits(data.cpf) : null;

  if (!isValidCNS(susNormalized)) {
    throw new DonorValidationError(
      422,
      'Cartão SUS inválido',
      'Informe um Cartão Nacional de Saúde (SUS) válido de 15 dígitos.'
    );
  }

  if (cpfNormalized && !isValidCPF(cpfNormalized)) {
    throw new DonorValidationError(
      422,
      'CPF inválido',
      'O CPF informado possui dígitos verificadores inválidos.'
    );
  }

  const existing = await tx.donor.findFirst({
    where: {
      OR: [
        { susNormalized },
        ...(cpfNormalized ? [{ cpfNormalized }] : []),
      ],
    },
  });

  if (existing) {
    throw new DonorValidationError(
      409,
      'Cadastro duplicado',
      `Já existe uma doadora cadastrada com este documento (${existing.code} — ${existing.nome}).`
    );
  }

  const verdict = evaluateGoNoGo(data);
  const hasVerifiedCoords = typeof data.lat === 'number' && typeof data.lng === 'number';
  const [lat, lng] = hasVerifiedCoords ? [data.lat!, data.lng!] : zoneFallbackCoords(data.zona);
  const geocodeStatus = hasVerifiedCoords ? data.geocodeStatus || 'verified' : 'approximate';

  const latest = await tx.donor.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  const nextCodeNum = (latest?.id ?? 0) + 1;
  const code = `DOAD-${String(nextCodeNum).padStart(3, '0')}`;

  const created = await tx.donor.create({
    data: {
      code,
      nome: data.nome,
      bebe: data.bebe,
      sus: data.sus,
      susNormalized,
      cpf: data.cpf || 'Não informado',
      cpfNormalized,
      nascimento: data.nascimento,
      parto: data.parto,
      telefone: data.telefone,
      endereco: data.endereco,
      bairro: extractNeighborhood(data.endereco),
      zona: data.zona,
      lat,
      lng,
      geocodeStatus,
      vacinaFebre: data.vacinaFebre,
      vacinaDtpa: data.vacinaDtpa,
      transfusao: data.transfusaoData ? data.transfusaoData : data.transfusao || 'Não',
      transfusaoData: data.transfusaoData || null,
      tatuagem: data.tatuagemData ? data.tatuagemData : data.tatuagem || 'Não',
      tatuagemData: data.tatuagemData || null,
      fumo: data.fumo,
      alcool: data.alcool,
      medicacao: data.medicacao || 'Nenhuma',
      aguaPotavel: data.aguaPotavel,
      redeEsgoto: data.redeEsgoto,
      renda: data.renda || null,
      pesoBebe: data.pesoBebe || null,
      apgar: data.apgar || null,
      malformacao: data.malformacao,
      intercorrencias: JSON.stringify(data.intercorrencias),
      equipamento: data.equipamento,
      extracao: data.extracao,
      produtosJunto: data.produtosJunto,
      soro1Data: data.soro1Data || null,
      sorologia1: data.soro1Res,
      soro2Data: data.soro2Data || null,
      sorologia2: data.soro2Res,
      soro3Data: data.soro3Data || null,
      sorologia3: data.soro3Res,
      aptidao: verdict.aptidao,
      statusCadastro: verdict.aptidao === 'Inapta' ? 'inativa' : data.statusCadastro || 'ativa',
      motivoInapta: verdict.approved ? null : verdict.reasons.join(' · '),
      consentAcceptedAt: consentAcceptedAtOverride ?? new Date(),
      dataCadastro: new Date().toISOString().split('T')[0],
    },
  });

  return { created, verdict };
}
