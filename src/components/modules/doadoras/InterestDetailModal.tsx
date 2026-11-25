import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Calendar,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  History,
  Send,
  Save,
  Trash2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../hooks/useApp';
import { ApiError } from '../../../services/apiClient';
import {
  anonymizeInterest,
  buildInterestWhatsAppUrl,
  fetchDonorInterestDetail,
  logInterestContact,
  updateInterestNotes,
  updateInterestStatus,
} from '../../../services/donorInterestService';
import {
  BEST_TIME_LABELS,
  CONTACT_CHANNEL_LABELS,
  CONTACT_OUTCOME_LABELS,
  ContactChannel,
  ContactOutcome,
  DISCOVERY_CHANNEL_LABELS,
  DonorInterest,
  DonorInterestStatus,
  INTEREST_STATUS_META,
  KNOWS_PROCESS_LABELS,
  PREFERRED_CONTACT_LABELS,
} from '../../../types/donorInterest';
import { ZoneName } from '../../../types/donor';
import { Modal } from '../../ui/Modal';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface InterestDetailModalProps {
  interestId: string | null;
  onClose: () => void;
  onStartConversion: (interest: DonorInterest) => void;
}

const MANUAL_STATUSES: Array<Exclude<DonorInterestStatus, 'ENCAMINHADA_CADASTRO'>> = [
  'NOVA',
  'AGUARDANDO_ANALISE',
  'AGUARDANDO_CONTATO',
  'EM_CONTATO',
  'AGUARDANDO_RETORNO',
  'NAO_PROSSEGUIU',
  'ENCERRADA',
];

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const InterestDetailModal: React.FC<InterestDetailModalProps> = ({
  interestId,
  onClose,
  onStartConversion,
}) => {
  const { hasRole } = useAuth();
  const { addToast } = useApp();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ['donor-interest-detail', interestId],
    queryFn: () => fetchDonorInterestDetail(interestId!),
    enabled: Boolean(interestId),
  });

  const interest = detailQuery.data?.interest;
  const duplicates = detailQuery.data?.possibleDuplicates ?? [];

  // Estado do formulário de tentativa de contato
  const [contactChannel, setContactChannel] = useState<ContactChannel>('WHATSAPP');
  const [contactOutcome, setContactOutcome] = useState<ContactOutcome>('ATENDEU');
  const [contactNotes, setContactNotes] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Estado de alteração de status
  const [nextStatus, setNextStatus] = useState<Exclude<DonorInterestStatus, 'ENCAMINHADA_CADASTRO'> | ''>('');
  const [closureReason, setClosureReason] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Estado de observações & zona
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [zoneDraft, setZoneDraft] = useState<ZoneName | '' | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  // Anonimização LGPD (somente ADMIN)
  const [confirmAnonymize, setConfirmAnonymize] = useState(false);
  const [anonymizing, setAnonymizing] = useState(false);

  if (!interestId) return null;

  const invalidateCapture = () => {
    void queryClient.invalidateQueries({ queryKey: ['donor-interests'] });
    void queryClient.invalidateQueries({ queryKey: ['donor-interests-summary'] });
    void queryClient.invalidateQueries({ queryKey: ['donor-interest-detail', interestId] });
  };

  const handleLogContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interest) return;
    setSavingContact(true);
    try {
      await logInterestContact(interest.id, {
        channel: contactChannel,
        outcome: contactOutcome,
        notes: contactNotes.trim(),
      });
      setContactNotes('');
      invalidateCapture();
      addToast({
        type: 'success',
        title: 'Contato registrado',
        description: `Tentativa via ${CONTACT_CHANNEL_LABELS[contactChannel]} salva no histórico.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao registrar contato',
        description: err instanceof ApiError ? err.message : 'Tente novamente em instantes.',
      });
    } finally {
      setSavingContact(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interest || !nextStatus) return;
    setSavingStatus(true);
    try {
      await updateInterestStatus(interest.id, {
        status: nextStatus,
        closureReason:
          nextStatus === 'NAO_PROSSEGUIU' || nextStatus === 'ENCERRADA'
            ? closureReason.trim()
            : undefined,
      });
      setNextStatus('');
      setClosureReason('');
      invalidateCapture();
      addToast({
        type: 'success',
        title: 'Andamento atualizado',
        description: `Solicitação atualizada para "${INTEREST_STATUS_META[nextStatus].label}".`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar status',
        description: err instanceof ApiError ? err.message : 'Verifique os dados e tente novamente.',
      });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!interest) return;
    setSavingNotes(true);
    try {
      await updateInterestNotes(interest.id, {
        adminNotes: notesDraft !== null ? notesDraft : interest.adminNotes || '',
        suggestedZone:
          zoneDraft !== null ? (zoneDraft || null) : interest.suggestedZone || null,
      });
      setNotesDraft(null);
      setZoneDraft(null);
      invalidateCapture();
      addToast({
        type: 'info',
        title: 'Observações salvas',
        description: 'Anotações administrativas atualizadas na solicitação.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar observações',
        description: err instanceof ApiError ? err.message : 'Tente novamente.',
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAnonymize = async () => {
    if (!interest) return;
    setAnonymizing(true);
    try {
      await anonymizeInterest(interest.id);
      setConfirmAnonymize(false);
      invalidateCapture();
      addToast({
        type: 'warning',
        title: 'Dados anonimizados (LGPD)',
        description: `Os dados pessoais do protocolo ${interest.protocol} foram anonimizados.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao anonimizar',
        description: err instanceof ApiError ? err.message : 'Tente novamente.',
      });
    } finally {
      setAnonymizing(false);
    }
  };

  const isConverted = Boolean(interest?.convertedDonorId || interest?.status === 'ENCAMINHADA_CADASTRO');
  const isAnonymized = Boolean(interest?.anonymizedAt);
  const statusMeta = interest ? INTEREST_STATUS_META[interest.status] : null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={interest ? `Solicitação ${interest.protocol} — ${interest.fullName}` : 'Carregando solicitação...'}
      subtitle={
        interest
          ? `Recebida em ${formatDateTime(interest.createdAt)} · Origem: ${DISCOVERY_CHANNEL_LABELS[interest.discoveryChannel]}`
          : undefined
      }
      maxWidth="2xl"
    >
      {detailQuery.isLoading || !interest ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-blh-slate-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-blh-primary" />
          <span>Carregando dados da interessada e histórico...</span>
        </div>
      ) : (
        <div className="space-y-5 text-xs">
          {/* Faixa de Status e Ações Rápidas */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-blh-slate-50 border border-blh-line">
            <div className="flex items-center gap-2 flex-wrap">
              {statusMeta && (
                <Badge variant={statusMeta.badgeVariant} dot>
                  {statusMeta.label}
                </Badge>
              )}
              <Badge variant="neutral">
                {interest.contactAttemptsCount}{' '}
                {interest.contactAttemptsCount === 1 ? 'tentativa' : 'tentativas'}
              </Badge>
              {interest.suggestedZone && <Badge variant="zone">Zona {interest.suggestedZone}</Badge>}
              {isAnonymized && <Badge variant="danger">Anonimizada (LGPD)</Badge>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!isAnonymized && (
                <>
                  <a
                    href={buildInterestWhatsAppUrl(interest)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 hover:bg-emerald-200 font-bold border border-emerald-300 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${interest.phoneNormalized}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-blh-slate-800 hover:bg-blh-slate-100 font-semibold border border-blh-line transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Ligar
                  </a>
                </>
              )}
              {!isConverted && !isAnonymized && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onStartConversion(interest);
                  }}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  className="font-bold shadow-sm"
                >
                  Iniciar Cadastro Oficial &amp; Triagem
                </Button>
              )}
            </div>
          </div>

          {/* Banner de Conversão Concluída */}
          {isConverted && interest.convertedDonor && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  Convertida em Doadora Oficial: {interest.convertedDonor.code} —{' '}
                  {interest.convertedDonor.nome}
                </p>
                <p className="text-[11px] text-emerald-800">
                  Aptidão atual: <strong>{interest.convertedDonor.aptidao}</strong> · Convertida em{' '}
                  {formatDateTime(interest.convertedAt)} por{' '}
                  <strong>{interest.convertedBy?.name || 'Equipe BLH'}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Alerta de Possível Duplicidade */}
          {!isConverted && duplicates.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">
                    Possível cadastro existente detectado ({duplicates.length})
                  </strong>
                  <p className="text-[11px] text-amber-800">
                    Antes de converter em nova doadora, confira se esta interessada já possui
                    prontuário no BLH:
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 pl-6">
                {duplicates.map((dup) => (
                  <div
                    key={dup.donorId}
                    className="flex flex-wrap items-center justify-between gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200"
                  >
                    <span>
                      <strong className="font-mono">{dup.code}</strong> · {dup.nome} (Zona {dup.zona})
                    </span>
                    <span className="text-[11px] text-amber-900 font-semibold">
                      Coincidência: {dup.matchReason.replace(/_/g, ' ')} · {dup.aptidao} ({dup.statusCadastro})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dados da Interessada + Informações Preliminares */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-blh-line bg-white space-y-2">
              <h4 className="font-bold text-blh-slate-900 uppercase tracking-wider text-[11px] border-b border-blh-line pb-1.5">
                Contato &amp; Localização
              </h4>
              <div className="flex justify-between gap-2">
                <span className="text-blh-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Celular:
                </span>
                <strong className="font-mono text-blh-slate-900">{interest.phone}</strong>
              </div>
              {!interest.isWhatsappSame && interest.whatsapp && (
                <div className="flex justify-between gap-2">
                  <span className="text-blh-slate-500">WhatsApp:</span>
                  <strong className="font-mono text-blh-slate-900">{interest.whatsapp}</strong>
                </div>
              )}
              {interest.email && (
                <div className="flex justify-between gap-2">
                  <span className="text-blh-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-mail:
                  </span>
                  <strong className="text-blh-slate-900 truncate">{interest.email}</strong>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-blh-slate-500">Preferência:</span>
                <strong className="text-blh-slate-900">
                  {PREFERRED_CONTACT_LABELS[interest.preferredContact]}
                </strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-blh-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Melhor horário:
                </span>
                <strong className="text-blh-slate-900">
                  {BEST_TIME_LABELS[interest.bestContactTime]}
                </strong>
              </div>
              <div className="pt-1.5 border-t border-blh-line/60 flex items-start gap-1.5 text-blh-slate-700">
                <MapPin className="w-3.5 h-3.5 text-blh-primary shrink-0 mt-0.5" />
                <span>
                  {interest.neighborhood} — {interest.city}
                  {interest.cep ? ` · CEP ${interest.cep}` : ''}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-blh-line bg-white space-y-2">
              <h4 className="font-bold text-blh-slate-900 uppercase tracking-wider text-[11px] border-b border-blh-line pb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blh-primary" />
                Perfil Preliminar &amp; LGPD
              </h4>
              <div className="flex justify-between gap-2">
                <span className="text-blh-slate-500">Nascimento:</span>
                <strong className="text-blh-slate-900">{interest.birthDate || 'Não informado'}</strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-blh-slate-500">Já doou antes?</span>
                <strong className="text-blh-slate-900">
                  {interest.donatedBefore ? 'Sim' : 'Não'}
                </strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-blh-slate-500">Conhece o processo?</span>
                <strong className="text-blh-slate-900">
                  {KNOWS_PROCESS_LABELS[interest.knowsProcess]}
                </strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-blh-slate-500">Como conheceu:</span>
                <strong className="text-blh-slate-900">
                  {DISCOVERY_CHANNEL_LABELS[interest.discoveryChannel]}
                </strong>
              </div>
              <div className="pt-1.5 border-t border-blh-line/60 flex items-start gap-1.5 text-[11px] text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  LGPD ({interest.consentVersion}) aceito em {formatDateTime(interest.consentAcceptedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Dúvida relatada */}
          {interest.questionsText && (
            <div className="p-3.5 rounded-xl bg-blh-primary-soft/50 border border-blh-primary/20 space-y-1">
              <strong className="text-[11px] uppercase tracking-wider text-blh-primary block">
                Dúvida enviada pela interessada
              </strong>
              <p className="text-blh-slate-800 leading-relaxed">{interest.questionsText}</p>
            </div>
          )}

          {/* Registro de Contato & Atualização de Status */}
          {!isConverted && !isAnonymized && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Registrar tentativa de contato */}
              <form
                onSubmit={handleLogContact}
                className="p-4 rounded-xl border border-blh-line bg-white space-y-3"
              >
                <h4 className="font-bold text-blh-slate-900 uppercase tracking-wider text-[11px] border-b border-blh-line pb-1.5 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blh-primary" />
                  Registrar Tentativa de Contato
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={contactChannel}
                    onChange={(e) => setContactChannel(e.target.value as ContactChannel)}
                    className="text-xs px-2.5 py-2 rounded-lg border border-blh-slate-300 bg-white"
                  >
                    {(Object.keys(CONTACT_CHANNEL_LABELS) as ContactChannel[]).map((k) => (
                      <option key={k} value={k}>
                        {CONTACT_CHANNEL_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={contactOutcome}
                    onChange={(e) => setContactOutcome(e.target.value as ContactOutcome)}
                    className="text-xs px-2.5 py-2 rounded-lg border border-blh-slate-300 bg-white"
                  >
                    {(Object.keys(CONTACT_OUTCOME_LABELS) as ContactOutcome[]).map((k) => (
                      <option key={k} value={k}>
                        {CONTACT_OUTCOME_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Resumo do contato ou horário combinado..."
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-blh-primary/30"
                />
                <Button type="submit" size="sm" isLoading={savingContact} className="w-full font-bold">
                  Salvar Tentativa
                </Button>
              </form>

              {/* Atualizar Status */}
              <form
                onSubmit={handleUpdateStatus}
                className="p-4 rounded-xl border border-blh-line bg-white space-y-3"
              >
                <h4 className="font-bold text-blh-slate-900 uppercase tracking-wider text-[11px] border-b border-blh-line pb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blh-primary" />
                  Atualizar Andamento
                </h4>
                <select
                  value={nextStatus}
                  onChange={(e) =>
                    setNextStatus(
                      e.target.value as Exclude<DonorInterestStatus, 'ENCAMINHADA_CADASTRO'> | ''
                    )
                  }
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-blh-slate-300 bg-white"
                >
                  <option value="">Selecionar novo status...</option>
                  {MANUAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {INTEREST_STATUS_META[s].label}
                    </option>
                  ))}
                </select>

                {(nextStatus === 'NAO_PROSSEGUIU' || nextStatus === 'ENCERRADA') && (
                  <input
                    type="text"
                    required
                    placeholder="Motivo obrigatório do encerramento..."
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30"
                  />
                )}

                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={!nextStatus}
                  isLoading={savingStatus}
                  className="w-full font-bold"
                >
                  Atualizar Status
                </Button>
              </form>
            </div>
          )}

          {/* Observações Administrativas & Zona Sugerida */}
          {!isAnonymized && (
            <div className="p-4 rounded-xl border border-blh-line bg-white space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-blh-slate-900 uppercase tracking-wider text-[11px]">
                  Observações Administrativas &amp; Zona Estimada
                </h4>
                <select
                  value={zoneDraft !== null ? zoneDraft : interest.suggestedZone || ''}
                  onChange={(e) => setZoneDraft(e.target.value as ZoneName | '')}
                  className="text-xs px-2.5 py-1 rounded-lg border border-blh-slate-300 bg-white"
                >
                  <option value="">Zona não definida</option>
                  <option value="Norte">Zona Norte</option>
                  <option value="Sul">Zona Sul</option>
                  <option value="Oeste">Zona Oeste</option>
                  <option value="Leste">Zona Leste</option>
                  <option value="Rural">Zona Rural</option>
                </select>
              </div>
              <textarea
                rows={2}
                maxLength={1000}
                placeholder="Anote detalhes relevantes para o acompanhamento da equipe..."
                value={notesDraft !== null ? notesDraft : interest.adminNotes || ''}
                onChange={(e) => setNotesDraft(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-blh-primary/30"
              />
              <div className="flex items-center justify-between gap-2">
                {hasRole('ADMIN') && !confirmAnonymize && (
                  <button
                    type="button"
                    onClick={() => setConfirmAnonymize(true)}
                    className="text-[11px] text-rose-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Anonimizar dados (LGPD)
                  </button>
                )}
                {hasRole('ADMIN') && confirmAnonymize && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-rose-800 font-semibold">
                      Confirmar anonimização irreversível?
                    </span>
                    <Button
                      size="sm"
                      variant="danger"
                      isLoading={anonymizing}
                      onClick={handleAnonymize}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAnonymize(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={savingNotes}
                  onClick={handleSaveNotes}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                  className="ml-auto"
                >
                  Salvar Observações
                </Button>
              </div>
            </div>
          )}

          {/* Timeline de Histórico */}
          <div className="p-4 rounded-xl border border-blh-line bg-white space-y-3">
            <h4 className="font-bold text-blh-slate-900 uppercase tracking-wider text-[11px] border-b border-blh-line pb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blh-primary" />
              Histórico de Atendimento ({interest.events?.length ?? 0})
            </h4>
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {(interest.events ?? []).map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-lg bg-blh-slate-50 border border-blh-line/70 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <strong className="text-blh-slate-900">
                      {ev.eventType === 'CREATED'
                        ? 'Solicitação recebida'
                        : ev.eventType === 'CONTACT_ATTEMPT'
                        ? `Tentativa via ${ev.channel ? CONTACT_CHANNEL_LABELS[ev.channel] : 'Contato'} (${ev.outcome ? CONTACT_OUTCOME_LABELS[ev.outcome] : ''})`
                        : ev.eventType === 'STATUS_CHANGED'
                        ? `Status alterado para ${ev.toStatus ? INTEREST_STATUS_META[ev.toStatus as DonorInterestStatus]?.label || ev.toStatus : ''}`
                        : ev.eventType === 'CONVERTED'
                        ? 'Convertida em cadastro oficial'
                        : ev.eventType === 'ANONYMIZED'
                        ? 'Dados anonimizados (LGPD)'
                        : 'Observação registrada'}
                    </strong>
                    <span className="text-blh-slate-500 font-mono">
                      {formatDateTime(ev.createdAt)}
                    </span>
                  </div>
                  {ev.notes && <p className="text-blh-slate-700 leading-snug">{ev.notes}</p>}
                  {ev.user?.name && (
                    <p className="text-[10px] text-blh-slate-500">Por: {ev.user.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
