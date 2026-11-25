import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X, PlusCircle, ArrowLeft, Users, HeartHandshake } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CadastroWizard } from './CadastroWizard';
import { GoNoGoVerdictBanner } from './GoNoGoVerdictBanner';
import { DoadorasTable } from './DoadorasTable';
import { CaptacaoDoadorasPanel } from './CaptacaoDoadorasPanel';
import { Donor, GoNoGoVerdict } from '../../../types/donor';
import { DonorInterest } from '../../../types/donorInterest';
import { Button } from '../../ui/Button';
import { useApp } from '../../../hooks/useApp';
import { useDonorInterestsSummary } from '../../../hooks/useDonorInterestsSummary';
import { PageTransition } from '../../motion';
import { MOTION_EASE } from '../../../lib/motion';

type DoadorasTab = 'cadastradas' | 'captacao';

export const DoadorasView: React.FC = () => {
  const { editingDonor, cancelEditDonor, startEditDonor } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: interestSummary } = useDonorInterestsSummary();

  const initialTab: DoadorasTab =
    searchParams.get('tab') === 'captacao' ? 'captacao' : 'cadastradas';
  const [activeTab, setActiveTab] = useState<DoadorasTab>(initialTab);
  const [showWizard, setShowWizard] = useState(false);
  const [convertingInterest, setConvertingInterest] = useState<DonorInterest | null>(null);
  const [lastVerdict, setLastVerdict] = useState<{
    donor: Donor;
    verdict: GoNoGoVerdict;
  } | null>(null);

  useEffect(() => {
    const paramTab = searchParams.get('tab');
    if (paramTab === 'captacao' && !showWizard) {
      setActiveTab('captacao');
    } else if (paramTab === 'cadastradas' && !showWizard) {
      setActiveTab('cadastradas');
    }
  }, [searchParams, showWizard]);

  useEffect(() => {
    if (editingDonor) {
      setConvertingInterest(null);
      setLastVerdict(null);
      setShowWizard(true);
    }
  }, [editingDonor]);

  const handleSelectTab = (tab: DoadorasTab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'captacao' ? { tab: 'captacao' } : {}, { replace: true });
  };

  const handleStartEdit = (donor: Donor) => {
    setConvertingInterest(null);
    startEditDonor(donor.id);
    setShowWizard(true);
  };

  const handleStartConversion = (interest: DonorInterest) => {
    cancelEditDonor();
    setLastVerdict(null);
    setConvertingInterest(interest);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    cancelEditDonor();
    setConvertingInterest(null);
    setShowWizard(false);
  };

  const newInterestsCount = interestSummary?.totalNew ?? 0;

  return (
    <div className="space-y-6">
      {/* Header Unificado */}
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-1 rounded-md">
                {editingDonor
                  ? 'Atualização de Cadastro'
                  : convertingInterest
                  ? 'Conversão de Captação Digital'
                  : showWizard
                  ? 'Nova Triagem Clínica'
                  : activeTab === 'captacao'
                  ? 'LEITE FLOW · Captação de Doadoras'
                  : 'LEITE FLOW · Gestão de Doadoras'}
              </span>
              {editingDonor && (
                <span className="font-mono text-xs font-bold text-blh-slate-800 bg-blh-slate-100 px-2 py-0.5 rounded border border-blh-slate-200">
                  DOAD-{String(editingDonor.id).padStart(3, '0')}
                </span>
              )}
              {convertingInterest && (
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {convertingInterest.protocol}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
              {editingDonor ? (
                <>
                  Atualizar Cadastro: <span className="text-blh-primary">{editingDonor.nome}</span>
                </>
              ) : convertingInterest ? (
                <>
                  Cadastrar Interessada:{' '}
                  <span className="text-blh-primary">{convertingInterest.fullName}</span>
                </>
              ) : showWizard ? (
                'Cadastro e Triagem Clínica da Doadora'
              ) : activeTab === 'captacao' ? (
                'Captação Digital de Novas Doadoras'
              ) : (
                'Gestão de Doadoras — BLH Marília'
              )}
            </h1>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
              {showWizard
                ? 'Triagem clínica conforme a RDC ANVISA nº 171/2006. Por segurança, os exames iniciam como pendentes até a confirmação do laudo.'
                : activeTab === 'captacao'
                ? 'Gerencie interessadas recebidas pelo site, registre contatos e converta candidatas aptas para o cadastro oficial.'
                : 'Consulte as doadoras cadastradas, acompanhe exames sorológicos ou inicie uma nova triagem.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {showWizard ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCloseWizard}
                leftIcon={
                  editingDonor || convertingInterest ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <ArrowLeft className="w-4 h-4" />
                  )
                }
              >
                {editingDonor
                  ? 'Cancelar atualização'
                  : convertingInterest
                  ? 'Cancelar conversão'
                  : 'Voltar para lista'}
              </Button>
            ) : (
              <Button
                size="md"
                onClick={() => {
                  cancelEditDonor();
                  setConvertingInterest(null);
                  setLastVerdict(null);
                  setShowWizard(true);
                }}
                leftIcon={<PlusCircle className="w-4 h-4" />}
                className="font-bold shadow-sm"
              >
                Cadastrar doadora
              </Button>
            )}
          </div>
        </div>

        {/* Abas do Módulo de Doadoras (ocultas enquanto o Wizard está aberto) */}
        {!showWizard && (
          <div className="pt-3 border-t border-blh-line flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleSelectTab('cadastradas')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'cadastradas'
                  ? 'bg-blh-primary text-white shadow-sm'
                  : 'bg-blh-slate-100 text-blh-slate-700 hover:bg-blh-slate-200/80'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Doadoras Cadastradas</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('captacao')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'captacao'
                  ? 'bg-blh-primary text-white shadow-sm'
                  : 'bg-blh-slate-100 text-blh-slate-700 hover:bg-blh-slate-200/80'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Captação de Doadoras</span>
              {newInterestsCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'captacao'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-200 text-amber-950'
                  }`}
                >
                  {newInterestsCount} {newInterestsCount === 1 ? 'nova' : 'novas'}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Banner de Veredito Recente com AnimatePresence */}
      <AnimatePresence>
        {lastVerdict && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.28, ease: MOTION_EASE.outExpo }}
          >
            <GoNoGoVerdictBanner
              verdict={lastVerdict}
              onDismiss={() => setLastVerdict(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo Principal: Wizard, Tabela de Doadoras ou Painel de Captação */}
      <AnimatePresence mode="wait" initial={false}>
        {showWizard ? (
          <PageTransition key="donor-wizard" variant="tab">
            <CadastroWizard
              editingDonor={editingDonor}
              convertingInterest={convertingInterest}
              onCancelEdit={handleCloseWizard}
              onSubmitted={(result) => {
                setLastVerdict(result);
                cancelEditDonor();
                setConvertingInterest(null);
                setShowWizard(false);
                handleSelectTab('cadastradas');
                void queryClient.invalidateQueries({ queryKey: ['donors'] });
                void queryClient.invalidateQueries({ queryKey: ['donor-interests'] });
                void queryClient.invalidateQueries({ queryKey: ['donor-interests-summary'] });
                void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
              }}
            />
          </PageTransition>
        ) : activeTab === 'captacao' ? (
          <PageTransition key="donor-capture" variant="tab">
            <CaptacaoDoadorasPanel onStartConversion={handleStartConversion} />
          </PageTransition>
        ) : (
          <PageTransition key="donor-table" variant="tab">
            <DoadorasTable onEditDonor={handleStartEdit} />
          </PageTransition>
        )}
      </AnimatePresence>
    </div>
  );
};
