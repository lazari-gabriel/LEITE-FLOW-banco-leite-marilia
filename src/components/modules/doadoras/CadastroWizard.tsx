import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Calendar,
  X,
  Save
} from 'lucide-react';
import { Donor, DonorFormData, GoNoGoVerdict } from '../../../types/donor';
import { useApp } from '../../../hooks/useApp';
import { Button } from '../../ui/Button';
import { calculateMilkClass, getMilkClassDescription, evaluateGoNoGo } from '../../../services/donorService';

interface CadastroWizardProps {
  onSubmitted: (result: { donor: Donor; verdict: GoNoGoVerdict }) => void;
  editingDonor?: Donor | null;
  onCancelEdit?: () => void;
}

const INITIAL_FORM_DATA: DonorFormData = {
  nome: '',
  bebe: '',
  sus: '',
  cpf: '',
  nascimento: '',
  parto: '',
  telefone: '',
  zona: 'Norte',
  endereco: '',
  vacinaFebre: true,
  vacinaDtpa: true,
  transfusao: 'Não',
  tatuagem: 'Não',
  fumo: 'nao',
  alcool: 'nao',
  medicacao: '',
  aguaPotavel: true,
  redeEsgoto: true,
  renda: 'De 1 a 3 salários mínimos',
  pesoBebe: '3200',
  apgar: '9/10',
  malformacao: 'nao',
  intercorrencias: {
    infeccao: false,
    hipertensao: false,
    diabetes: false,
    hepatite: false
  },
  equipamento: 'Duplex',
  extracao: 'Ordenha Manual',
  produtosJunto: false,
  soro1Data: new Date().toISOString().split('T')[0],
  soro1Res: 'normal',
  soro2Data: new Date().toISOString().split('T')[0],
  soro2Res: 'normal',
  soro3Data: new Date().toISOString().split('T')[0],
  soro3Res: 'normal',
  statusCadastro: 'ativa'
};

function donorToFormData(donor: Donor): DonorFormData {
  return {
    nome: donor.nome,
    bebe: donor.bebe,
    sus: donor.sus,
    cpf: donor.cpf,
    nascimento: donor.nascimento,
    parto: donor.parto,
    telefone: donor.telefone,
    zona: donor.zona,
    endereco: donor.endereco,
    vacinaFebre: donor.vacinaFebre,
    vacinaDtpa: donor.vacinaDtpa,
    transfusao: donor.transfusao,
    tatuagem: donor.tatuagem,
    fumo: donor.fumo,
    alcool: donor.alcool,
    medicacao: donor.medicacao,
    aguaPotavel: donor.aguaPotavel,
    redeEsgoto: donor.redeEsgoto,
    renda: 'De 1 a 3 salários mínimos',
    pesoBebe: '',
    apgar: '',
    malformacao: 'nao',
    intercorrencias: {
      infeccao: false,
      hipertensao: false,
      diabetes: false,
      hepatite: false
    },
    equipamento: donor.equipamento,
    extracao: donor.extracao,
    produtosJunto: donor.produtosJunto,
    soro1Data: new Date().toISOString().split('T')[0],
    soro1Res: donor.sorologia1,
    soro2Data: new Date().toISOString().split('T')[0],
    soro2Res: donor.sorologia2,
    soro3Data: new Date().toISOString().split('T')[0],
    soro3Res: donor.sorologia3,
    statusCadastro: donor.statusCadastro || 'ativa'
  };
}

