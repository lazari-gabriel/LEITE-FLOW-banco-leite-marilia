import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  CheckCircle2,
  ArrowRight,
  Search,
  Download,
  ShieldAlert,
  History,
  Ban,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../../hooks/useApp';
import { useAuth } from '../../../context/AuthContext';
import { LabelFormat, LabelPrintLogItem, LabelType } from '../../../types/bottle';
import { canEmitLabelType, generateZplLabel } from '../../../services/labelService';
import { apiFetch, ApiError } from '../../../services/apiClient';
import { ThermalLabelPreview } from './ThermalLabelPreview';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Modal } from '../../ui/Modal';

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
    addToast,
  } = useApp();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [isLabelConfirmed, setIsLabelConfirmed] = useState(activeFlowStep === 'completed');
  const [searchTerm, setSearchTerm] = useState('');
  const [printFormat, setPrintFormat] = useState<LabelFormat>('60x40mm');
  const [batchIds, setBatchIds] = useState<number[]>([]);
  const [reprintReason, setReprintReason] = useState('');
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [voidingLog, setVoidingLog] = useState<LabelPrintLogItem | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Corrige bug: reseta confirmação local sempre que mudar de frasco selecionado
  useEffect(() => {
    setIsLabelConfirmed(activeFlowStep === 'completed');
  }, [selectedBottle?.id, activeFlowStep]);

  // Histórico real de impressões do frasco selecionado
  const printLogsQuery = useQuery({
    queryKey: ['bottle-labels', selectedBottle?.id],
    queryFn: async () =>
      (await apiFetch<{ data: LabelPrintLogItem[] }>(`/bottles/${selectedBottle!.id}/labels`)).data,
    enabled: !!selectedBottle?.id,
  });

  const printLogs = printLogsQuery.data ?? [];
  const validCopiesForType = printLogs.filter(
    (l) => l.labelType === activeLabelType && l.status === 'valid'
  ).length;

  const labelGate = selectedBottle
    ? canEmitLabelType(selectedBottle, activeLabelType)
    : { allowed: false, reason: 'Selecione um frasco.' };

  const filteredBottles = useMemo(() => {
    if (!searchTerm.trim()) return bottles;
    const q = searchTerm.toLowerCase();
    return bottles.filter(
      (b) =>
        b.codigo.toLowerCase().includes(q) ||
        b.doadoraNome.toLowerCase().includes(q) ||
        b.zona.toLowerCase().includes(q)
    );
  }, [bottles, searchTerm]);

  const batchBottles = useMemo(
    () => bottles.filter((b) => batchIds.includes(b.id)),
    [bottles, batchIds]
  );

  const toggleBatchSelection = (id: number) => {
    setBatchIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const executeAuditedPrint = async (reason?: string) => {
    if (!selectedBottle) return;
    if (!labelGate.allowed) {
      addToast({ type: 'error', title: 'Emissão Bloqueada', description: labelGate.reason });
      return;
    }

    const targets = printFormat === 'A4_BATCH' && batchBottles.length > 0 ? batchBottles : [selectedBottle];

    try {
      for (const b of targets) {
        const gate = canEmitLabelType(b, activeLabelType);
        if (!gate.allowed) {
          addToast({
            type: 'warning',
            title: `Frasco ${b.codigo} ignorado`,
            description: gate.reason,
          });
          continue;
        }
        await apiFetch(`/bottles/${b.id}/labels`, {
          method: 'POST',
          body: JSON.stringify({
            labelType: activeLabelType,
            format: printFormat,
            reason: reason || (validCopiesForType > 0 ? 'Reimpressão controlada' : 'Emissão inicial'),
          }),
        });
      }

      void queryClient.invalidateQueries({ queryKey: ['bottle-labels', selectedBottle.id] });
      document.body.classList.toggle('print-thermal-60x40', printFormat === '60x40mm');
      window.print();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível registrar emissão',
        description: err instanceof ApiError ? err.message : 'Verifique a conexão com o servidor.',
      });
    }
  };

  const handlePrintClick = () => {
    if (!selectedBottle || !labelGate.allowed) return;
    if (validCopiesForType >= 1 && printFormat !== 'A4_BATCH') {
      setReprintReason('');
      setIsReprintModalOpen(true);
      return;
    }
    void executeAuditedPrint();
  };

  const handleDownloadZpl = async () => {
    if (!selectedBottle || !labelGate.allowed) return;
    const zpl = generateZplLabel(selectedBottle, activeLabelType);
    const blob = new Blob([zpl], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBottle.codigo}-${activeLabelType}.zpl`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      await apiFetch(`/bottles/${selectedBottle.id}/labels`, {
        method: 'POST',
        body: JSON.stringify({
          labelType: activeLabelType,
          format: 'ZPL',
          reason: validCopiesForType >= 1 ? 'Exportação ZPL (reimpressão)' : 'Exportação ZPL térmica',
        }),
      });
      void queryClient.invalidateQueries({ queryKey: ['bottle-labels', selectedBottle.id] });
      addToast({
        type: 'success',
        title: 'Arquivo ZPL gerado',
        description: `Pronto para envio à impressora térmica (60×40mm): ${selectedBottle.codigo}.zpl`,
      });
    } catch {
      // Download já realizado
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidingLog || voidReason.trim().length < 3) return;
    try {
      await apiFetch(`/labels/${voidingLog.id}/void`, {
        method: 'PATCH',
        body: JSON.stringify({ voidReason: voidReason.trim() }),
      });
      void queryClient.invalidateQueries({ queryKey: ['bottle-labels', selectedBottle?.id] });
      setVoidingLog(null);
      setVoidReason('');
      addToast({ type: 'warning', title: 'Etiqueta anulada', description: 'Registro marcado como cancelado na auditoria.' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao anular etiqueta',
        description: err instanceof ApiError ? err.message : 'Tente novamente.',
      });
    }
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
            Etiquetas &amp; Rastreabilidade Real (ISO Code128 + QR)
          </span>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
            Central de Etiquetagem LEITE FLOW
          </h1>
          <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
            Códigos ópticos reais (Code 128 + QR ISO/IEC 18004 sem PII), controle de vias, bloqueio sanitário de pasteurização, lote A4 e exportação ZPL (60×40mm).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            disabled={!selectedBottle || !labelGate.allowed}
            onClick={() => void handleDownloadZpl()}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar ZPL
          </Button>
          <Button
            size="sm"
            disabled={!selectedBottle || !labelGate.allowed}
            onClick={handlePrintClick}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            {printFormat === 'A4_BATCH' && batchBottles.length > 0
              ? `Imprimir Lote (${batchBottles.length})`
              : validCopiesForType >= 1
              ? `Reimprimir (${validCopiesForType + 1}ª via)`
              : 'Imprimir Etiqueta'}
          </Button>
        </div>
      </div>

      {/* Banner de Confirmação no Fluxo de Campo */}
      {selectedBottle && (activeFlowStep === 'label_preview' || activeFlowStep === 'completed') && (
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
          description="Inicie uma rota e registre uma coleta para gerar a primeira etiqueta com Code 128 e QR Code reais."
          actionLabel="Ir para Rotas de Coleta"
          onAction={() => setCurrentView('roteirizacao')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Configurações + Lista com seleção em lote */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-blh-line shadow-card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="label-type-select" className="block text-xs font-bold text-blh-slate-700 mb-1">
                  Modelo da Etiqueta
                </label>
                <select
                  id="label-type-select"
                  value={activeLabelType}
                  onChange={(e) => setActiveLabelType(e.target.value as LabelType)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-blh-slate-300 bg-white font-semibold text-blh-slate-800"
                >
                  <option value="coleta">1. Coleta Domiciliar (Cru)</option>
                  <option value="estocagem">2. Pré-Estocagem</option>
                  <option value="pasteurizacao">3. UTI Neonatal (Anônimo)</option>
                </select>
              </div>

              <div>
                <label htmlFor="label-format-select" className="block text-xs font-bold text-blh-slate-700 mb-1">
                  Formato de Impressão
                </label>
                <select
                  id="label-format-select"
                  value={printFormat}
                  onChange={(e) => setPrintFormat(e.target.value as LabelFormat)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-blh-slate-300 bg-white font-semibold text-blh-slate-800"
                >
                  <option value="60x40mm">Térmica 60×40mm (Individual)</option>
                  <option value="100x50mm">Térmica 100×50mm (Ampliada)</option>
                  <option value="A4_BATCH">Folha A4 (Impressão em Lote)</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-blh-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por código LF-2026, doadora ou zona..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30"
              />
            </div>

            <div className="border-t border-blh-line pt-3">
              <div className="flex items-center justify-between pb-2.5">
                <h3 className="font-serif font-bold text-sm text-blh-slate-900">
                  Frascos no Sistema ({filteredBottles.length})
                </h3>
                {printFormat === 'A4_BATCH' && (
                  <button
                    type="button"
                    onClick={() =>
                      setBatchIds(
                        batchIds.length === filteredBottles.length ? [] : filteredBottles.map((b) => b.id)
                      )
                    }
                    className="text-[11px] font-bold text-blh-primary hover:underline"
                  >
                    {batchIds.length === filteredBottles.length ? 'Desmarcar lote' : 'Selecionar todos'}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredBottles.map((b) => {
                  const isSelected = selectedBottle?.id === b.id;
                  const isInBatch = batchIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBottleId(b.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-blh-primary bg-blh-primary-soft/40 shadow-sm ring-1 ring-blh-primary/20'
                          : 'border-blh-line bg-white hover:border-blh-line-strong hover:bg-blh-slate-50'
                      }`}
                    >
                      {printFormat === 'A4_BATCH' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBatchSelection(b.id);
                          }}
                          className="mt-0.5 text-blh-primary"
                          aria-label={`Selecionar ${b.codigo} para lote`}
                        >
                          {isInBatch ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-blh-slate-400" />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-blh-primary">{b.codigo}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blh-slate-100 text-blh-slate-700">
                            {b.statusPast}
                          </span>
                        </div>
                        <div className="font-medium text-xs text-blh-slate-800 truncate mt-0.5">{b.doadoraNome}</div>
                        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-blh-line/60 text-[11px] text-blh-slate-500">
                          <span>{b.volume} mL · {b.temp}°C</span>
                          <span>Val. {b.validadeCru}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Preview 1:1 + Gate Sanitário + Histórico de Impressões */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-blh-slate-100/80 p-6 sm:p-8 rounded-xl border border-blh-line flex flex-col items-center justify-center min-h-[380px]">
              {selectedBottle && !labelGate.allowed ? (
                <div className="max-w-md bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-950 space-y-2 text-center">
                  <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
                  <h3 className="font-bold text-sm">Emissão de Etiqueta UTI Bloqueada</h3>
                  <p className="text-xs text-rose-800 leading-relaxed">{labelGate.reason}</p>
                  <div className="pt-2">
                    <Button size="sm" variant="outline" onClick={() => setCurrentView('accountability')}>
                      Ir para Laboratório BLH
                    </Button>
                  </div>
                </div>
              ) : selectedBottle ? (
                <div className="space-y-4 flex flex-col items-center w-full">
                  {printFormat === 'A4_BATCH' && batchBottles.length > 1 ? (
                    <div className="etiquetas-batch-print grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {batchBottles.map((b) => (
                        <ThermalLabelPreview
                          key={b.id}
                          bottle={b}
                          labelType={activeLabelType}
                          format="A4_BATCH"
                        />
                      ))}
                    </div>
                  ) : (
                    <ThermalLabelPreview
                      bottle={selectedBottle}
                      labelType={activeLabelType}
                      format={printFormat}
                      copyNumber={validCopiesForType > 0 ? validCopiesForType + 1 : 1}
                    />
                  )}
                </div>
              ) : null}
            </div>

            {/* Histórico Auditado de Emissões / Reimpressões */}
            {selectedBottle && (
              <div className="bg-white p-5 rounded-xl border border-blh-line shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blh-primary" />
                    <h3 className="font-serif font-bold text-sm text-blh-slate-900">
                      Histórico de Emissões — {selectedBottle.codigo}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-blh-slate-500">
                    {printLogs.length} registro(s)
                  </span>
                </div>

                {printLogs.length === 0 ? (
                  <p className="text-xs text-blh-slate-500">
                    Nenhuma impressão registrada ainda para este frasco.
                  </p>
                ) : (
                  <div className="divide-y divide-blh-line text-xs">
                    {printLogs.map((log) => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-blh-slate-900">
                              {log.copyNumber}ª via ({log.labelType})
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blh-slate-100 text-blh-slate-700 font-mono">
                              {log.format}
                            </span>
                            {log.status === 'voided' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                                ANULADA: {log.voidReason}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-blh-slate-500 mt-0.5">
                            Por {log.printedByName} em {new Date(log.printedAt).toLocaleString('pt-BR')}
                            {log.reason ? ` · Motivo: ${log.reason}` : ''}
                          </p>
                        </div>

                        {log.status === 'valid' && hasRole('ADMIN', 'COORDENADOR_BLH', 'LABORATORIO') && (
                          <button
                            type="button"
                            onClick={() => setVoidingLog(log)}
                            className="text-[11px] font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded inline-flex items-center gap-1 shrink-0"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Anular
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Reimpressão Controlada (motivo obrigatório) */}
      <Modal
        isOpen={isReprintModalOpen}
        onClose={() => setIsReprintModalOpen(false)}
        title="Reimpressão Controlada de Etiqueta"
        subtitle={selectedBottle ? `Frasco ${selectedBottle.codigo} — ${validCopiesForType + 1}ª via` : ''}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-blh-slate-600">
            Já existe {validCopiesForType} via(s) válida(s) emitida(s) para este modelo. Informe o motivo da reimpressão para fins de rastreabilidade.
          </p>
          <div>
            <label htmlFor="reprint-reason" className="block text-xs font-bold text-blh-slate-700 mb-1">
              Motivo da reimpressão *
            </label>
            <input
              id="reprint-reason"
              type="text"
              value={reprintReason}
              onChange={(e) => setReprintReason(e.target.value)}
              placeholder="Ex: Etiqueta danificada pelo congelamento / falha na impressora"
              className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsReprintModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={reprintReason.trim().length < 3}
              onClick={() => {
                setIsReprintModalOpen(false);
                void executeAuditedPrint(reprintReason.trim());
              }}
            >
              Registrar e Imprimir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Anulação de Etiqueta */}
      <Modal
        isOpen={!!voidingLog}
        onClose={() => setVoidingLog(null)}
        title="Anular Etiqueta Emitida"
        subtitle="A etiqueta permanecerá no histórico como cancelada para auditoria."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="void-reason" className="block text-xs font-bold text-blh-slate-700 mb-1">
              Motivo da anulação *
            </label>
            <input
              id="void-reason"
              type="text"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Ex: Impressão borrada / troca de frasco"
              className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setVoidingLog(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={voidReason.trim().length < 3}
              onClick={() => void handleConfirmVoid()}
            >
              Confirmar Anulação
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
