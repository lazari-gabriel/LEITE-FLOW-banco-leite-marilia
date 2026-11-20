import { describe, it, expect } from 'vitest';
import {
  evaluateGoNoGo,
  createDonorFromForm,
  updateDonorFromForm,
  isValidCPF,
  isValidCNS,
  isValidPhone,
  validateDonorDates,
  findDuplicateDonor,
  getConsolidatedSerologyStatus,
  calculateMilkClass,
} from '../donorService';
import { DonorFormData } from '../../types/donor';

function makeValidFormData(overrides: Partial<DonorFormData> = {}): DonorFormData {
  return {
    nome: 'Maria Oliveira Santos',
    bebe: 'Lucas Oliveira',
    sus: '898 0033 7788 9908',
    cpf: '529.982.247-25',
    nascimento: '1996-05-10',
    parto: '2026-11-10',
    telefone: '(14) 99876-5432',
    zona: 'Norte',
    endereco: 'Rua Tomé de Souza, 245 — Palmital, Marília - SP',
    vacinaFebre: true,
    vacinaDtpa: true,
    transfusao: 'Não',
    transfusaoData: '',
    tatuagem: 'Não',
    tatuagemData: '',
    fumo: 'nao',
    alcool: 'nao',
    medicacao: '',
    aguaPotavel: true,
    redeEsgoto: true,
    renda: 'De 1 a 3 salários mínimos',
    pesoBebe: '3250',
    apgar: '9/10',
    malformacao: 'nao',
    intercorrencias: {
      infeccao: false,
      hipertensao: false,
      diabetes: false,
      hepatite: false,
    },
    equipamento: 'Freezer',
    extracao: 'Ordenha Manual',
    produtosJunto: false,
    soro1Data: '2026-11-12',
    soro1Res: 'normal',
    soro2Data: '2026-11-12',
    soro2Res: 'normal',
    soro3Data: '2026-11-12',
    soro3Res: 'normal',
    statusCadastro: 'ativa',
    ...overrides,
  };
}

const REF_DATE = new Date(2026, 10, 19); // 19/11/2026

