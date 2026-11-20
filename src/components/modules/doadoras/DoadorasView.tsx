import React, { useState, useEffect } from 'react';
import { X, PlusCircle, ArrowLeft } from 'lucide-react';
import { CadastroWizard } from './CadastroWizard';
import { GoNoGoVerdictBanner } from './GoNoGoVerdictBanner';
import { DoadorasTable } from './DoadorasTable';
import { Donor, GoNoGoVerdict } from '../../../types/donor';
import { Button } from '../../ui/Button';
import { useApp } from '../../../hooks/useApp';

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
    <div className="space-y-6 animate-fadeIn">
      {/* Header Unificado */}
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-1 rounded-md">
                {editingDonor
                  ? 'Modo de Edição Cadastral'
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
                  Editar Cadastro: <span className="text-blh-primary">{editingDonor.nome}</span>
                </>
              ) : showWizard ? (
                'Cadastro de Doadora & Triagem Sanitária'
              ) : (
                'Base Central de Doadoras — BLH Marília'
              )}
            </h1>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
              {showWizard
                ? 'Triagem clínica baseada na RDC ANVISA nº 171/2006. Exames iniciam pendentes por segurança (fail-safe).'
                : 'Pesquise, inspecione o perfil 360°, gerencie aptidão sorológica ou inicie um novo cadastro de triagem.'}
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
                {editingDonor ? 'Cancelar Edição' : 'Voltar para Lista'}
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
                Nova Doadora
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Banner de Veredito Recente */}
      {lastVerdict && (
        <GoNoGoVerdictBanner
          verdict={lastVerdict}
          onDismiss={() => setLastVerdict(null)}
        />
      )}

      {/* Separação clara: Wizard dedicado OU Tabela Principal */}
      {showWizard ? (
        <CadastroWizard
          editingDonor={editingDonor}
          onCancelEdit={handleCloseWizard}
          onSubmitted={(result) => {
            setLastVerdict(result);
            cancelEditDonor();
            setShowWizard(false);
          }}
        />
      ) : (
        <DoadorasTable onEditDonor={handleStartEdit} />
      )}
    </div>
  );
};
