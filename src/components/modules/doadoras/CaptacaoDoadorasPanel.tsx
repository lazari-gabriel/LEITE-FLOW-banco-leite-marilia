import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Eye,
  MessageCircle,
  UserPlus,
  Sparkles,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  CheckCircle2,
  Inbox,
} from 'lucide-react';
import {
  buildInterestWhatsAppUrl,
  fetchDonorInterests,
} from '../../../services/donorInterestService';
import {
  BEST_TIME_LABELS,
  DISCOVERY_CHANNEL_LABELS,
  DonorInterest,
  DonorInterestStatus,
  INTEREST_STATUS_META,
  PREFERRED_CONTACT_LABELS,
} from '../../../types/donorInterest';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { TableSkeleton } from '../../motion';
import { InterestDetailModal } from './InterestDetailModal';

interface CaptacaoDoadorasPanelProps {
  onStartConversion: (interest: DonorInterest) => void;
}

const ALL_STATUS_OPTIONS: DonorInterestStatus[] = [
  'NOVA',
  'AGUARDANDO_ANALISE',
  'AGUARDANDO_CONTATO',
  'EM_CONTATO',
  'AGUARDANDO_RETORNO',
  'ENCAMINHADA_CADASTRO',
  'NAO_PROSSEGUIU',
  'ENCERRADA',
];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const CaptacaoDoadorasPanel: React.FC<CaptacaoDoadorasPanelProps> = ({
  onStartConversion,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [zoneFilter, setZoneFilter] = useState<string>('Todas');
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, zoneFilter, unreviewedOnly]);

  const query = useQuery({
    queryKey: [
      'donor-interests',
      { search, statusFilter, zoneFilter, unreviewedOnly, page },
    ],
    queryFn: () =>
      fetchDonorInterests({
        search: search.trim() || undefined,
        status: statusFilter !== 'TODOS' ? statusFilter : undefined,
        zone: zoneFilter !== 'Todas' ? zoneFilter : undefined,
        unreviewedOnly,
        page,
        pageSize: 8,
      }),
    refetchInterval: 60_000,
  });

  const items = query.data?.data ?? [];
  const meta = query.data?.meta;
  const counts = meta?.countsByStatus;

  const totalNew = counts?.NOVA ?? 0;
  const totalInProgress =
    (counts?.AGUARDANDO_ANALISE ?? 0) +
    (counts?.AGUARDANDO_CONTATO ?? 0) +
    (counts?.EM_CONTATO ?? 0) +
    (counts?.AGUARDANDO_RETORNO ?? 0);
  const totalConverted = counts?.ENCAMINHADA_CADASTRO ?? 0;
  const totalAll = counts
    ? Object.values(counts).reduce((acc, n) => acc + n, 0)
    : 0;

  if (query.isLoading && items.length === 0) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-4">
      {/* Mini KPIs da Captação */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-blh-line shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Novas solicitações
          </span>
          <strong className="text-2xl font-mono font-bold text-blh-slate-900 mt-1 block">
            {totalNew}
          </strong>
          <span className="text-[11px] text-blh-slate-500">Aguardando primeira análise</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blh-line shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Em atendimento
          </span>
          <strong className="text-2xl font-mono font-bold text-blh-slate-900 mt-1 block">
            {totalInProgress}
          </strong>
          <span className="text-[11px] text-blh-slate-500">Análise, contato ou retorno</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blh-line shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Convertidas
          </span>
          <strong className="text-2xl font-mono font-bold text-blh-primary mt-1 block">
            {totalConverted}
          </strong>
          <span className="text-[11px] text-blh-slate-500">Encaminhadas ao cadastro oficial</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blh-line shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blh-slate-600 flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5" /> Total recebidas
          </span>
          <strong className="text-2xl font-mono font-bold text-blh-slate-900 mt-1 block">
            {totalAll}
          </strong>
          <span className="text-[11px] text-blh-slate-500">Captação digital do BLH</span>
        </div>
      </div>

      {/* Container Principal da Lista */}
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-blh-line">
          <div>
            <h2 className="text-base sm:text-lg font-sans font-bold text-blh-slate-900">
              Solicitações de Interesse em Doação
            </h2>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-0.5">
              Acompanhe mulheres interessadas em doar, registre contatos e converta para o cadastro
              oficial sem redigitação.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="relative w-full sm:min-w-[220px] flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blh-slate-400" />
              <input
                type="text"
                placeholder="Buscar nome, protocolo, bairro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white font-medium text-blh-slate-800"
            >
              <option value="TODOS">Status: Todos</option>
              {ALL_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {INTEREST_STATUS_META[s].label} ({counts?.[s] ?? 0})
                </option>
              ))}
            </select>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white font-medium text-blh-slate-800"
            >
              <option value="Todas">Todas as Zonas</option>
              <option value="Norte">Zona Norte</option>
              <option value="Sul">Zona Sul</option>
              <option value="Oeste">Zona Oeste</option>
              <option value="Leste">Zona Leste</option>
              <option value="Rural">Zona Rural</option>
            </select>

            <button
              type="button"
              onClick={() => setUnreviewedOnly((prev) => !prev)}
              className={`text-xs px-3 py-2 rounded-lg border font-semibold transition-colors ${
                unreviewedOnly
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-blh-slate-700 border-blh-slate-300 hover:bg-blh-slate-50'
              }`}
            >
              Não analisadas ({totalNew})
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Nenhuma solicitação encontrada"
            description="Ainda não há solicitações para os filtros selecionados. Novas interessadas enviadas pelo botão 'Quero ser doadora' aparecerão aqui automaticamente."
            actionLabel={
              search || statusFilter !== 'TODOS' || zoneFilter !== 'Todas' || unreviewedOnly
                ? 'Limpar Filtros'
                : undefined
            }
            onAction={
              search || statusFilter !== 'TODOS' || zoneFilter !== 'Todas' || unreviewedOnly
                ? () => {
                    setSearch('');
                    setStatusFilter('TODOS');
                    setZoneFilter('Todas');
                    setUnreviewedOnly(false);
                  }
                : undefined
            }
          />
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="block md:hidden divide-y divide-blh-line -mx-5">
              {items.map((item) => {
                const statusMeta = INTEREST_STATUS_META[item.status];
                const isConverted = Boolean(
                  item.convertedDonorId || item.status === 'ENCAMINHADA_CADASTRO'
                );
                return (
                  <div key={item.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blh-slate-100 text-blh-slate-700">
                            {item.protocol}
                          </span>
                          <span className="text-[10px] text-blh-slate-500">
                            {formatShortDate(item.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-blh-slate-900 truncate">
                          {item.fullName}
                        </h3>
                        <p className="text-xs text-blh-slate-600 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-blh-primary shrink-0" />
                          <span className="truncate">
                            {item.neighborhood} · {item.city}
                          </span>
                        </p>
                      </div>
                      <Badge variant={statusMeta.badgeVariant} dot>
                        {statusMeta.label}
                      </Badge>
                    </div>

                    <div className="bg-blh-slate-50 rounded-xl p-2.5 text-xs text-blh-slate-700 space-y-1 border border-blh-line/60">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3 text-blh-slate-400" />
                          {item.phone}
                        </span>
                        <span className="text-[11px] text-blh-slate-500">
                          {PREFERRED_CONTACT_LABELS[item.preferredContact]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-blh-slate-500">
                        <span>{BEST_TIME_LABELS[item.bestContactTime]}</span>
                        <span>{item.contactAttemptsCount} tentativa(s)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {!item.anonymizedAt && (
                        <a
                          href={buildInterestWhatsAppUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInterestId(item.id)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Detalhes
                      </Button>
                      {!isConverted && !item.anonymizedAt && (
                        <Button
                          size="sm"
                          onClick={() => onStartConversion(item)}
                          leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                          className="font-bold"
                        >
                          Cadastrar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-blh-slate-700">
                <thead className="bg-blh-slate-50 border-b border-blh-line text-[11px] font-bold text-blh-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Protocolo / Data</th>
                    <th className="px-4 py-3">Interessada &amp; Região</th>
                    <th className="px-4 py-3">Contato &amp; Horário</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3">Tentativas</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blh-line">
                  {items.map((item) => {
                    const statusMeta = INTEREST_STATUS_META[item.status];
                    const isConverted = Boolean(
                      item.convertedDonorId || item.status === 'ENCAMINHADA_CADASTRO'
                    );
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-blh-slate-50/80 transition-colors ${
                          item.status === 'NOVA' ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-blh-slate-900 block">
                            {item.protocol}
                          </span>
                          <span className="text-[11px] text-blh-slate-500">
                            {formatShortDate(item.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <strong className="block text-blh-slate-900 font-bold text-xs sm:text-sm">
                            {item.fullName}
                          </strong>
                          <span className="text-xs text-blh-slate-600">
                            {item.neighborhood} · {item.city}
                            {item.suggestedZone ? ` (Zona ${item.suggestedZone})` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-semibold text-blh-slate-900 block">
                            {item.phone}
                          </span>
                          <span className="text-[11px] text-blh-slate-500">
                            {PREFERRED_CONTACT_LABELS[item.preferredContact]} ·{' '}
                            {BEST_TIME_LABELS[item.bestContactTime]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-blh-slate-600">
                          {DISCOVERY_CHANNEL_LABELS[item.discoveryChannel]}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-blh-slate-800">
                          {item.contactAttemptsCount}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={statusMeta.badgeVariant} dot>
                            {statusMeta.label}
                          </Badge>
                          {item.convertedDonor && (
                            <span className="block text-[10px] font-mono text-emerald-700 mt-1">
                              → {item.convertedDonor.code}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!item.anonymizedAt && (
                              <a
                                href={buildInterestWhatsAppUrl(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Iniciar conversa no WhatsApp"
                                className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                                aria-label="Abrir WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedInterestId(item.id)}
                              title="Consultar detalhes e histórico"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Atender
                            </Button>
                            {!isConverted && !item.anonymizedAt && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onStartConversion(item)}
                                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                                className="font-bold border-blh-primary/40 text-blh-primary hover:bg-blh-primary-soft"
                              >
                                Cadastrar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {meta && meta.totalPages > 1 && (
              <div className="pt-4 border-t border-blh-line flex items-center justify-between text-xs text-blh-slate-600">
                <span>
                  Página <strong>{meta.page}</strong> de <strong>{meta.totalPages}</strong> ({meta.total}{' '}
                  solicitações)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1.5 rounded-lg border border-blh-slate-200 hover:bg-blh-slate-100 disabled:opacity-30 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    className="px-2.5 py-1.5 rounded-lg border border-blh-slate-200 hover:bg-blh-slate-100 disabled:opacity-30 flex items-center gap-1"
                  >
                    Próxima <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Detalhes e Atendimento */}
      <InterestDetailModal
        interestId={selectedInterestId}
        onClose={() => setSelectedInterestId(null)}
        onStartConversion={(interest) => {
          setSelectedInterestId(null);
          onStartConversion(interest);
        }}
      />
    </div>
  );
};