describe('donorService — Triagem Go/No-Go & Validações (M002)', () => {
  it('aprova doadora com sorologias normais e sem contraindicações', () => {
    const verdict = evaluateGoNoGo(makeValidFormData(), REF_DATE);
    expect(verdict.aptidao).toBe('Apta');
    expect(verdict.approved).toBe(true);
    expect(verdict.reasons).toHaveLength(0);
  });

  it('marca como Pendente quando qualquer sorologia está pendente e não há impeditivos', () => {
    const verdict = evaluateGoNoGo(makeValidFormData({ soro2Res: 'pendente' }), REF_DATE);
    expect(verdict.aptidao).toBe('Pendente');
    expect(verdict.approved).toBe(false);
  });

  it('CRÍTICO: atualizar sorologia de pendente -> normal APROVA a doadora (não reprova)', () => {
    const pendingForm = makeValidFormData({
      soro1Res: 'pendente',
      soro2Res: 'pendente',
      soro3Res: 'pendente',
    });
    const created = createDonorFromForm(pendingForm, 1);
    expect(created.aptidao).toBe('Pendente');
    expect(created.statusCadastro).toBe('ativa');

    const { donor: updated, verdict } = updateDonorFromForm(
      created,
      makeValidFormData({ soro1Res: 'normal', soro2Res: 'normal', soro3Res: 'normal' }),
      REF_DATE
    );
    expect(verdict.aptidao).toBe('Apta');
    expect(updated.aptidao).toBe('Apta');
    expect(updated.statusCadastro).toBe('ativa');
    expect(updated.motivoInapta).toBeUndefined();
  });

  it('reprova e inativa quando sorologia muda para alterada', () => {
    const created = createDonorFromForm(makeValidFormData(), 1);
    const { donor: updated, verdict } = updateDonorFromForm(
      created,
      makeValidFormData({ soro3Res: 'alterada' }),
      REF_DATE
    );
    expect(verdict.aptidao).toBe('Inapta');
    expect(updated.aptidao).toBe('Inapta');
    expect(updated.statusCadastro).toBe('inativa');
  });

  it('reprova quando intercorrencias.hepatite está marcado', () => {
    const verdict = evaluateGoNoGo(
      makeValidFormData({
        intercorrencias: { infeccao: false, hipertensao: false, diabetes: false, hepatite: true },
      }),
      REF_DATE
    );
    expect(verdict.aptidao).toBe('Inapta');
    expect(verdict.reasons.some((r) => /hepatite/i.test(r))).toBe(true);
  });

  it('avalia carência exata de 12 meses (365 dias) para tatuagem e transfusão', () => {
    // Tatuagem há 100 dias -> Inapta
    const recentTat = evaluateGoNoGo(makeValidFormData({ tatuagemData: '2026-08-11' }), REF_DATE);
    expect(recentTat.aptidao).toBe('Inapta');

    // Tatuagem há mais de 365 dias -> Apta
    const oldTat = evaluateGoNoGo(makeValidFormData({ tatuagemData: '2025-10-01' }), REF_DATE);
    expect(oldTat.aptidao).toBe('Apta');

    // Transfusão há 60 dias -> Inapta
    const recentTransf = evaluateGoNoGo(makeValidFormData({ transfusaoData: '2026-09-20' }), REF_DATE);
    expect(recentTransf.aptidao).toBe('Inapta');

    // Transfusão há mais de 365 dias -> Apta
    const oldTransf = evaluateGoNoGo(makeValidFormData({ transfusaoData: '2024-01-10' }), REF_DATE);
    expect(oldTransf.aptidao).toBe('Apta');
  });

  it('preserva todos os campos clínicos/socioeconômicos e datas ao criar e editar', () => {
    const form = makeValidFormData({
      renda: 'De 3 a 5 salários mínimos',
      pesoBebe: '3410',
      apgar: '8/9',
      soro1Data: '2026-11-01',
      soro2Data: '2026-11-05',
      soro3Data: '2026-11-09',
      intercorrencias: { infeccao: true, hipertensao: false, diabetes: true, hepatite: false },
    });

    const created = createDonorFromForm(form, 10);
    expect(created.renda).toBe('De 3 a 5 salários mínimos');
    expect(created.pesoBebe).toBe('3410');
    expect(created.apgar).toBe('8/9');
    expect(created.soro1Data).toBe('2026-11-01');
    expect(created.soro2Data).toBe('2026-11-05');
    expect(created.soro3Data).toBe('2026-11-09');
    expect(created.intercorrencias?.diabetes).toBe(true);
    expect(created.bairro).toBe('Palmital');
  });

  it('NÃO altera lat/lng ao editar apenas telefone sem mudar endereço ou zona', () => {
    const created = createDonorFromForm(makeValidFormData(), 1);
    const { donor: updated } = updateDonorFromForm(
      created,
      makeValidFormData({ telefone: '(14) 99111-2222' }),
      REF_DATE
    );
    expect(updated.lat).toBe(created.lat);
    expect(updated.lng).toBe(created.lng);
  });

  it('valida CPF, Cartão SUS (CNS), telefone, datas e duplicidade', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('529.982.247-00')).toBe(false);

    expect(isValidCNS('898 0033 7788 9908')).toBe(true);
    expect(isValidCNS('12345')).toBe(false);
    expect(isValidCNS('898 0033 7788 9900')).toBe(false);

    expect(isValidPhone('(14) 99876-5432')).toBe(true);
    expect(isValidPhone('1234')).toBe(false);

    expect(validateDonorDates('1996-05-10', '2026-12-31', REF_DATE)).toMatch(/futuro/i);
    expect(validateDonorDates('2026-11-15', '2026-11-10', REF_DATE)).toMatch(/anterior/i);
    expect(validateDonorDates('1996-05-10', '2026-11-10', REF_DATE)).toBeNull();

    const existing = [createDonorFromForm(makeValidFormData(), 1)];
    expect(findDuplicateDonor(existing, '898003377889908', '')?.field).toBe('sus');
    expect(findDuplicateDonor(existing, '', '52998224725')?.field).toBe('cpf');
    expect(findDuplicateDonor(existing, '898003377889908', '52998224725', 1)).toBeNull();
  });

  it('consolida sorologias com prioridade alterada > pendente > normal e calcula classe do leite', () => {
    expect(
      getConsolidatedSerologyStatus({ sorologia1: 'normal', sorologia2: 'pendente', sorologia3: 'normal' })
    ).toBe('pendente');
    expect(
      getConsolidatedSerologyStatus({ sorologia1: 'normal', sorologia2: 'pendente', sorologia3: 'alterada' })
    ).toBe('alterada');
    expect(
      getConsolidatedSerologyStatus({ sorologia1: 'normal', sorologia2: 'normal', sorologia3: 'normal' })
    ).toBe('normal');

    expect(calculateMilkClass('2026-11-15', REF_DATE)).toBe('C'); // 4 dias
    expect(calculateMilkClass('2026-11-09', REF_DATE)).toBe('T'); // 10 dias
    expect(calculateMilkClass('2026-10-20', REF_DATE)).toBe('M'); // 30 dias
  });
});
