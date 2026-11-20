import React, { useState, useEffect } from 'react';
import { X, PlusCircle, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CadastroWizard } from './CadastroWizard';
import { GoNoGoVerdictBanner } from './GoNoGoVerdictBanner';
import { DoadorasTable } from './DoadorasTable';
import { Donor, GoNoGoVerdict } from '../../../types/donor';
import { Button } from '../../ui/Button';
import { useApp } from '../../../hooks/useApp';
import { PageTransition } from '../../motion';
import { MOTION_EASE } from '../../../lib/motion';

export const DoadorasView: React.FC = () => {
  const { editingDonor, cancelEditDonor, startEditDonor } = useApp();
  const [showWizard, setShowWizard] = useState(false);
  const [lastVerdict, setLastVerdict] = useState<{
    donor: Donor;
    verdict: GoNoGoVerdict;
  } | null>(null);

  useEffect(() => {
    if (editingDonor) {
      setLastVerdict(null);
      setShowWizard(true);
    }
  }, [editingDonor]);

  const handleStartEdit = (donor: Donor) => {
    startEditDonor(donor.id);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    cancelEditDonor();
    setShowWizard(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Unificado */}
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-1 rounded-md">
                {editingDonor
                  ? 'Atualização de Cadastro'
                  : showWizard
                  ? 'Nova Triagem Clínica'
                  : 'LEITE FLOW · Gestão de Doadoras'}
              </span>
              {editingDonor && (
                <span className="font-mono text-xs font-bold text-blh-slate-800 bg-blh-slate-100 px-2 py-0.5 rounded border border-blh-slate-200">
                  DOAD-{String(editingDonor.id).padStart(3, '0')}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
              {editingDonor ? (
                <>
                  Atualizar Cadastro: <span className="text-blh-primary">{editingDonor.nome}</span>
                </>
              ) : showWizard ? (
                'Cadastro e Triagem Clínica da Doadora'
              ) : (
                'Gestão de Doadoras — BLH Marília'
              )}
            </h1>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
              {showWizard
                ? 'Triagem clínica conforme a RDC ANVISA nº 171/2006. Por segurança, os exames iniciam como pendentes até a confirmação do laudo.'
                : 'Consulte as doadoras cadastradas, acompanhe exames sorológicos ou inicie uma nova triagem.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {showWizard ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCloseWizard}
                leftIcon={editingDonor ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              >
                {editingDonor ? 'Cancelar atualização' : 'Voltar para lista'}
              </Button>
            ) : (
              <Button
                size="md"
                onClick={() => {
                  cancelEditDonor();
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

      {/* Separação clara com transição suave entre Wizard e Tabela Principal */}
      <AnimatePresence mode="wait" initial={false}>
        {showWizard ? (
          <PageTransition key="donor-wizard" variant="tab">
            <CadastroWizard
              editingDonor={editingDonor}
              onCancelEdit={handleCloseWizard}
              onSubmitted={(result) => {
                setLastVerdict(result);
                cancelEditDonor();
                setShowWizard(false);
              }}
            />
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
