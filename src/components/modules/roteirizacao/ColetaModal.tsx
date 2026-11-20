import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Plus, Trash2, Calendar, MapPin, Droplets } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { BatchBottleItem, Bottle } from '../../../types/bottle';
import { Donor } from '../../../types/donor';
import { useApp } from '../../../hooks/useApp';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { calculateMilkClass, getMilkClassDescription } from '../../../services/donorService';
import { calculateRawMilkExpiry } from '../../../services/bottleService';
import { apiFetch, ApiError } from '../../../services/apiClient';

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
  onSuccess,
}) => {
  const {
    finishStopCollectionAndShowLabel,
    setSelectedBottleId,
    setActiveFlowStep,
    setCurrentView,
    routeAssignment,
    addToast,
  } = useApp();
  const queryClient = useQueryClient();

  const suggestedClass = calculateMilkClass(donor.parto);
  const classDesc = getMilkClassDescription(suggestedClass);
  const todayIso = new Date().toISOString().split('T')[0];

  const [items, setItems] = useState<BatchBottleItem[]>([
    {
      volume: 150,
      temp: -16.5,
      classe: suggestedClass,
      firstExpressionAt: todayIso,
      observacao: '',
    },
  ]);
  const [frascosEntregues, setFrascosEntregues] = useState(4);
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [saving, setSaving] = useState(false);

  const quickVolumes = [100, 150, 200, 250, 300];
  const isRouteActive = routeAssignment?.status === 'active';

  const updateItem = (idx: number, patch: Partial<BatchBottleItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addBottleRow = () => {
    const last = items[items.length - 1];
    setItems((prev) => [
      ...prev,
      {
        volume: last?.volume ?? 150,
        temp: last?.temp ?? -16.5,
        classe: suggestedClass,
        firstExpressionAt: last?.firstExpressionAt ?? todayIso,
        observacao: '',
      },
    ]);
  };

  const removeBottleRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const getExpiryInfo = (firstExprIso: string) => {
    const d = new Date(`${firstExprIso}T00:00:00`);
    if (isNaN(d.getTime())) return { label: '—', daysLeft: 15 };
    const exp = new Date(d);
    exp.setDate(exp.getDate() + 15);
    const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { label: calculateRawMilkExpiry(d), daysLeft };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRouteActive) {
      addToast({
        type: 'warning',
        title: 'Rota Não Iniciada',
        description: 'Inicie a rota de campo antes de registrar coletas.',
      });
      return;
    }

    if (items.length === 1) {
      const single = items[0];
      finishStopCollectionAndShowLabel({
        doadoraId: donor.id,
        volume: single.volume,
        temp: single.temp,
        classe: single.classe,
        firstExpressionAt: single.firstExpressionAt,
        frascosEntregues,
        observacao: observacaoGeral || single.observacao,
      });
      onClose();
      onSuccess?.();
      setCurrentView('etiquetas');
      return;
    }

    // Coleta Multi-Frasco (1:N atômica via POST /bottles/batch)
    setSaving(true);
    try {
      const res = await apiFetch<{ bottles: Bottle[] }>('/bottles/batch', {
        method: 'POST',
        body: JSON.stringify({
          doadoraId: donor.id,
          routeId: routeAssignment?.id,
          frascosEntregues,
          observacao: observacaoGeral.trim() || undefined,
          items,
        }),
      });
      void queryClient.invalidateQueries({ queryKey: ['bottles'] });
      void queryClient.invalidateQueries({ queryKey: ['routes'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      if (res.bottles[0]) {
        setSelectedBottleId(res.bottles[0].id);
      }
      setActiveFlowStep('label_preview');
      addToast({
        type: 'success',
        title: `${res.bottles.length} Frascos Registrados ✓`,
        description: `Códigos gerados: ${res.bottles.map((b) => b.codigo).join(', ')}.`,
      });
      onClose();
      onSuccess?.();
      setCurrentView('etiquetas');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao registrar frascos',
        description: err instanceof ApiError ? err.message : 'Verifique os dados informados.',
      });
    } finally {
      setSaving(false);
    }
  };

  const totalVolume = items.reduce((acc, it) => acc + (Number(it.volume) || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Coleta de Leite (Multi-Frasco)"
      subtitle={`Doadora: ${donor.nome} • ${classDesc.name}`}
      maxWidth="lg"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {/* Resumo da Doadora */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-blh-primary-soft/80 via-emerald-50/40 to-white border border-blh-line-strong border-l-4 border-l-blh-primary flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-sm font-bold text-blh-slate-900 truncate">{donor.nome}</strong>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blh-primary text-white shadow-sm shrink-0">
                Zona {donor.zona}
              </span>
            </div>
            <p className="text-xs text-blh-slate-600 flex items-start gap-1.5 leading-snug">
              <MapPin className="w-3.5 h-3.5 text-blh-primary shrink-0 mt-0.5" />
              <span className="line-clamp-2">{donor.endereco}</span>
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 px-3 py-2 rounded-lg bg-white border border-blh-line shadow-sm shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blh-slate-500 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blh-primary" />
              Total da Visita
            </span>
            <div className="font-mono text-sm font-extrabold text-blh-primary tabular-nums leading-tight">
              {totalVolume} mL{' '}
              <span className="text-[11px] font-sans font-semibold text-blh-slate-500">
                ({items.length} {items.length === 1 ? 'frasco' : 'frascos'})
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Frascos Coletados na Visita */}
        <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
          {items.map((item, idx) => {
            const expiry = getExpiryInfo(item.firstExpressionAt);
            const isTempOk = item.temp <= -10;

            return (
              <div key={idx} className="p-3.5 rounded-xl border border-blh-line bg-blh-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blh-primary uppercase tracking-wider">
                    Frasco #{idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBottleRow(idx)}
                      className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>

                {/* Volume rápido */}
                <div>
                  <label className="block text-[11px] font-bold text-blh-slate-700 mb-1">
                    Volume Coletado (mL) *
                  </label>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {quickVolumes.map((vol) => (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => updateItem(idx, { volume: vol })}
                        className={`flex-1 py-1 rounded text-[11px] font-bold border transition-all ${
                          item.volume === vol
                            ? 'bg-blh-primary text-white border-blh-primary'
                            : 'bg-white text-blh-slate-700 border-blh-slate-300 hover:bg-blh-slate-50'
                        }`}
                      >
                        {vol}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    step="5"
                    required
                    value={item.volume}
                    onChange={(e) => updateItem(idx, { volume: Number(e.target.value) })}
                    className="w-full text-sm font-bold font-mono px-3 py-1.5 rounded-lg border border-blh-slate-300 bg-white"
                  />
                </div>

                {/* Data da 1ª Ordenha + Temperatura */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <div>
                    <label className="text-[11px] font-bold text-blh-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blh-primary shrink-0" />
                      Data da 1ª Ordenha * (RDC 171)
                    </label>
                    <input
                      type="date"
                      required
                      max={todayIso}
                      value={item.firstExpressionAt}
                      onChange={(e) => updateItem(idx, { firstExpressionAt: e.target.value })}
                      className="w-full h-10 text-xs px-2.5 rounded-lg border border-blh-slate-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                    />
                    <span
                      className={`text-[10px] font-semibold mt-1 block ${
                        expiry.daysLeft <= 0
                          ? 'text-rose-700'
                          : expiry.daysLeft <= 3
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      Validade Leite Cru (15d): {expiry.label}{' '}
                      {expiry.daysLeft <= 0
                        ? '(VENCIDO!)'
                        : expiry.daysLeft <= 3
                        ? `(${expiry.daysLeft}d restantes)`
                        : ''}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blh-slate-700 mb-1">
                      Temperatura Caixa (°C) * <span className="font-normal text-emerald-700">≤ -10°C</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={item.temp}
                      onChange={(e) => updateItem(idx, { temp: Number(e.target.value) })}
                      className="w-full h-10 text-sm font-bold font-mono px-3 rounded-lg border border-blh-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                    />
                    {!isTempOk && (
                      <span className="text-[10px] font-bold text-rose-700 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Acima de -10°C (desvio térmico!)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addBottleRow}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="w-full border-dashed"
        >
          Adicionar outro frasco desta doadora
        </Button>

        {/* Frascos vazios entregues + Observação */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-blh-line items-end">
          <div className="sm:col-span-5">
            <label htmlFor="coleta-entregues" className="block text-xs font-semibold text-blh-slate-700 mb-1.5">
              Vidros Estéreis Entregues
            </label>
            <input
              id="coleta-entregues"
              type="number"
              min="0"
              max="50"
              value={frascosEntregues}
              onChange={(e) => setFrascosEntregues(Number(e.target.value))}
              className="w-full h-10 text-sm px-3 rounded-lg border border-blh-slate-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
            />
          </div>
          <div className="sm:col-span-7">
            <label htmlFor="coleta-obs" className="block text-xs font-semibold text-blh-slate-700 mb-1.5">
              Observações da Visita (Opcional)
            </label>
            <input
              id="coleta-obs"
              type="text"
              placeholder="Ex.: Doadora solicitou mais frascos para a próxima semana..."
              value={observacaoGeral}
              onChange={(e) => setObservacaoGeral(e.target.value)}
              className="w-full h-10 text-xs px-3 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="pt-2 border-t border-blh-line flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            type="submit"
            size="md"
            isLoading={saving}
            className="w-full sm:w-auto font-bold shadow-md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Registrar {items.length === 1 ? 'Coleta' : `${items.length} Frascos`} e Gerar Etiqueta
          </Button>
        </div>
      </form>
    </Modal>
  );
};
