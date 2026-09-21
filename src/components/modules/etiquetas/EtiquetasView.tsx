import React, { useState } from 'react';
import { Tag, Printer, Layers, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { LabelType } from '../../../types/bottle';
import { ThermalLabelPreview } from './ThermalLabelPreview';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';

export const EtiquetasView: React.FC = () => {
  const {
    bottles,
    selectedBottle,
    setSelectedBottleId,
    activeLabelType,
    setActiveLabelType,
    setCurrentView,
    activeFlowStep,
    confirmLabelAndCompleteStop,
    advanceToNextStop,
    addToast
  } = useApp();

  const [isLabelConfirmed, setIsLabelConfirmed] = useState(activeFlowStep === 'completed');

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmEtiqueta = () => {
    if (selectedBottle) {
      confirmLabelAndCompleteStop(selectedBottle.id);
      setIsLabelConfirmed(true);
    }
  };

  const handleConcludeAndGoToNext = () => {
    advanceToNextStop();
    setCurrentView('roteirizacao');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-blh-line shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-1 rounded-md mb-2">
            Etiquetas dos Frascos
          </span>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
            Identificação &amp; Rastreabilidade LEITE FLOW
          </h1>
          <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
            Cada frasco possui código único gerado automaticamente, com código de barras Code128 e QR Code para leitura rápida e impressão térmica de 60x40mm.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir Etiqueta
          </Button>
        </div>
      </div>

      {/* Banner de Confirmação no Fluxo de Campo */}
      {selectedBottle && (activeFlowStep === 'label_preview' || activeFlowStep === 'completed' || isLabelConfirmed) && (
        <div className="p-4 sm:p-5 rounded-xl border border-emerald-200 bg-emerald-50/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slideDown">
          <div>
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm sm:text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                {isLabelConfirmed ? 'Etiqueta Confirmada com Sucesso ✓' : 'Confirmação da Etiqueta do Frasco'}
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-1">
              Frasco: <strong>{selectedBottle.codigo}</strong> • Doadora: <strong>{selectedBottle.doadoraNome}</strong> • Volume: <strong>{selectedBottle.volume} mL</strong> • Temp: <strong>{selectedBottle.temp} °C</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {!isLabelConfirmed ? (
              <Button
                size="sm"
                onClick={handleConfirmEtiqueta}
                className="font-bold shadow-md bg-emerald-700 hover:bg-emerald-800"
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirmar Etiqueta
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleConcludeAndGoToNext}
                className="font-bold shadow-md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Concluir e Ir para Próxima Parada
              </Button>
            )}
          </div>
        </div>
      )}

      {bottles.length === 0 ? (
        <EmptyState
          title="Nenhum frasco registrado"
          description="Inicie uma rota e registre uma coleta para gerar a primeira etiqueta."
          actionLabel="Ir para Rotas de Coleta"
          onAction={() => setCurrentView('roteirizacao')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna da Esquerda: Lista de Frascos e Modelo */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-blh-line shadow-card space-y-4">
            <div>
              <label className="block text-xs font-bold text-blh-slate-700 mb-1.5">
                Modelo da Etiqueta
              </label>
              <select
                value={activeLabelType}
                onChange={(e) => setActiveLabelType(e.target.value as LabelType)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-blh-slate-300 bg-white font-semibold text-blh-slate-800"
              >
                <option value="coleta">1. Etiqueta Inicial (Coleta Domiciliar - Cru)</option>
                <option value="estocagem">2. Rótulo de Estocagem &amp; Armazenamento</option>
                <option value="pasteurizacao">3. Nova Identidade (UTI Neonatal - Anonimizado)</option>
              </select>
            </div>

            <div className="border-t border-blh-line pt-4">
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-serif font-bold text-sm text-blh-slate-900">
                  Frascos no Sistema
                </h3>
                <span className="text-xs font-bold text-blh-primary font-mono">
                  {bottles.length} coletados
                </span>
              </div>

              {/* Lista dos Frascos */}
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {bottles.map((b) => {
                  const isSelected = selectedBottle?.id === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBottleId(b.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blh-primary bg-blh-primary-soft/40 shadow-sm ring-1 ring-blh-primary/20'
                          : 'border-blh-line bg-white hover:border-blh-line-strong hover:bg-blh-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono font-bold text-xs text-blh-primary">
                          {b.codigo}
                        </span>
                        <span className="font-bold text-xs text-blh-slate-900">
                          {b.volume} mL
                        </span>
                      </div>

                      <div className="font-medium text-xs text-blh-slate-800">
                        {b.doadoraNome}
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-blh-line/60 text-[11px] text-blh-slate-500">
                        <span>Zona {b.zona}</span>
                        <span>{b.dataHoraColeta}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Palco de Impressão */}
          <div className="lg:col-span-7 bg-blh-slate-100/80 p-6 sm:p-8 rounded-xl border border-blh-line flex flex-col items-center justify-center min-h-[480px]">
            {selectedBottle && (
              <div className="space-y-4 flex flex-col items-center w-full">
                <ThermalLabelPreview
                  bottle={selectedBottle}
                  labelType={activeLabelType}
                />

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    size="sm"
                    onClick={handlePrint}
                    leftIcon={<Printer className="w-4 h-4" />}
                  >
                    Imprimir Esta Etiqueta (60x40mm)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
