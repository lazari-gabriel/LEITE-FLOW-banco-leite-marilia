import React, { useEffect, useMemo, useRef } from 'react';
import { Bottle, LabelFormat, LabelType } from '../../../types/bottle';
import {
  buildOpaqueQrPayload,
  generateRealQrCodeSvg,
  renderCode128ToSvg,
} from '../../../services/labelService';
import { LEITE_FLOW } from '../../../constants/blh';

interface ThermalLabelPreviewProps {
  bottle: Bottle;
  labelType: LabelType;
  format?: LabelFormat;
  copyNumber?: number;
}

function formatDateOnly(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const ThermalLabelPreview: React.FC<ThermalLabelPreviewProps> = ({
  bottle,
  labelType,
  format = '60x40mm',
  copyNumber,
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  // Renderiza Code 128 REAL via JsBarcode (ISO/IEC 15417)
  useEffect(() => {
    if (barcodeSvgRef.current) {
      try {
        renderCode128ToSvg(barcodeSvgRef.current, bottle.codigo);
      } catch (err) {
        console.error('Erro ao renderizar Code128:', err);
      }
    }
  }, [bottle.codigo]);

  // QR Code REAL ISO/IEC 18004 com payload opaco (LGPD: zero dados pessoais no QR)
  const qrData = useMemo(() => {
    const payload = buildOpaqueQrPayload(bottle.codigo);
    return generateRealQrCodeSvg(payload);
  }, [bottle.codigo]);

  const isColeta = labelType === 'coleta';
  const isEstocagem = labelType === 'estocagem';
  const isPast = labelType === 'pasteurizacao';
  const isCompactThermal = format === '60x40mm';
  const isTempOk = bottle.temp <= -10;

  return (
    <div
      className={`etiqueta-print-area bg-white text-black rounded-lg border-2 border-black w-full shadow-md font-sans select-none ${
        isCompactThermal ? 'max-w-[380px] p-3.5' : 'max-w-[440px] p-5'
      }`}
    >
      {/* Cabeçalho Oficial */}
      <div className="flex items-start justify-between gap-2.5 pb-2 border-b-2 border-black">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-black uppercase flex-wrap">
            <img src="/logo-symbol.png" alt="Leite Flow" className="w-3.5 h-3.5 object-contain inline-block" />
            <span>LEITE FLOW • BLH MARÍLIA</span>
            {copyNumber && copyNumber > 1 && (
              <span className="px-1 py-0.5 bg-black text-white text-[8px] rounded">
                {copyNumber}ª VIA
              </span>
            )}
          </div>
          <h2 className="font-serif font-black text-xs sm:text-sm leading-tight text-black mt-0.5 truncate">
            {LEITE_FLOW.hospitalName}
          </h2>
          <p className="text-[9px] font-semibold text-slate-700 mt-0.5">
            {isColeta && 'Etiqueta 1 · Coleta Domiciliar (Leite Cru)'}
            {isEstocagem && 'Etiqueta 2 · Pré-Estocagem & Classificação'}
            {isPast && 'Etiqueta 3 · UTI Neonatal (Pasteurizado · Anônimo)'}
          </p>
        </div>

        {/* QR Code Vetorial REAL ISO/IEC 18004 */}
        <div
          className="w-16 h-16 p-0.5 border border-black rounded bg-white shrink-0"
          title={`QR Code de rastreabilidade do frasco ${bottle.codigo}`}
        >
          <svg
            viewBox={`0 0 ${qrData.viewBoxSize} ${qrData.viewBoxSize}`}
            className="w-full h-full"
            shapeRendering="crispEdges"
            aria-label={`QR Code do frasco ${bottle.codigo}`}
          >
            <rect width={qrData.viewBoxSize} height={qrData.viewBoxSize} fill="#ffffff" />
            <path d={qrData.pathD} fill="#000000" />
          </svg>
        </div>
      </div>

      {/* Campos Principais */}
      <div className="py-2 space-y-1.5 text-xs border-b-2 border-black">
        <div className="flex items-center justify-between pb-1 border-b border-dashed border-slate-300">
          <div>
            <span className="block text-[8px] uppercase font-bold text-slate-600">Código Único</span>
            <span className="font-mono font-extrabold text-sm text-black tracking-wide">
              {bottle.codigo}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[8px] uppercase font-bold text-slate-600">Zona / Classe</span>
            <span className="font-bold text-black text-xs">
              Zona {bottle.zona} · {bottle.classe === 'C' ? 'Colostro' : bottle.classe === 'T' ? 'Transição' : 'Maduro'} ({bottle.classe})
            </span>
          </div>
        </div>

        {/* Doadora (Anonimizada na UTI) */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-[8px] uppercase font-bold text-slate-600">
              {isPast ? 'Identificação da Doadora (Sigilo Médico)' : 'Doadora Cadastrada'}
            </span>
            <span className="font-bold text-black text-xs block truncate">
              {isPast
                ? `Doadora Anônima (DOAD-${String(bottle.doadoraId).padStart(3, '0')})`
                : `${bottle.doadoraNome} (DOAD-${String(bottle.doadoraId).padStart(3, '0')})`}
            </span>
          </div>
          {!isPast && bottle.babyBirthDate && (
            <div className="text-right shrink-0">
              <span className="block text-[8px] uppercase font-bold text-slate-600">Nasc. Bebê</span>
              <span className="font-mono font-bold text-[11px] text-black">
                {formatDateOnly(bottle.babyBirthDate)}
              </span>
            </div>
          )}
        </div>

        {/* Datas e Validade Real (RDC 171/2006) */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
          <div>
            <span className="block text-[8px] uppercase font-bold text-slate-600">
              {isPast ? 'Data Pasteurização' : '1ª Ordenha / Coleta'}
            </span>
            <span className="font-medium text-black text-[11px] block">
              {isPast
                ? formatDateOnly(bottle.pasteurizedAt)
                : bottle.firstExpressionAt
                ? `${formatDateOnly(bottle.firstExpressionAt)} (Coleta: ${bottle.dataHoraColeta.split(' ')[0]})`
                : bottle.dataHoraColeta}
            </span>
          </div>

          <div>
            <span className="block text-[8px] uppercase font-bold text-slate-600">
              {isPast ? 'Validade Pasteurizado (6m)' : 'Validade Leite Cru (15d)'}
            </span>
            <span className="font-bold text-black text-[11px] bg-amber-100 px-1.5 py-0.5 rounded border border-amber-400 inline-block font-mono">
              {isPast ? bottle.pasteurizedExpiresAt || '—' : bottle.validadeCru}
            </span>
          </div>
        </div>

        {/* Volume e Temperatura Real */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-slate-300">
          <div>
            <span className="block text-[8px] uppercase font-bold text-slate-600">Volume</span>
            <span className="font-extrabold text-black text-sm font-mono">{bottle.volume} mL</span>
          </div>
          <div>
            <span className="block text-[8px] uppercase font-bold text-slate-600">Temperatura Caixa</span>
            <span
              className={`font-mono font-bold text-xs ${
                isTempOk ? 'text-black' : 'bg-black text-white px-1 rounded'
              }`}
            >
              {bottle.temp} °C ({isTempOk ? 'OK ≤ -10°C' : 'ALERTA > -10°C'})
            </span>
          </div>
        </div>

        {isEstocagem && (
          <div className="pt-1.5 border-t border-black text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span>Extração:</span>
              <strong className="text-black">{bottle.extracao}</strong>
            </div>
            <div className="flex justify-between">
              <span>Pré-Estocagem:</span>
              <strong className="text-black">{bottle.equipamento}</strong>
            </div>
          </div>
        )}

        {isPast && (
          <div className="pt-1.5 border-t border-black text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span>Acidez Dornic / Crematócrito:</span>
              <strong className="text-black font-mono">
                {bottle.acidez && bottle.crematocrito
                  ? `${bottle.acidez} · ${bottle.crematocrito}`
                  : 'Pendente de análise'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Destino UTI Neonatal:</span>
              <strong className="text-black">{bottle.destinoUTI}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Código de Barras CODE 128 REAL (JsBarcode) */}
      <div className="py-2 flex flex-col items-center justify-center border-b-2 border-black">
        <svg
          ref={barcodeSvgRef}
          className="h-10 w-full max-w-[290px]"
          aria-label={`Código de barras Code 128: ${bottle.codigo}`}
        />
        <span className="font-mono text-[10px] font-bold tracking-widest text-black mt-0.5">
          {bottle.codigo}
        </span>
      </div>

      {/* Rodapé */}
      <div className="pt-1.5 flex items-center justify-between text-[8px] text-slate-700 font-mono">
        <span className="truncate max-w-[65%]">{bottle.responsavel}</span>
        <span>RDC 171/2006 · Marília-SP</span>
      </div>
    </div>
  );
};