export const CadastroWizard: React.FC<CadastroWizardProps> = ({ onSubmitted, editingDonor, onCancelEdit }) => {
  const { addDonor, updateDonor, cancelEditDonor } = useApp();
  const handleCancel = onCancelEdit || cancelEditDonor;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<DonorFormData>(INITIAL_FORM_DATA);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const steps = [
    { num: 1, label: 'Identificação' },
    { num: 2, label: 'Vacinas & Hábitos' },
    { num: 3, label: 'Socioeconômico' },
    { num: 4, label: 'Cadeia de Frio' },
    { num: 5, label: 'Sorologia (Regra de Ouro)' }
  ];

  // Load donor data when editing
  useEffect(() => {
    if (editingDonor) {
      setFormData(donorToFormData(editingDonor));
      setIsEditing(true);
      setStep(1);
      setErrorMsg(null);
    } else {
      setFormData(INITIAL_FORM_DATA);
      setIsEditing(false);
      setStep(1);
      setErrorMsg(null);
    }
  }, [editingDonor]);

  const handleInputChange = (field: keyof DonorFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg(null);
  };

  const handleIntercorrenciaChange = (key: keyof DonorFormData['intercorrencias']) => {
    setFormData((prev) => ({
      ...prev,
      intercorrencias: {
        ...prev.intercorrencias,
        [key]: !prev.intercorrencias[key]
      }
    }));
  };

  const preencherExemplo = () => {
    const dParto = new Date();
    dParto.setDate(dParto.getDate() - 12); // Bebê com ~12 dias -> Transição
    const hoje = new Date().toISOString().split('T')[0];

    setFormData({
      nome: 'Renata Silveira Prado',
      bebe: 'Gabriel Silveira',
      sus: '898 0033 7788 9900',
      cpf: '365.112.449-80',
      nascimento: '1997-06-20',
      parto: dParto.toISOString().split('T')[0],
      telefone: '(14) 99844-3321',
      zona: 'Oeste',
      endereco: 'Rua Nelson Spielmann, 940 — Alto Cafezal, Marília - SP',
      vacinaFebre: true,
      vacinaDtpa: true,
      transfusao: 'Não',
      tatuagem: 'Não',
      fumo: 'nao',
      alcool: 'nao',
      medicacao: 'Polivitamínico pós-parto e Sulfato Ferroso',
      aguaPotavel: true,
      redeEsgoto: true,
      renda: 'De 1 a 3 salários mínimos',
      pesoBebe: '3380',
      apgar: '9/10',
      malformacao: 'nao',
      intercorrencias: {
        infeccao: false,
        hipertensao: false,
        diabetes: false,
        hepatite: false
      },
      equipamento: 'Duplex',
      extracao: 'Ordenha Manual',
      produtosJunto: false,
      soro1Data: hoje,
      soro1Res: 'normal',
      soro2Data: hoje,
      soro2Res: 'normal',
      soro3Data: hoje,
      soro3Res: 'normal'
    });
    setErrorMsg(null);
  };

  const validateStep1 = () => {
    if (!formData.nome.trim()) return 'Informe o nome completo da doadora.';
    if (!formData.bebe.trim()) return 'Informe o nome do recém-nascido.';
    if (!formData.sus.trim()) return 'Informe o número do Cartão SUS.';
    if (!formData.parto) return 'Informe a data do parto para classificação biológica do leite.';
    if (!formData.telefone.trim()) return 'Informe o telefone/WhatsApp para contato na rota.';
    if (!formData.endereco.trim()) return 'Informe o endereço residencial em Marília.';
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setErrorMsg(err);
        return;
      }
    }

    if (step < 5) {
      setStep(step + 1);
      setErrorMsg(null);
    } else {
      // Submissão do cadastro ou atualização
      if (isEditing && editingDonor) {
        updateDonor(editingDonor.id, formData);
        const verdict = evaluateGoNoGo(formData);
        onSubmitted({ donor: editingDonor, verdict });
      } else {
        const result = addDonor(formData);
        onSubmitted(result);
      }
      setFormData(INITIAL_FORM_DATA);
      setStep(1);
      setIsEditing(false);
    }
  };

  const handleSaveImmediately = () => {
    if (!isEditing || !editingDonor) return;
    const err = validateStep1();
    if (err) {
      setStep(1);
      setErrorMsg(err);
      return;
    }
    updateDonor(editingDonor.id, formData);
    const verdict = evaluateGoNoGo(formData);
    onSubmitted({ donor: editingDonor, verdict });
    setFormData(INITIAL_FORM_DATA);
    setStep(1);
    setIsEditing(false);
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrorMsg(null);
    }
  };

  // Preview de classificação biológica pelo parto
  const classePrevista = calculateMilkClass(formData.parto);
  const classeDesc = getMilkClassDescription(classePrevista);

  return (
    <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-7 shadow-card transition-all duration-200">
      {/* Header com Stepper */}
      <div className="border-b border-blh-line pb-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-sans font-bold text-blh-slate-900">
              {isEditing
                ? 'Formulário de Atualização Cadastral'
                : 'Formulário de Triagem Médica & Sanitária'}
            </h2>
            <p className="text-xs text-blh-slate-600 mt-0.5">
              Etapa {step} de 5 — {steps[step - 1].label}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                {handleCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    leftIcon={<X className="w-4 h-4" />}
                    className="text-blh-slate-600 hover:text-blh-slate-900"
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveImmediately}
                  leftIcon={<Save className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Salvar Alterações
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={preencherExemplo}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-blh-amber" />}
              >
                Preencher Exemplo
              </Button>
            )}
          </div>
        </div>

        {/* Stepper Visual */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const isActive = s.num === step;
            const isDone = s.num < step;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num <= step || !validateStep1()) {
                    setStep(s.num);
                  }
                }}
                className={`text-left pb-2 border-b-2 transition-all flex flex-col gap-1 ${
                  isActive
                    ? 'border-blh-primary text-blh-primary font-bold'
                    : isDone
                    ? 'border-emerald-500 text-emerald-700'
                    : 'border-blh-slate-200 text-blh-slate-400 hover:text-blh-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                      isActive
                        ? 'bg-blh-primary text-white'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-blh-slate-200 text-blh-slate-600'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                  </span>
                  <span className="hidden md:inline truncate">{s.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulário por Etapas */}
      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        {/* ETAPA 1: IDENTIFICAÇÃO */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Nome Completo da Mãe *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Juliana Mendes Rodrigues"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Nome do Bebê *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arthur Mendes Rodrigues"
                  value={formData.bebe}
                  onChange={(e) => handleInputChange('bebe', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Cartão Nacional de Saúde (SUS) * <span className="text-blh-slate-400 font-normal">15 dígitos</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="898 0012 3456 7890"
                  value={formData.sus}
                  onChange={(e) => handleInputChange('sus', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  CPF / RG
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Data de Nascimento da Doadora
                </label>
                <input
                  type="date"
                  value={formData.nascimento}
                  onChange={(e) => handleInputChange('nascimento', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Data do Parto * <span className="text-blh-slate-400 font-normal">Classificação biológica</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.parto}
                  onChange={(e) => handleInputChange('parto', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(14) 99876-5432"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Zona Logística de Marília *
                </label>
                <select
                  value={formData.zona}
                  onChange={(e) => handleInputChange('zona', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary bg-white"
                >
                  <option value="Norte">Zona Norte — Coleta às Segundas-feiras</option>
                  <option value="Sul">Zona Sul — Coleta às Terças-feiras</option>
                  <option value="Oeste">Zona Oeste — Coleta às Quartas-feiras</option>
                  <option value="Leste">Zona Leste — Coleta às Quintas-feiras</option>
                  <option value="Rural">Zona Rural e Maracá — Coleta às Sextas-feiras</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Classificação Biológica Prevista
                </label>
                <div className="px-3 py-2 rounded-md bg-blh-primary-soft/60 border border-blh-line-strong text-xs font-semibold text-blh-primary flex items-center justify-between">
                  <span>{classeDesc.name}</span>
                  <span className="text-[11px] text-blh-slate-500 font-normal">{classeDesc.phase}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                Endereço Completo em Marília *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Rua Tomé de Souza, 245 — Bairro Palmital, Marília - SP"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
              />
            </div>
          </div>
        )}

        {/* ETAPA 2: VACINAS & HÁBITOS */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-blh-slate-700 mb-2">
                Imunizações da Puérpera
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 p-3.5 rounded-lg border border-blh-line bg-blh-slate-50/50 cursor-pointer hover:border-blh-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.vacinaFebre}
                    onChange={(e) => handleInputChange('vacinaFebre', e.target.checked)}
                    className="mt-0.5 rounded text-blh-primary focus:ring-blh-primary"
                  />
                  <div>
                    <strong className="block text-xs font-bold text-blh-slate-900">
                      Vacina Febre Amarela em dia
                    </strong>
                    <span className="text-[11px] text-blh-slate-500">
                      Comprovada na caderneta de vacinação
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-lg border border-blh-line bg-blh-slate-50/50 cursor-pointer hover:border-blh-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.vacinaDtpa}
                    onChange={(e) => handleInputChange('vacinaDtpa', e.target.checked)}
                    className="mt-0.5 rounded text-blh-primary focus:ring-blh-primary"
                  />
                  <div>
                    <strong className="block text-xs font-bold text-blh-slate-900">
                      Vacina DTPa (Tríplice Bacteriana)
                    </strong>
                    <span className="text-[11px] text-blh-slate-500">
                      Dose da gestação em dia
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Transfusão de Sangue <span className="text-blh-slate-400 font-normal">Mês/Ano se houver</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Não, ou 05/2023"
                  value={formData.transfusao}
                  onChange={(e) => handleInputChange('transfusao', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Tatuagem / Piercing / Micropigmentação <span className="text-blh-slate-400 font-normal">Carência &lt; 12 meses</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Não, ou 11/2025"
                  value={formData.tatuagem}
                  onChange={(e) => handleInputChange('tatuagem', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Hábito Tabágico (Fuma?) *
                </label>
                <select
                  value={formData.fumo}
                  onChange={(e) => handleInputChange('fumo', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary bg-white"
                >
                  <option value="nao">Não fuma (Apta)</option>
                  <option value="sim_pouco">Fuma ocasionalmente (&lt; 5 cigarros/dia)</option>
                  <option value="sim_ativo">Fumante ativa regular (Inapta para doação)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Consumo de Álcool e Substâncias *
                </label>
                <select
                  value={formData.alcool}
                  onChange={(e) => handleInputChange('alcool', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary bg-white"
                >
                  <option value="nao">Não consome (Apta)</option>
                  <option value="raro">Consumo raro/social (Exige intervalo 12h)</option>
                  <option value="frequente">Consumo frequente de álcool ou substâncias (Inapta)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                Medicamentos de Uso Contínuo ou Restrito
              </label>
              <input
                type="text"
                placeholder="Ex: Sulfato ferroso pós-parto, vitaminas, antibióticos..."
                value={formData.medicacao}
                onChange={(e) => handleInputChange('medicacao', e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Regra Sanitária de Carência:</strong> Procedimentos de tatuagem, piercing ou transfusão sanguínea realizados há menos de 12 meses exigem suspensão temporária do ingresso na rota de coleta domiciliar.
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 3: SOCIOECONÔMICO & PRÉ-NATAL */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-blh-slate-700 mb-2">
                Saneamento Residencial Básico
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 p-3.5 rounded-lg border border-blh-line bg-blh-slate-50/50 cursor-pointer hover:border-blh-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.aguaPotavel}
                    onChange={(e) => handleInputChange('aguaPotavel', e.target.checked)}
                    className="mt-0.5 rounded text-blh-primary focus:ring-blh-primary"
                  />
                  <div>
                    <strong className="block text-xs font-bold text-blh-slate-900">
                      Água potável tratada encanada
                    </strong>
                    <span className="text-[11px] text-blh-slate-500">
                      Rede pública de abastecimento (DAEM Marília)
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-lg border border-blh-line bg-blh-slate-50/50 cursor-pointer hover:border-blh-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.redeEsgoto}
                    onChange={(e) => handleInputChange('redeEsgoto', e.target.checked)}
                    className="mt-0.5 rounded text-blh-primary focus:ring-blh-primary"
                  />
                  <div>
                    <strong className="block text-xs font-bold text-blh-slate-900">
                      Rede coletora de esgoto
                    </strong>
                    <span className="text-[11px] text-blh-slate-500">
                      Instalações hidrossanitárias adequadas
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Faixa de Renda Familiar
                </label>
                <select
                  value={formData.renda}
                  onChange={(e) => handleInputChange('renda', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary bg-white"
                >
                  <option>Até 1 salário mínimo</option>
                  <option>De 1 a 3 salários mínimos</option>
                  <option>De 3 a 5 salários mínimos</option>
                  <option>Acima de 5 salários mínimos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Peso do Bebê ao Nascer (gramas)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 3250"
                  value={formData.pesoBebe}
                  onChange={(e) => handleInputChange('pesoBebe', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Índice Apgar (1º e 5º min)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 9/10"
                  value={formData.apgar}
                  onChange={(e) => handleInputChange('apgar', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-blh-slate-700 mb-2">
                Intercorrências na Gestação (Histórico Clínico)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'infeccao', label: 'Infecção Urinária' },
                  { key: 'hipertensao', label: 'Hipertensão / DHEG' },
                  { key: 'diabetes', label: 'Diabetes Gestacional' },
                  { key: 'hepatite', label: 'Hepatite Pregressa' }
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-2.5 rounded-md border border-blh-line bg-blh-slate-50/40 text-xs cursor-pointer hover:bg-blh-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={formData.intercorrencias[item.key as keyof DonorFormData['intercorrencias']]}
                      onChange={() => handleIntercorrenciaChange(item.key as keyof DonorFormData['intercorrencias'])}
                      className="rounded text-blh-primary focus:ring-blh-primary"
                    />
                    <span className="font-medium text-blh-slate-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 4: CADEIA DE FRIO RESIDENCIAL */}
        {step === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Equipamento de Armazenamento Residencial *
                </label>
                <select
                  value={formData.equipamento}
                  onChange={(e) => handleInputChange('equipamento', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary bg-white"
                >
                  <option value="Freezer">Freezer Exclusivo (-18°C) — Recomendado</option>
                  <option value="Duplex">Refrigerador Duplex Frost-Free com congelador separado (-12°C)</option>
                  <option value="Simples">Geladeira 1 porta com congelador interno (Alerta de capacidade)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
                  Forma Prevista de Extração do Leite *
                </label>
                <select
                  value={formData.extracao}
                  onChange={(e) => handleInputChange('extracao', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-md border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary bg-white"
                >
                  <option value="Ordenha Manual">Ordenha Manual (Massagem e expressão manual)</option>
                  <option value="Bomba Elétrica">Bomba Extratora Elétrica</option>
                  <option value="Bomba Manual">Bomba Extratora Manual</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50/60 cursor-pointer hover:border-amber-300 transition-colors">
              <input
                type="checkbox"
                checked={formData.produtosJunto}
                onChange={(e) => handleInputChange('produtosJunto', e.target.checked)}
                className="mt-0.5 rounded text-blh-amber focus:ring-blh-amber"
              />
              <div>
                <strong className="block text-xs font-bold text-amber-900">
                  Armazena carnes cruas ou produtos não embalados junto ao frasco?
                </strong>
                <span className="text-xs text-amber-800 leading-relaxed block mt-0.5">
                  Risco crítico de contaminação biológica cruzada. Os frascos de leite doado devem ficar em compartimento ou caixa plástica isolada e fechada.
                </span>
              </div>
            </label>
          </div>
        )}

        {/* ETAPA 5: THE FINAL GATE (SOROLOGIA) */}
        {step === 5 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { num: 1, label: '1ª AMOSTRA', dataKey: 'soro1Data', resKey: 'soro1Res', desc: 'HIV, VDRL, HBsAg, HCV, HTLV, Chagas' },
                { num: 2, label: '2ª AMOSTRA', dataKey: 'soro2Data', resKey: 'soro2Res', desc: 'Confirmação de contraprova sorológica' },
                { num: 3, label: '3ª AMOSTRA', dataKey: 'soro3Data', resKey: 'soro3Res', desc: 'Monitoramento periódico e laudo laboratorial' }
              ].map((sample) => (
                <div key={sample.num} className="p-4 rounded-lg border border-blh-line bg-blh-slate-50/60 space-y-3">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blh-primary text-white tracking-wider">
                    {sample.label}
                  </span>

                  <div>
                    <label className="block text-[11px] font-semibold text-blh-slate-600 mb-1">
                      Data do Exame
                    </label>
                    <input
                      type="date"
                      value={formData[sample.dataKey as keyof DonorFormData] as string}
                      onChange={(e) => handleInputChange(sample.dataKey as keyof DonorFormData, e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded border border-blh-slate-300 focus:outline-none focus:ring-1 focus:ring-blh-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-blh-slate-600 mb-1">
                      Resultado Sorológico
                    </label>
                    <select
                      value={formData[sample.resKey as keyof DonorFormData] as string}
                      onChange={(e) => handleInputChange(sample.resKey as keyof DonorFormData, e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded border border-blh-slate-300 focus:outline-none focus:ring-1 focus:ring-blh-primary bg-white font-medium"
                    >
                      <option value="normal">Não Reagente (Sem alterações)</option>
                      <option value="alterada">Reagente / Alterada (Inapta)</option>
                    </select>
                  </div>

                  <p className="text-[10px] text-blh-slate-500 pt-1 border-t border-blh-slate-200">
                    {sample.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-rose-950 mb-0.5">
                  A Regra de Ouro da ANVISA / BLH Marília:
                </strong>
                Se qualquer uma das 3 amostras sorológicas for reagente/alterada, ou se a doadora apresentar tabagismo ativo regular ou tatuagem recente (&lt; 12 meses), ela será automaticamente <strong>REPROVADA (NO-GO)</strong> e bloqueada do ingresso na rota de coleta domiciliar para a total segurança imunológica dos recém-nascidos da UTI Neonatal.
              </div>
            </div>
          </div>
        )}

        {/* Botões de Navegação do Wizard */}
        <div className="mt-8 pt-5 border-t border-blh-line flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={step === 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            className={step === 1 ? 'invisible' : ''}
          >
            Etapa Anterior
          </Button>

          <div className="flex items-center gap-2.5">
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleCancel}
                className="text-blh-slate-600 hover:text-blh-slate-900"
              >
                Cancelar
              </Button>
            )}

            <Button
              type="submit"
              size="md"
              className={isEditing ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm' : ''}
              rightIcon={step === 5 ? <FileCheck2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            >
              {isEditing
                ? step === 5
                  ? 'Salvar Alterações & Concluir'
                  : 'Salvar & Avançar'
                : step === 5
                ? 'Avaliar Triagem Clínica (Go / No-Go)'
                : 'Próxima Etapa'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
