import React, { useRef, useState } from 'react';
import {
  Heart,
  Loader2,
  AlertCircle,
  ShieldCheck,
  User,
  Phone,
  HelpCircle,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { ApiError } from '../../services/apiClient';
import {
  formatCepInput,
  formatPhoneInput,
  submitPublicDonorInterest,
  validatePublicInterestForm,
} from '../../services/donorInterestService';
import { ZoneName } from '../../types/donor';
import {
  BEST_TIME_LABELS,
  BestContactTime,
  DISCOVERY_CHANNEL_LABELS,
  DiscoveryChannel,
  DonorInterestPublicPayload,
  DonorInterestPublicResponse,
  KNOWS_PROCESS_LABELS,
  KnowsProcess,
  PREFERRED_CONTACT_LABELS,
  PreferredContact,
} from '../../types/donorInterest';

interface DonorInterestFormProps {
  onSuccess: (response: DonorInterestPublicResponse, submitted: DonorInterestPublicPayload) => void;
}

interface DemoDonorPreset {
  fullName: string;
  birthDate: string;
  city: string;
  neighborhood: string;
  cep: string;
  suggestedZone: ZoneName;
  phone: string;
  email: string;
  preferredContact: PreferredContact;
  bestContactTime: BestContactTime;
  donatedBefore: boolean;
  knowsProcess: KnowsProcess;
  discoveryChannel: DiscoveryChannel;
  questionsText: string;
}

const DEMO_DONOR_PRESETS: DemoDonorPreset[] = [
  {
    fullName: 'Camila Ferreira Almeida',
    birthDate: '1996-04-18',
    city: 'Marília',
    neighborhood: 'Jardim Esmeralda',
    cep: '17516-000',
    suggestedZone: 'Leste',
    phone: '(14) 99612-3401',
    email: 'camila.demo@exemplo.com',
    preferredContact: 'WHATSAPP',
    bestContactTime: 'MANHA',
    donatedBefore: false,
    knowsProcess: 'PARCIALMENTE',
    discoveryChannel: 'SITE',
    questionsText: 'Gostaria de saber em qual dia da semana a equipe entrega os frascos esterilizados na Zona Leste.',
  },
  {
    fullName: 'Juliana Mendes Costa',
    birthDate: '1993-09-25',
    city: 'Marília',
    neighborhood: 'Parque das Nações',
    cep: '17511-220',
    suggestedZone: 'Norte',
    phone: '(14) 99724-5802',
    email: 'juliana.demo@exemplo.com',
    preferredContact: 'WHATSAPP',
    bestContactTime: 'TARDE',
    donatedBefore: true,
    knowsProcess: 'SIM',
    discoveryChannel: 'MATERNIDADE_HOSPITAL',
    questionsText: 'Já doei na primeira gestação e tenho excedente para iniciar novas coletas semanais.',
  },
  {
    fullName: 'Beatriz Rocha Santana',
    birthDate: '1998-01-12',
    city: 'Marília',
    neighborhood: 'Jardim Califórnia',
    cep: '17527-140',
    suggestedZone: 'Sul',
    phone: '(14) 99835-7203',
    email: 'beatriz.demo@exemplo.com',
    preferredContact: 'LIGACAO',
    bestContactTime: 'COMERCIAL',
    donatedBefore: false,
    knowsProcess: 'NAO',
    discoveryChannel: 'UBS_POSTO_SAUDE',
    questionsText: 'Quais exames de pré-natal preciso separar para a triagem inicial?',
  },
  {
    fullName: 'Larissa Nogueira Lima',
    birthDate: '1995-11-04',
    city: 'Marília',
    neighborhood: 'Jardim Universitário',
    cep: '17525-090',
    suggestedZone: 'Oeste',
    phone: '(14) 99146-8304',
    email: 'larissa.demo@exemplo.com',
    preferredContact: 'WHATSAPP',
    bestContactTime: 'QUALQUER_HORARIO',
    donatedBefore: false,
    knowsProcess: 'PARCIALMENTE',
    discoveryChannel: 'REDES_SOCIAIS',
    questionsText: 'Posso guardar o leite no congelador comum por até quantos dias antes da coleta?',
  },
];

export const DonorInterestForm: React.FC<DonorInterestFormProps> = ({ onSuccess }) => {
  const formStartedAtRef = useRef<number>(Date.now());
  const demoIndexRef = useRef<number>(0);

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('Marília');
  const [neighborhood, setNeighborhood] = useState('');
  const [cep, setCep] = useState('');
  const [suggestedZone, setSuggestedZone] = useState<ZoneName | ''>('');

  const [phone, setPhone] = useState('');
  const [isWhatsappSame, setIsWhatsappSame] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContact, setPreferredContact] = useState<PreferredContact>('WHATSAPP');
  const [bestContactTime, setBestContactTime] = useState<BestContactTime>('QUALQUER_HORARIO');

  const [donatedBefore, setDonatedBefore] = useState(false);
  const [knowsProcess, setKnowsProcess] = useState<KnowsProcess>('NAO');
  const [hasQuestions, setHasQuestions] = useState(false);
  const [questionsText, setQuestionsText] = useState('');
  const [discoveryChannel, setDiscoveryChannel] = useState<DiscoveryChannel>('SITE');

  const [consentAccepted, setConsentAccepted] = useState(false);
  // Campo honeypot invisível (anti-spam)
  const [website, setWebsite] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const handleDemoQuickFill = () => {
    const preset = DEMO_DONOR_PRESETS[demoIndexRef.current % DEMO_DONOR_PRESETS.length];
    demoIndexRef.current += 1;

    setFullName(preset.fullName);
    setBirthDate(preset.birthDate);
    setCity(preset.city);
    setNeighborhood(preset.neighborhood);
    setCep(preset.cep);
    setSuggestedZone(preset.suggestedZone);
    setPhone(preset.phone);
    setIsWhatsappSame(true);
    setWhatsapp('');
    setEmail(preset.email);
    setPreferredContact(preset.preferredContact);
    setBestContactTime(preset.bestContactTime);
    setDonatedBefore(preset.donatedBefore);
    setKnowsProcess(preset.knowsProcess);
    setDiscoveryChannel(preset.discoveryChannel);
    setHasQuestions(true);
    setQuestionsText(preset.questionsText);
    setConsentAccepted(true);
    setFieldErrors({});
    setSubmitError(null);
    // Garante tempo mínimo de preenchimento para permitir envio imediato durante demonstrações ao vivo
    formStartedAtRef.current = Math.min(formStartedAtRef.current, Date.now() - 3500);
    setDemoNotice(`Dados demonstrativos preenchidos (${preset.fullName} — ${preset.neighborhood}).`);
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload: DonorInterestPublicPayload = {
      fullName: fullName.trim(),
      birthDate: birthDate || undefined,
      city: city.trim() || 'Marília',
      neighborhood: neighborhood.trim(),
      cep: cep.trim() || undefined,
      suggestedZone,
      phone: phone.trim(),
      isWhatsappSame,
      whatsapp: isWhatsappSame ? phone.trim() : whatsapp.trim() || undefined,
      email: email.trim() || undefined,
      preferredContact,
      bestContactTime,
      donatedBefore,
      knowsProcess,
      hasQuestions: hasQuestions || Boolean(questionsText.trim()),
      questionsText: questionsText.trim() || undefined,
      discoveryChannel,
      sourceOrigin: 'SITE_INSTITUCIONAL',
      consentAccepted,
      website,
      elapsedMs: Date.now() - formStartedAtRef.current,
    };

    const errors = validatePublicInterestForm(payload);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Verifique os campos destacados antes de enviar sua solicitação.');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const response = await submitPublicDonorInterest(payload);
      onSuccess(response, payload);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setSubmitError(
            'Recebemos muitas solicitações deste dispositivo recentemente. Aguarde alguns minutos e tente novamente.'
          );
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError(
          'Não foi possível conectar ao servidor do LEITFLOW no momento. Verifique sua conexão e tente novamente.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    'w-full px-4 py-3 rounded-xl border bg-[#FAF9F6] text-sm text-[#1E242B] placeholder:text-[#8C8275]/70 focus:outline-none focus:ring-2 focus:ring-[#4A6B5D]/20 transition-all disabled:opacity-60';
  const inputBorder = (field: string) =>
    fieldErrors[field]
      ? 'border-red-400 focus:border-red-500'
      : 'border-[#EFECE6] focus:border-[#4A6B5D]';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Honeypot invisível para bloqueio de bots */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="interest-website">Não preencha este campo</label>
        <input
          id="interest-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {submitError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Barra discreta de Preenchimento Rápido (Modo Demonstrativo) */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-dashed border-[#4A6B5D]/35 bg-[#EBF1EE]/55 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 text-xs text-[#1E242B]/85">
          <Sparkles className="w-4 h-4 text-[#4A6B5D] shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-semibold text-[#1E242B]">Modo demonstrativo</span>
            <p className="text-[11px] text-[#6B737D]">
              {demoNotice ?? 'Preencha o formulário automaticamente com dados fictícios para testar o fluxo.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={submitting}
          onClick={handleDemoQuickFill}
          className="shrink-0 px-3.5 py-2 rounded-xl bg-white text-[#3B594C] font-semibold text-xs border border-[#4A6B5D]/30 hover:bg-[#4A6B5D] hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Preenchimento rápido (Demo)</span>
        </button>
      </div>

      {/* BLOCO 1 — DADOS PESSOAIS & REGIÃO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#EFECE6]">
          <div className="w-8 h-8 rounded-xl bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1E242B]">
              1. Sobre você e sua região
            </h2>
            <p className="text-xs text-[#8C8275]">
              Solicitamos apenas o essencial para localizar sua região de atendimento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="interest-fullname" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
              Nome completo *
            </label>
            <input
              id="interest-fullname"
              type="text"
              required
              autoComplete="name"
              disabled={submitting}
              placeholder="Ex: Maria Oliveira Santos"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError('fullName');
              }}
              className={`${inputBase} ${inputBorder('fullName')}`}
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="interest-birthdate" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
              Data de nascimento <span className="text-[#8C8275] font-normal">(opcional)</span>
            </label>
            <input
              id="interest-birthdate"
              type="date"
              disabled={submitting}
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                clearFieldError('birthDate');
              }}
              className={`${inputBase} ${inputBorder('birthDate')}`}
            />
            {fieldErrors.birthDate && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.birthDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="interest-city" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
              Cidade *
            </label>
            <input
              id="interest-city"
              type="text"
              required
              disabled={submitting}
              placeholder="Marília"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                clearFieldError('city');
              }}
              className={`${inputBase} ${inputBorder('city')}`}
            />
            {fieldErrors.city && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="interest-neighborhood" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
              Bairro *
            </label>
            <input
              id="interest-neighborhood"
              type="text"
              required
              disabled={submitting}
              placeholder="Ex: Jardim Esmeralda, Palmital..."
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                clearFieldError('neighborhood');
              }}
              className={`${inputBase} ${inputBorder('neighborhood')}`}
            />
            {fieldErrors.neighborhood && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.neighborhood}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="interest-cep" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
                CEP <span className="text-[#8C8275] font-normal">(opcional)</span>
              </label>
              <input
                id="interest-cep"
                type="text"
                inputMode="numeric"
                maxLength={9}
                disabled={submitting}
                placeholder="17500-000"
                value={cep}
                onChange={(e) => {
                  setCep(formatCepInput(e.target.value));
                  clearFieldError('cep');
                }}
                className={`${inputBase} ${inputBorder('cep')}`}
              />
              {fieldErrors.cep && <p className="mt-1 text-xs text-red-600">{fieldErrors.cep}</p>}
            </div>

            <div>
              <label htmlFor="interest-zone" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
                Zona <span className="text-[#8C8275] font-normal">(opcional)</span>
              </label>
              <select
                id="interest-zone"
                disabled={submitting}
                value={suggestedZone}
                onChange={(e) => setSuggestedZone(e.target.value as ZoneName | '')}
                className={`${inputBase} border-[#EFECE6] focus:border-[#4A6B5D]`}
              >
                <option value="">Não sei informar</option>
                <option value="Norte">Zona Norte</option>
                <option value="Sul">Zona Sul</option>
                <option value="Oeste">Zona Oeste</option>
                <option value="Leste">Zona Leste</option>
                <option value="Rural">Zona Rural / Distritos</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 2 — CONTATO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#EFECE6]">
          <div className="w-8 h-8 rounded-xl bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1E242B]">
              2. Informações de contato
            </h2>
            <p className="text-xs text-[#8C8275]">
              Escolha o canal e o período mais confortáveis para a equipe falar com você.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="interest-phone" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
              Telefone celular com DDD *
            </label>
            <input
              id="interest-phone"
              type="tel"
              required
              autoComplete="tel"
              maxLength={15}
              disabled={submitting}
              placeholder="(14) 99999-9999"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhoneInput(e.target.value));
                clearFieldError('phone');
              }}
              className={`${inputBase} ${inputBorder('phone')}`}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
            )}
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-[#1E242B]/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isWhatsappSame}
                disabled={submitting}
                onChange={(e) => setIsWhatsappSame(e.target.checked)}
                className="rounded border-[#8C8275] text-[#4A6B5D] focus:ring-[#4A6B5D]"
              />
              <span>Este número também é meu WhatsApp</span>
            </label>
          </div>

          {!isWhatsappSame ? (
            <div>
              <label htmlFor="interest-whatsapp" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
                Número de WhatsApp <span className="text-[#8C8275] font-normal">(se diferente)</span>
              </label>
              <input
                id="interest-whatsapp"
                type="tel"
                maxLength={15}
                disabled={submitting}
                placeholder="(14) 99999-9999"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(formatPhoneInput(e.target.value));
                  clearFieldError('whatsapp');
                }}
                className={`${inputBase} ${inputBorder('whatsapp')}`}
              />
              {fieldErrors.whatsapp && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.whatsapp}</p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="interest-email" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
                E-mail <span className="text-[#8C8275] font-normal">(opcional)</span>
              </label>
              <input
                id="interest-email"
                type="email"
                autoComplete="email"
                disabled={submitting}
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                className={`${inputBase} ${inputBorder('email')}`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>
          )}

          {!isWhatsappSame && (
            <div className="sm:col-span-2">
              <label htmlFor="interest-email-alt" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
                E-mail <span className="text-[#8C8275] font-normal">(opcional)</span>
              </label>
              <input
                id="interest-email-alt"
                type="email"
                autoComplete="email"
                disabled={submitting}
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                className={`${inputBase} ${inputBorder('email')}`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="interest-preferred-contact" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
              Preferência de contato *
            </label>
            <select
              id="interest-preferred-contact"
              disabled={submitting}
              value={preferredContact}
              onChange={(e) => {
                setPreferredContact(e.target.value as PreferredContact);
                clearFieldError('email');
              }}
              className={`${inputBase} border-[#EFECE6] focus:border-[#4A6B5D]`}
            >
              {(Object.keys(PREFERRED_CONTACT_LABELS) as PreferredContact[]).map((key) => (
                <option key={key} value={key}>
                  {PREFERRED_CONTACT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="interest-best-time" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
              Melhor horário para contato *
            </label>
            <select
              id="interest-best-time"
              disabled={submitting}
              value={bestContactTime}
              onChange={(e) => setBestContactTime(e.target.value as BestContactTime)}
              className={`${inputBase} border-[#EFECE6] focus:border-[#4A6B5D]`}
            >
              {(Object.keys(BEST_TIME_LABELS) as BestContactTime[]).map((key) => (
                <option key={key} value={key}>
                  {BEST_TIME_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* BLOCO 3 — INFORMAÇÕES PRELIMINARES */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#EFECE6]">
          <div className="w-8 h-8 rounded-xl bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1E242B]">
              3. Informações preliminares
            </h2>
            <p className="text-xs text-[#8C8275]">
              Ajuda nossa equipe a preparar um acolhimento ainda melhor. Nenhum dado clínico é solicitado aqui.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-semibold text-[#1E242B] mb-2">
              Já realizou doação de leite humano anteriormente?
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Sim', value: true },
                { label: 'Não', value: false },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  disabled={submitting}
                  onClick={() => setDonatedBefore(opt.value)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    donatedBefore === opt.value
                      ? 'bg-[#EBF1EE] border-[#4A6B5D] text-[#4A6B5D]'
                      : 'bg-[#FAF9F6] border-[#EFECE6] text-[#1E242B]/80 hover:border-[#4A6B5D]/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="interest-knows" className="block text-xs font-semibold text-[#1E242B] mb-2">
              Conhece como funciona a doação de leite humano?
            </label>
            <select
              id="interest-knows"
              disabled={submitting}
              value={knowsProcess}
              onChange={(e) => setKnowsProcess(e.target.value as KnowsProcess)}
              className={`${inputBase} border-[#EFECE6] focus:border-[#4A6B5D]`}
            >
              {(Object.keys(KNOWS_PROCESS_LABELS) as KnowsProcess[]).map((key) => (
                <option key={key} value={key}>
                  {KNOWS_PROCESS_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="interest-discovery" className="block text-xs font-semibold text-[#1E242B] mb-1.5">
              Como conheceu o Banco de Leite Humano de Marília?
            </label>
            <select
              id="interest-discovery"
              disabled={submitting}
              value={discoveryChannel}
              onChange={(e) => setDiscoveryChannel(e.target.value as DiscoveryChannel)}
              className={`${inputBase} border-[#EFECE6] focus:border-[#4A6B5D]`}
            >
              {(Object.keys(DISCOVERY_CHANNEL_LABELS) as DiscoveryChannel[]).map((key) => (
                <option key={key} value={key}>
                  {DISCOVERY_CHANNEL_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E242B] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasQuestions}
                disabled={submitting}
                onChange={(e) => {
                  setHasQuestions(e.target.checked);
                  if (!e.target.checked) setQuestionsText('');
                }}
                className="rounded border-[#8C8275] text-[#4A6B5D] focus:ring-[#4A6B5D]"
              />
              <span>Possuo alguma dúvida sobre o processo de doação</span>
            </label>

            {hasQuestions && (
              <div>
                <textarea
                  id="interest-questions"
                  rows={3}
                  maxLength={500}
                  disabled={submitting}
                  placeholder="Escreva aqui sua dúvida (ex.: armazenamento, entrega de frascos, horários de coleta)..."
                  value={questionsText}
                  onChange={(e) => {
                    setQuestionsText(e.target.value);
                    clearFieldError('questionsText');
                  }}
                  className={`${inputBase} ${inputBorder('questionsText')} resize-none`}
                />
                <div className="mt-1 flex justify-between text-[11px] text-[#8C8275]">
                  <span>Evite informar dados clínicos sensíveis neste campo.</span>
                  <span>{questionsText.length}/500</span>
                </div>
                {fieldErrors.questionsText && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.questionsText}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* BLOCO 4 — CONSENTIMENTO LGPD */}
      <section className="space-y-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#EBF1EE]/75 border border-[#4A6B5D]/20 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-[#1E242B]/85 leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-[#4A6B5D] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[#1E242B]">
                Aviso de Privacidade e Proteção de Dados (LGPD — Lei nº 13.709/2018)
              </p>
              <p className="text-[#1E242B]/75">
                Os dados informados neste formulário serão utilizados exclusivamente para que a
                equipe do <strong>Banco de Leite Humano de Marília</strong> entre em contato com
                você, esclareça dúvidas e conduza a avaliação inicial sobre a doação de leite
                humano. A triagem clínica e sorológica oficial é realizada apenas por profissionais
                de saúde autorizados. Você pode solicitar a exclusão dos seus dados a qualquer
                momento pelos canais oficiais do BLH.
              </p>
            </div>
          </div>

          <label
            htmlFor="interest-consent"
            className={`flex items-start gap-3 p-3 rounded-xl bg-white border cursor-pointer transition-colors ${
              fieldErrors.consentAccepted ? 'border-red-400' : 'border-[#EFECE6]'
            }`}
          >
            <input
              id="interest-consent"
              type="checkbox"
              checked={consentAccepted}
              disabled={submitting}
              onChange={(e) => {
                setConsentAccepted(e.target.checked);
                clearFieldError('consentAccepted');
              }}
              className="mt-0.5 rounded border-[#8C8275] text-[#4A6B5D] focus:ring-[#4A6B5D]"
            />
            <span className="text-xs text-[#1E242B] leading-relaxed">
              <strong>Concordo e autorizo</strong> o Banco de Leite Humano de Marília a utilizar
              meus dados de contato para retorno e avaliação inicial sobre doação de leite humano,
              ciente de que este envio não equivale à aprovação automática para doação. *
            </span>
          </label>
          {fieldErrors.consentAccepted && (
            <p className="text-xs text-red-600">{fieldErrors.consentAccepted}</p>
          )}
        </div>

        <div className="flex items-start gap-2 text-[11px] text-[#8C8275]">
          <Info className="w-4 h-4 text-[#4A6B5D] shrink-0 mt-0.5" />
          <span>
            Após o envio, você receberá um número de protocolo de acompanhamento gerado diretamente
            pelo sistema do BLH Marília.
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-[#4A6B5D] text-white font-semibold text-sm sm:text-base hover:bg-[#3d594d] transition-all shadow-lg shadow-[#4A6B5D]/25 flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enviando sua solicitação...</span>
            </>
          ) : (
            <>
              <Heart className="w-5 h-5 fill-white/25" />
              <span>Enviar interesse em ser doadora</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </section>
    </form>
  );
};
