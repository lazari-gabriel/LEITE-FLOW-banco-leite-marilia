import React, { useState } from 'react';
import { Milk, Thermometer, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { CollectionFormData, MilkClass } from '../../../types/bottle';
import { Donor } from '../../../types/donor';
import { useApp } from '../../../hooks/useApp';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { calculateMilkClass, getMilkClassDescription } from '../../../services/donorService';

interface ColetaModalProps {
  donor: Donor;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ColetaModal: React.FC<ColetaModalProps> = ({ 
  donor, 
  isOpen, 
  onClose,
  onSuccess
}) => {
  const { finishStopCollectionAndShowLabel, setCurrentView, routeAssignment, addToast } = useApp();

  const suggestedClass = calculateMilkClass(donor.parto);
  const classDesc = getMilkClassDescription(suggestedClass);

  const [formData, setFormData] = useState<CollectionFormData>({
    doadoraId: donor.id,
    volume: 150,
    temp: -17.2,
    classe: suggestedClass,
    frascosEntregues: 4
  });

  const [condicao, setCondicao] = useState<'normal' | 'alerta'>('normal');
  const [observacao, setObservacao] = useState('');

  const quickVolumes = [100, 150, 200, 250, 300];
  const isTempConforme = formData.temp <= -10;
  const isRouteActive = routeAssignment?.status === 'active';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRouteActive) {
      addToast({
        type: 'warning',
        title: 'Rota Não Iniciada',
        description: 'Clique em "Iniciar Rota de Campo" na aba Montar Rota antes de registrar coletas.'
      });
      return;
    }
    finishStopCollectionAndShowLabel({ ...formData, observacao });
    onClose();
    if (onSuccess) onSuccess();
    // Vai diretamente para a conferência da etiqueta do frasco
    setCurrentView('etiquetas');
  };

  const hojeFormatado = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const horaAtual = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Coleta de Leite"
      subtitle={`Doadora: ${donor.nome}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabeçalho Resumido com Informações Pré-preenchidas */}
        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <div className="font-bold text-sm text-emerald-900 flex items-center justify-between">
            <span>{donor.nome}</span>
            <span className="text-[11px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
              Zona {donor.zona}
            </span>
          </div>
          <div className="text-emerald-800 text-[11px]">
            📍 {donor.endereco}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-emerald-700 pt-0.5">
            <span>📅 {hojeFormatado}</span>
            <span>•</span>
            <span>🕐 {horaAtual}</span>
            <span>•</span>
            <span>Bebê: <strong>{donor.bebe}</strong></span>
          </div>
        </div>

        {/* Campo 1: Volume Coletado com botões rápidos */}
        <div>
          <label className="block text-xs font-bold text-blh-slate-800 mb-1.5">
            Volume Coletado (em mL) *
          </label>
          <div className="flex items-center gap-2 mb-2">
            {quickVolumes.map((vol) => (
              <button
                key={vol}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, volume: vol }))}
                className={`flex-1 py-1.5 rounded text-xs font-bold border transition-all ${
                  formData.volume === vol
                    ? 'bg-blh-primary text-white border-blh-primary shadow-sm'
                    : 'bg-white text-blh-slate-700 border-blh-slate-300 hover:bg-blh-slate-50'
                }`}
              >
                {vol} ml
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number"
              min="10"
              max="2000"
              step="5"
              required
              value={formData.volume}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, volume: Number(e.target.value) }))
              }
              className="w-full text-base font-bold text-blh-slate-900 pl-3 pr-12 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary focus:border-blh-primary font-mono"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blh-slate-400">
              mL
            </span>
          </div>
        </div>

        {/* Campo 2: Temperatura da Caixa Térmica */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-blh-slate-800">
              Temperatura da Caixa Térmica (°C) *
            </label>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Ideal: &lt; -10°C
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              required
              value={formData.temp}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, temp: Number(e.target.value) }))
              }
              className="w-full text-base font-bold text-blh-slate-900 pl-3 pr-12 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary focus:border-blh-primary font-mono"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blh-slate-400">
              °C
            </span>
          </div>
          {!isTempConforme && (
            <div className="mt-1.5 p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Atenção: A temperatura deve estar abaixo de -10°C.</span>
            </div>
          )}
        </div>

        {/* Campo 3: Frascos Esterilizados Vazios Entregues */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
              Frascos Novos Entregues
            </label>
            <input
              type="number"
              min="0"
              value={formData.frascosEntregues}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, frascosEntregues: Number(e.target.value) }))
              }
              className="w-full text-sm px-3 py-2 rounded-lg border border-blh-slate-300 font-medium"
            />
            <span className="text-[10px] text-blh-slate-500 block mt-0.5">Vidros com tampa</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
              Classificação do Leite
            </label>
            <div className="px-3 py-2 rounded-lg bg-blh-slate-100 border border-blh-slate-200 text-xs font-bold text-blh-slate-800">
              {classDesc.name}
            </div>
            <span className="text-[10px] text-blh-slate-500 block mt-0.5">{classDesc.phase}</span>
          </div>
        </div>

        {/* Campo 4: Observação Opcional */}
        <div>
          <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
            Observações (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ex: Leite ordenhado há 2 dias, bem congelado..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300"
          />
        </div>

        {/* Botão de Ação Principal */}
        <div className="pt-2 border-t border-blh-line flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            type="submit"
            size="md"
            className="w-full sm:w-auto font-bold shadow-md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Registrar Coleta e Gerar Etiqueta
          </Button>
        </div>
      </form>
    </Modal>
  );
};
