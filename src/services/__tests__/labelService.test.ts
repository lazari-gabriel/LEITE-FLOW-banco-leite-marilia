import { describe, it, expect } from 'vitest';
import {
  buildOpaqueQrPayload,
  generateRealQrCodeSvg,
  canEmitLabelType,
  generateZplLabel,
} from '../labelService';
import { Bottle } from '../../types/bottle';

const rawBottle: Bottle = {
  id: 1,
  codigo: 'LF-2026-000001',
  doadoraId: 5,
  doadoraNome: 'Juliana Mendes Rodrigues',
  zona: 'Norte',
  volume: 200,
  temp: -16.5,
  classe: 'M',
  extracao: 'Ordenha Manual',
  equipamento: 'Freezer',
  dataHoraColeta: '19/11/2026 09:00',
  validadeCru: '04/12/2026',
  statusPast: 'Em Triagem',
  acidez: null,
  crematocrito: null,
  destinoUTI: 'Aguardando Análise Laboratorial',
  responsavel: 'Enfª Cláudia Guimarães',
};

describe('labelService — Etiquetagem Real ISO QR / ZPL / Gate Sanitário (M007)', () => {
  it('gera payload QR opaco sem expor dados pessoais (LGPD)', () => {
    const payload = buildOpaqueQrPayload(rawBottle.codigo);
    expect(payload).toBe('LF1:LF-2026-000001');
    expect(payload).not.toContain('Juliana');
  });

  it('gera matriz QR Code real ISO/IEC 18004 com quiet zone de 4 módulos', () => {
    const qr = generateRealQrCodeSvg(buildOpaqueQrPayload(rawBottle.codigo));
    expect(qr.moduleCount).toBeGreaterThanOrEqual(21);
    expect(qr.viewBoxSize).toBe(qr.moduleCount + 8);
    expect(qr.pathD.length).toBeGreaterThan(200);
  });

  it('bloqueia Etiqueta 3 (UTI) para frasco ainda não pasteurizado e libera após pasteurização', () => {
    expect(canEmitLabelType(rawBottle, 'coleta').allowed).toBe(true);
    expect(canEmitLabelType(rawBottle, 'pasteurizacao').allowed).toBe(false);

    const pasteurized: Bottle = {
      ...rawBottle,
      statusPast: 'Pasteurizado',
      acidez: '4.0 °D',
      crematocrito: '680 Kcal/L',
      pasteurizedExpiresAt: '19/05/2027',
    };
    expect(canEmitLabelType(pasteurized, 'pasteurizacao').allowed).toBe(true);
  });

  it('gera comando ZPL II 60x40mm válido com Code128 (^BCN), QR (^BQN) e anonimização UTI', () => {
    const pasteurized: Bottle = {
      ...rawBottle,
      statusPast: 'Pasteurizado',
      acidez: '4.0 °D',
      crematocrito: '680 Kcal/L',
      pasteurizedExpiresAt: '19/05/2027',
    };

    const zpl = generateZplLabel(pasteurized, 'pasteurizacao');
    expect(zpl).toContain('^XA');
    expect(zpl).toContain('^PW480');
    expect(zpl).toContain('^LL320');
    expect(zpl).toContain('^BCN');
    expect(zpl).toContain('^BQN');
    expect(zpl).toContain('DOADORA ANONIMA (DOAD-005)');
    expect(zpl).not.toContain('JULIANA');
    expect(zpl).toContain('^XZ');
  });
});
