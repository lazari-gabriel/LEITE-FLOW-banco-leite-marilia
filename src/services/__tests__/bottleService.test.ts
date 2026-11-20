import { describe, it, expect } from 'vitest';
import { createBottleFromCollection, generateBottleCode } from '../bottleService';
import { createDonorFromForm } from '../donorService';
import { DonorFormData } from '../../types/donor';

const donor = createDonorFromForm(
  {
    nome: 'Ana Paula Costa',
    bebe: 'Sofia Costa',
    sus: '898 0033 7788 9908',
    cpf: '529.982.247-25',
    nascimento: '1995-03-10',
    parto: '2026-11-01',
    telefone: '(14) 99999-1111',
    zona: 'Sul',
    endereco: 'Rua das Flores, 100 — Nova Marília, Marília - SP',
    vacinaFebre: true,
    vacinaDtpa: true,
    transfusao: 'Não',
    tatuagem: 'Não',
    fumo: 'nao',
    alcool: 'nao',
    medicacao: '',
    aguaPotavel: true,
    redeEsgoto: true,
    renda: 'De 1 a 3 salários mínimos',
    pesoBebe: '3100',
    apgar: '9/10',
    malformacao: 'nao',
    intercorrencias: { infeccao: false, hipertensao: false, diabetes: false, hepatite: false },
    equipamento: 'Freezer',
    extracao: 'Ordenha Manual',
    produtosJunto: false,
    soro1Data: '2026-11-02',
    soro1Res: 'normal',
    soro2Data: '2026-11-02',
    soro2Res: 'normal',
    soro3Data: '2026-11-02',
    soro3Res: 'normal',
  } as DonorFormData,
  1
);

describe('bottleService — Remoção de laudos mockados na coleta (Fase 1)', () => {
  it('cria frasco com acidez e crematócrito nulos (pendentes de análise) e preserva responsável/observação', () => {
    const bottle = createBottleFromCollection(
      {
        doadoraId: donor.id,
        volume: 200,
        temp: -16.5,
        classe: 'M',
        frascosEntregues: 4,
        observacao: 'Frasco bem vedado e congelado',
      },
      donor,
      1,
      1,
      'Enfª Cláudia Guimarães'
    );

    expect(bottle.acidez).toBeNull();
    expect(bottle.crematocrito).toBeNull();
    expect(bottle.responsavel).toBe('Enfª Cláudia Guimarães');
    expect(bottle.frascosEntregues).toBe(4);
    expect(bottle.observacao).toBe('Frasco bem vedado e congelado');
    expect(bottle.codigo).toBe(generateBottleCode(1));
  });
});
