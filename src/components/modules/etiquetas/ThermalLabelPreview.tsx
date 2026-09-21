import React, { useMemo } from 'react';
import { Bottle, LabelType } from '../../../types/bottle';
import { generateBarcodeSvgElements, generateQrCodeSvgPath } from '../../../services/labelService';
import { LEITE_FLOW } from '../../../constants/blh';

interface ThermalLabelPreviewProps {
  bottle: Bottle;
  labelType: LabelType;
}

export const ThermalLabelPreview: React.FC<ThermalLabelPreviewProps> = ({
  bottle,
  labelType
}) => {
  // Código de Barras Vetorial SVG Code128
  const barcodeData = useMemo(() => {
    return generateBarcodeSvgElements(bottle.codigo);
  }, [bottle.codigo]);

  // QR Code Vetorial SVG
  const qrData = useMemo(() => {
    const qrPayload = `LEITE-FLOW://${bottle.codigo}/${bottle.classe}/${bottle.volume}ML`;
    return generateQrCodeSvgPath(qrPayload);
  }, [bottle.codigo, bottle.classe, bottle.volume]);

  const isColeta = labelType === 'coleta';
  const isEstocagem = labelType === 'estocagem';
  const isPast = labelType === 'pasteurizacao';

  return (
    <div className="etiqueta-print-area bg-white text-black p-5 rounded-lg border-2 border-black max-w-[430px] w-full shadow-md font-sans select-none">
      {/* Cabeçalho Oficial LEITE FLOW & Hospital Materno Infantil */}
      <div className="flex items-start justify-between gap-3 pb-2.5 border-b-2 border-black">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[11px] font-extrabold tracking-widest text-black uppercase">
            <span>LEITE FLOW</span>
            <span>•</span>
            <span>BLH MARÍLIA</span>
          </div>
          <h2 className="font-serif font-black text-sm leading-tight text-black mt-0.5">
            {LEITE_FLOW.hospitalName}
          </h2>
          <p className="text-[10px] font-semibold text-slate-700 mt-0.5">
            {isColeta && 'Etiqueta Inicial de Coleta Domiciliar (Cru)'}
            {isEstocagem && 'Rótulo de Estocagem & Classificação Prévia'}
            {isPast && 'Nova Identidade Hospitalar — UTI Neonatal'}
          </p>
        </div>

        {/* QR Code Vetorial */}
        <div className="w-14 h-14 p-1 border border-black rounded bg-white shrink-0">
          <svg
            viewBox={`0 0 ${qrData.size} ${qrData.size}`}
            className="w-full h-full"
            fill="#000000"
          >
            {qrData.paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        </div>
      </div>

      {/* Grid de Campos da Etiqueta */}
      <div className="py-2.5 space-y-2 text-xs border-b-2 border-black">
        {/* Identificador Único do Frasco */}
        <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-slate-300">
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-600">Identificação do Frasco</span>
            <span className="font-mono font-extrabold text-sm text-black tracking-wide">
              {bottle.codigo}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] uppercase font-bold text-slate-600">Zona / Rota</span>
            <span className="font-bold text-black text-xs">
              Zona {bottle.zona}
            </span>
          </div>
        </div>

        {/* Nome da Doadora ou Anonimização */}
        <div>
          <span className="block text-[9px] uppercase font-bold text-slate-600">
            {isPast ? 'Identificação Médica da Doadora (Sigilo)' : 'Doadora Cadastrada'}
          </span>
          <span className="font-bold text-black text-xs block truncate">
            {isPast
              ? `Doadora Anônima (Código DOAD-${String(bottle.doadoraId).padStart(3, '0')})`
              : bottle.doadoraNome}
          </span>
        </div>

        {/* Datas e Prazos */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-600">
              Data/Hora 1ª Coleta *
            </span>
            <span className="font-medium text-black text-[11px]">
              {bottle.dataHoraColeta}
            </span>
            <span className="block text-[8px] text-slate-500">Início da contagem</span>
          </div>

          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-600">
              Validade Leite Cru (15d)
            </span>
            <span className="font-bold text-black text-[11px] bg-amber-100 px-1 py-0.5 rounded border border-amber-300 inline-block">
              {bottle.validadeCru}
            </span>
          </div>
        </div>

        {/* Volume e Temperatura da Caixa */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-slate-300">
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-600">Volume</span>
            <span className="font-extrabold text-black text-sm">
              {bottle.volume} mL
            </span>
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-600">Temperatura Caixa</span>
            <span className="font-mono font-bold text-black text-xs">
              {bottle.temp} °C (&lt; -10°C)
            </span>
          </div>
        </div>

        {/* Campos extras do Rótulo de Estocagem (Visual 2 do PDF) */}
        {isEstocagem && (
          <div className="pt-2 border-t border-black text-[10px] space-y-1">
            <div className="flex justify-between">
              <span>Forma de Extração:</span>
              <strong className="text-black">{bottle.extracao}</strong>
            </div>
            <div className="flex justify-between">
              <span>Pré-Estocagem Residencial:</span>
              <strong className="text-black">{bottle.equipamento}</strong>
            </div>
            <div className="flex justify-between">
              <span>Estado Físico:</span>
              <strong className="text-black">Congelado (&lt; -10°C)</strong>
            </div>
          </div>
        )}

        {/* Campos extras de Pasteurização Hospitalar (Visual 3 do PDF) */}
        {isPast && (
          <div className="pt-2 border-t border-black text-[10px] space-y-1">
            <div className="flex justify-between">
              <span>Acidez Dornic / Crematócrito:</span>
              <strong className="text-black">{bottle.acidez} · {bottle.crematocrito}</strong>
            </div>
            <div className="flex justify-between">
              <span>Destino na UTI Neonatal:</span>
              <strong className="text-black">{bottle.destinoUTI}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Código de Barras (Code128 SVG Vetorial) */}
      <div className="py-2.5 flex flex-col items-center justify-center border-b-2 border-black">
        <svg
          viewBox={`0 0 ${barcodeData.totalWidth} 45`}
          className="h-9 w-full max-w-[280px]"
        >
          {barcodeData.rects.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              fill="#000000"
            />
          ))}
        </svg>
        <span className="font-mono text-[10px] font-bold tracking-widest text-black mt-1">
          *{bottle.codigo}*
        </span>
      </div>

      {/* Classificação Biológica do Leite: Colostro / Transição / Maduro */}
      <div className="pt-2">
        <span className="block text-[9px] uppercase font-bold text-slate-600 mb-1">
          Classificação Biológica do Leite Materno
        </span>
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          <div
            className={`p-1 rounded border ${
              bottle.classe === 'C'
                ? 'bg-black text-white font-bold border-black'
                : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            COLOSTRO (C)
            <span className="block text-[8px] font-normal">1º ao 7º dia</span>
          </div>

          <div
            className={`p-1 rounded border ${
              bottle.classe === 'T'
                ? 'bg-black text-white font-bold border-black'
                : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            TRANSIÇÃO (T)
            <span className="block text-[8px] font-normal">8º ao 14º dia</span>
          </div>

          <div
            className={`p-1 rounded border ${
              bottle.classe === 'M'
                ? 'bg-black text-white font-bold border-black'
                : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            MADURO (M)
            <span className="block text-[8px] font-normal">15º dia em diante</span>
          </div>
        </div>
      </div>

      {/* Rodapé da Etiqueta */}
      <div className="pt-2 mt-2 border-t border-black flex items-center justify-between text-[9px] text-slate-600 font-mono">
        <span>{bottle.responsavel}</span>
        <span>LEITE FLOW · Marília - SP</span>
      </div>
    </div>
  );
};
