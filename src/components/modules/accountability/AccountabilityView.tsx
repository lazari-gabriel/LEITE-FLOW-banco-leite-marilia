import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Package,
  RotateCcw,
  Building2,
  CheckCircle2,
  FlaskConical,
  Baby,
  Tag,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../../hooks/useApp';
import { useAuth } from '../../../context/AuthContext';
import { Bottle, PasteurizationStatus } from '../../../types/bottle';
import { apiFetch, ApiError } from '../../../services/apiClient';
import { StatCard } from '../../ui/StatCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

export const AccountabilityView: React.FC = () => {
  const { stats, bottles, setSelectedBottleId, setActiveLabelType, setCurrentView, addToast } = useApp();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const canRunLab = hasRole('ADMIN', 'COORDENADOR_BLH', 'LABORATORIO');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [labBottle, setLabBottle] = useState<Bottle | null>(null);
  const [dispenseBottle, setDispenseBottle] = useState<Bottle | null>(null);

  // Estado do modal laboratorial
  const [acidezNum, setAcidezNum] = useState('4.0');
  const [crematocritoNum, setCrematocritoNum] = useState('650');
  const [microOk, setMicroOk] = useState(true);
  const [nextStatus, setNextStatus] = useState<'Em Análise' | 'Em Quarentena' | 'Pasteurizado' | 'Descartado'>('Pasteurizado');
  const [discardReason, setDiscardReason] = useState('');
  const [destinoUTI, setDestinoUTI] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredBottles = useMemo(() => {
    return bottles.filter((b) => {
      const matchStatus = statusFilter === 'Todos' || b.statusPast === statusFilter;
      if (!matchStatus) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.codigo.toLowerCase().includes(q) ||
        b.doadoraNome.toLowerCase().includes(q) ||
        b.zona.toLowerCase().includes(q) ||
        b.destinoUTI.toLowerCase().includes(q)
      );
    });
  }, [bottles, search, statusFilter]);

  const openLabModal = (bottle: Bottle) => {
    setLabBottle(bottle);
    setAcidezNum(bottle.acidezDornicNum !== undefined ? String(bottle.acidezDornicNum) : '4.0');
    setCrematocritoNum(bottle.crematocritoKcal !== undefined ? String(bottle.crematocritoKcal) : '650');
    setMicroOk(bottle.microbiologyPassed ?? true);
    setNextStatus('Pasteurizado');
    setDiscardReason(bottle.discardReason || '');
  };

  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labBottle) return;
    setSaving(true);
    try {
      await apiFetch(`/bottles/${labBottle.id}/lab`, {
        method: 'PATCH',
        body: JSON.stringify({
          acidezDornicNum: Number(acidezNum),
          crematocritoKcal: Number(crematocritoNum),
          microbiologyPassed: microOk,
          statusPast: nextStatus,
          discardReason: nextStatus === 'Descartado' ? discardReason.trim() : undefined,
        }),
      });
      void queryClient.invalidateQueries({ queryKey: ['bottles'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      addToast({
        type: 'success',
        title: 'Laudo Laboratorial Registrado',
        description: `Frasco ${labBottle.codigo} atualizado para ${nextStatus}.`,
      });
      setLabBottle(null);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar laudo',
        description: err instanceof ApiError ? err.message : 'Verifique os valores informados.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseBottle || destinoUTI.trim().length < 2) return;
    setSaving(true);
    try {
      await apiFetch(`/bottles/${dispenseBottle.id}/dispense`, {
        method: 'PATCH',
        body: JSON.stringify({ destinoUTI: destinoUTI.trim() }),
      });
      void queryClient.invalidateQueries({ queryKey: ['bottles'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      addToast({
        type: 'success',
        title: 'Frasco Dispensado à UTI Neonatal',
        description: `${dispenseBottle.codigo} vinculado ao receptor ${destinoUTI.trim()} (doadora anonimizada).`,
      });
      setDispenseBottle(null);
      setDestinoUTI('');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao dispensar frasco',
        description: err instanceof ApiError ? err.message : 'Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const statusBadgeVariant = (status: PasteurizationStatus) => {
    if (status === 'Pasteurizado' || status === 'Dispensado') return 'success';
    if (status === 'Descartado') return 'danger';
    if (status === 'Em Quarentena') return 'warning';
    return 'info';
  };

  const parsedAcidez = Number(acidezNum);
  const acidezOutOfSpec = !isNaN(parsedAcidez) && parsedAcidez > 8.0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-blh-line shadow-card">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-1 rounded-md mb-2">
          LEITE FLOW · Laboratório BLH &amp; Estoque Real
        </span>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
          Processamento Laboratorial, Dispensação UTI &amp; Controle de Vidros
        </h1>
        <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
          Registre Acidez Dornic (≤ 8,0 °D), Crematócrito, liberação pós-pasteurização, dispensação anonimizada para a UTI Neonatal e acompanhe o saldo real de frascos de vidro.
        </p>
      </div>

      {/* Grid de Reconciliação Real dos Frascos (vindo do ledger do banco) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Frascos no Hospital (Estoque)"
          value={stats.inventoryStock}
          caption="Saldo calculado do livro de movimentações"
          variant="default"
          icon={<Package className="w-4 h-4 text-blh-primary" />}
        />
        <StatCard
          label="Frascos com as Doadoras"
          value={stats.bottlesWithMothers}
          caption="Entregues em rota aguardando coleta"
          variant="warn"
          icon={<Building2 className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Frascos Coletados"
          value={stats.totalBottles}
          caption={`${stats.totalVolumeMl} mL acumulados no banco`}
          variant="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Taxa de Retorno de Vidros"
          value={stats.returnRate}
          caption="Relação real coletados ÷ entregues"
          variant="accent"
          icon={<RotateCcw className="w-4 h-4 text-blh-accent" />}
        />
      </div>

      {/* Tabela Interativa do Laboratório (Cadernos 1, 2 e 3) */}
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card space-y-4">
        <div className="pb-4 border-b border-blh-line flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blh-primary" />
              <h2 className="text-base sm:text-lg font-serif font-bold text-blh-slate-900">
                Cadeia de Custódia &amp; Controle de Qualidade (RDC 171/2006)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-blh-slate-500 mt-0.5">
              Acompanhe e avance cada frasco da coleta domiciliar até a dispensação na UTI Neonatal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-blh-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar código, doadora ou UTI..."
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-blh-slate-300"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-blh-slate-300 bg-white font-medium"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Em Triagem">Em Triagem</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Em Quarentena">Em Quarentena</option>
              <option value="Pasteurizado">Pasteurizado</option>
              <option value="Dispensado">Dispensado</option>
              <option value="Descartado">Descartado</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <table className="w-full text-left text-xs text-blh-slate-700">
            <thead className="bg-blh-slate-50 border-b border-blh-line text-[11px] font-bold text-blh-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Frasco</th>
                <th className="px-4 py-3">Origem (Caderno 1)</th>
                <th className="px-4 py-3">Coleta &amp; Temp</th>
                <th className="px-4 py-3">Status (Caderno 2)</th>
                <th className="px-4 py-3">Acidez / Calorias</th>
                <th className="px-4 py-3">Destino UTI (Caderno 3)</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blh-line">
              {filteredBottles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-blh-slate-500 text-xs">
                    Nenhum frasco encontrado para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredBottles.map((f) => (
                  <tr key={f.id} className="hover:bg-blh-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-blh-slate-900">
                      {f.codigo}
                      <span className="block text-[10px] font-sans font-normal text-blh-slate-500">
                        {f.volume} mL · Classe {f.classe}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <strong className="block text-blh-slate-900">{f.doadoraNome}</strong>
                      <span className="text-[11px] text-blh-slate-500">
                        DOAD-{String(f.doadoraId).padStart(3, '0')} · Zona {f.zona}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block text-blh-slate-800">{f.dataHoraColeta}</span>
                      <span
                        className={`font-mono font-bold text-[11px] ${
                          f.temp <= -10 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {f.temp} °C {f.temp > -10 ? '(Alerta)' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={statusBadgeVariant(f.statusPast)} size="sm">
                        {f.statusPast}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-blh-slate-700">
                      {f.acidez && f.crematocrito
                        ? `${f.acidez} · ${f.crematocrito}`
                        : 'Pendente de análise'}
                    </td>
                    <td className="px-4 py-3.5">
                      <strong className="text-blh-slate-900 text-xs">{f.destinoUTI}</strong>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] font-medium text-amber-800">
                      {f.statusPast === 'Pasteurizado' || f.statusPast === 'Dispensado'
                        ? `Past: ${f.pasteurizedExpiresAt || '—'}`
                        : `Cru: ${f.validadeCru}`}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canRunLab && f.statusPast !== 'Dispensado' && f.statusPast !== 'Descartado' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openLabModal(f)}
                            leftIcon={<FlaskConical className="w-3.5 h-3.5" />}
                          >
                            Analisar
                          </Button>
                        )}
                        {canRunLab && f.statusPast === 'Pasteurizado' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setDispenseBottle(f);
                              setDestinoUTI('');
                            }}
                            leftIcon={<Baby className="w-3.5 h-3.5" />}
                          >
                            UTI
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedBottleId(f.id);
                            setActiveLabelType(
                              f.statusPast === 'Pasteurizado' || f.statusPast === 'Dispensado'
                                ? 'pasteurizacao'
                                : 'coleta'
                            );
                            setCurrentView('etiquetas');
                          }}
                          title="Abrir etiqueta do frasco"
                          aria-label="Abrir etiqueta do frasco"
                        >
                          <Tag className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Análise Laboratorial (Caderno 2) */}
      <Modal
        isOpen={!!labBottle}
        onClose={() => setLabBottle(null)}
        title="Laudo Laboratorial & Pasteurização"
        subtitle={labBottle ? `Frasco ${labBottle.codigo} (${labBottle.volume} mL)` : ''}
        maxWidth="md"
      >
        <form onSubmit={(e) => void handleSaveLab(e)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="lab-acidez" className="block text-xs font-bold text-blh-slate-700 mb-1">
                Acidez Dornic (°D) * <span className="font-normal text-blh-slate-500">Máx. 8.0 °D</span>
              </label>
              <input
                id="lab-acidez"
                type="number"
                step="0.1"
                min="0"
                max="25"
                required
                value={acidezNum}
                onChange={(e) => setAcidezNum(e.target.value)}
                className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-blh-slate-300"
              />
            </div>

            <div>
              <label htmlFor="lab-crematocrito" className="block text-xs font-bold text-blh-slate-700 mb-1">
                Crematócrito (Kcal/L) *
              </label>
              <input
                id="lab-crematocrito"
                type="number"
                min="100"
                max="1500"
                required
                value={crematocritoNum}
                onChange={(e) => setCrematocritoNum(e.target.value)}
                className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-blh-slate-300"
              />
            </div>
          </div>

          {acidezOutOfSpec && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Acidez Dornic acima de <strong>8.0 °D</strong> viola a RDC ANVISA nº 171/2006. Selecione <strong>Descartado</strong> para registrar baixa sanitária.
              </span>
            </div>
          )}

          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-blh-line bg-blh-slate-50 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={microOk}
              onChange={(e) => setMicroOk(e.target.checked)}
              className="rounded text-blh-primary"
            />
            <span className="font-semibold text-blh-slate-800">
              Cultura microbiológica negativa (aprovado para liberação)
            </span>
          </label>

          <div>
            <label htmlFor="lab-status" className="block text-xs font-bold text-blh-slate-700 mb-1">
              Decisão / Novo Status *
            </label>
            <select
              id="lab-status"
              value={nextStatus}
              onChange={(e) =>
                setNextStatus(
                  e.target.value as 'Em Análise' | 'Em Quarentena' | 'Pasteurizado' | 'Descartado'
                )
              }
              className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white font-semibold"
            >
              <option value="Em Análise">Em Análise</option>
              <option value="Em Quarentena">Em Quarentena (Aguardando cultura)</option>
              <option value="Pasteurizado" disabled={acidezOutOfSpec || !microOk}>
                Pasteurizado — Liberado p/ UTI (Validade +6 meses)
              </option>
              <option value="Descartado">Descartado (Impróprio para consumo)</option>
            </select>
          </div>

          {nextStatus === 'Descartado' && (
            <div>
              <label htmlFor="lab-discard" className="block text-xs font-bold text-blh-slate-700 mb-1">
                Motivo do Descarte *
              </label>
              <input
                id="lab-discard"
                type="text"
                required
                value={discardReason}
                onChange={(e) => setDiscardReason(e.target.value)}
                placeholder="Ex: Acidez Dornic > 8°D / presença de sujidade / desvio térmico"
                className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300"
              />
            </div>
          )}

          <div className="pt-2 border-t border-blh-line flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setLabBottle(null)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={saving}>
              Salvar Laudo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Dispensação UTI (Caderno 3) */}
      <Modal
        isOpen={!!dispenseBottle}
        onClose={() => setDispenseBottle(null)}
        title="Dispensação para UTI Neonatal (Anonimizado)"
        subtitle={dispenseBottle ? `Frasco ${dispenseBottle.codigo} — ${dispenseBottle.acidez} · ${dispenseBottle.crematocrito}` : ''}
        maxWidth="sm"
      >
        <form onSubmit={(e) => void handleSaveDispense(e)} className="space-y-4">
          <div>
            <label htmlFor="uti-destino" className="block text-xs font-bold text-blh-slate-700 mb-1">
              Leito / Prontuário do Recém-Nascido Receptor *
            </label>
            <input
              id="uti-destino"
              type="text"
              required
              value={destinoUTI}
              onChange={(e) => setDestinoUTI(e.target.value)}
              placeholder="Ex: UTI Neonatal · Leito 04 · Pront. #88210"
              className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setDispenseBottle(null)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={saving}>
              Confirmar Dispensação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
