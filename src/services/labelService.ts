import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Bottle, LabelType } from '../types/bottle';
import { LEITE_FLOW } from '../constants/blh';

/**
 * Payload opaco do QR Code (LGPD: NUNCA incluir CPF, nome ou diagnóstico clínico).
 */
export function buildOpaqueQrPayload(bottleCode: string): string {
  return `LF1:${bottleCode.trim()}`;
}

/**
 * Renderiza Código de Barras CODE 128 REAL (ISO/IEC 15417) em elemento SVG via JsBarcode.
 * Legível por qualquer scanner óptico hospitalar 1D/2D.
 */
export function renderCode128ToSvg(svgElement: SVGSVGElement, code: string): void {
  JsBarcode(svgElement, code, {
    format: 'CODE128',
    displayValue: false,
    margin: 4,
    width: 1.8,
    height: 36,
    background: '#ffffff',
    lineColor: '#000000',
  });
}

/**
 * Gera matriz QR Code REAL (ISO/IEC 18004, correção de erro nível M + quiet zone 4 módulos).
 * 100% síncrono e compatível com browser e Node/Vitest (decodificável por qualquer câmera/leitor).
 */
export function generateRealQrCodeSvg(content: string): {
  viewBoxSize: number;
  pathD: string;
  moduleCount: number;
} {
  const qr = QRCode.create(content, { errorCorrectionLevel: 'M' });
  const moduleCount = qr.modules.size;
  const quietZone = 4;
  const viewBoxSize = moduleCount + quietZone * 2;
  const segments: string[] = [];

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.modules.get(row, col)) {
        segments.push(`M${col + quietZone},${row + quietZone}h1v1h-1z`);
      }
    }
  }

  return {
    viewBoxSize,
    pathD: segments.join(''),
    moduleCount,
  };
}

/**
 * Verifica se o frasco está sanitariamente liberado para receber o modelo de etiqueta solicitado.
 * Modelo 3 (UTI Neonatal / Pasteurização) é BLOQUEADO enquanto o leite não estiver Pasteurizado/Dispensado.
 */
export function canEmitLabelType(bottle: Bottle, labelType: LabelType): { allowed: boolean; reason?: string } {
  if (labelType === 'pasteurizacao') {
    if (bottle.statusPast !== 'Pasteurizado' && bottle.statusPast !== 'Dispensado') {
      return {
        allowed: false,
        reason:
          'Bloqueio Sanitário (RDC 171/2006): a Etiqueta Hospitalar de UTI só pode ser emitida após análise laboratorial e liberação de pasteurização.',
      };
    }
  }
  return { allowed: true };
}

/**
 * Gera comando ZPL II nativo para impressoras térmicas Zebra / Argox / Elgin (60x40mm @ 203 DPI = 480x320 dots).
 */
export function generateZplLabel(bottle: Bottle, labelType: LabelType): string {
  const isPast = labelType === 'pasteurizacao';
  const donorLine = isPast
    ? `DOADORA ANONIMA (DOAD-${String(bottle.doadoraId).padStart(3, '0')})`
    : bottle.doadoraNome.toUpperCase().slice(0, 34);
  const validityLabel = isPast
    ? `VAL. PAST (6M): ${bottle.pasteurizedExpiresAt || 'N/A'}`
    : `VAL. CRU (15D): ${bottle.validadeCru}`;
  const qrPayload = buildOpaqueQrPayload(bottle.codigo);

  return [
    '^XA',
    '^CI28',
    '^PW480',
    '^LL320',
    '^FO16,12^A0N,22,22^FDLEITE FLOW - BLH MARILIA^FS',
    `^FO16,38^A0N,16,16^FD${LEITE_FLOW.hospitalName.slice(0, 36)}^FS`,
    '^FO16,58^GB448,2,2^FS',
    `^FO16,68^A0N,24,24^FD${bottle.codigo}^FS`,
    `^FO16,96^A0N,18,18^FD${donorLine}^FS`,
    `^FO16,120^A0N,18,18^FDVOL: ${bottle.volume} mL  |  TEMP: ${bottle.temp} C  |  CLASSE: ${bottle.classe}^FS`,
    `^FO16,144^A0N,18,18^FD${validityLabel}^FS`,
    isPast
      ? `^FO16,168^A0N,16,16^FDACIDEZ: ${bottle.acidez || '-'} | CREM: ${bottle.crematocrito || '-'}^FS`
      : `^FO16,168^A0N,16,16^FDCOLETA: ${bottle.dataHoraColeta} | ZONA: ${bottle.zona}^FS`,
    // QR Code nativo ZPL (^BQN) com payload opaco sem PII
    `^FO356,66^BQN,2,3^FDMA,${qrPayload}^FS`,
    // Code 128 nativo ZPL (^BCN)
    '^BY2,2,56',
    `^FO24,200^BCN,56,Y,N,N^FD${bottle.codigo}^FS`,
    '^XZ',
  ].join('\n');
}
