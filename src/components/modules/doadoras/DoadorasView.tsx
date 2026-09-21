import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { CadastroWizard } from './CadastroWizard';
import { GoNoGoVerdictBanner } from './GoNoGoVerdictBanner';
import { DoadorasTable } from './DoadorasTable';
import { Donor, GoNoGoVerdict } from '../../../types/donor';
import { Button } from '../../ui/Button';
import { useApp } from '../../../hooks/useApp';

export const DoadorasView: React.FC = () => {
  const { editingDonor, cancelEditDonor, startEditDonor } = useApp();
  const [lastVerdict, setLastVerdict] = useState<{
    donor: Donor;
    verdict: GoNoGoVerdict;
  } | null>(null);
  const wizardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingDonor) {
      setLastVerdict(null);
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingDonor]);

  const handleStartEdit = (donor: Donor) => {
    startEditDonor(donor.id);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Unificado da View (Normal vs Modo de Edição) */}
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card">
        {editingDonor ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-1 rounded-md">
                  Modo de Edição Cadastral
                </span>
                <span className="font-mono text-xs font-bold text-blh-slate-800 bg-blh-slate-100 px-2 py-0.5 rounded border border-blh-slate-200">
                  DOAD-{String(editingDonor.id).padStart(3, '0')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
                Editar Cadastro: <span className="text-blh-primary">{editingDonor.nome}</span>
              </h1>
              <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
                Altere as informações nos passos abaixo e clique em salvar para atualizar a doadora no sistema.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={cancelEditDonor}
              leftIcon={<X className="w-4 h-4" />}
              className="text-blh-slate-700 font-bold shrink-0 self-start sm:self-center"
            >
              Cancelar Edição
            </Button>
          </div>
        ) : (
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-1 rounded-md mb-2">
              LEITE FLOW · Cadastro &amp; Triagem
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
              Cadastro de Doadora &amp; Avaliação de Segurança
            </h1>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
              Triagem biológica baseada nas diretrizes do <strong>Banco de Leite Humano de Marília</strong> e ANVISA. Doadoras cadastradas entram ativas por padrão.
            </p>
          </div>
        )}
      </div>

      {/* Banner de Veredito Recente */}
      {lastVerdict && (
        <GoNoGoVerdictBanner
          verdict={lastVerdict}
          onDismiss={() => setLastVerdict(null)}
        />
      )}

      {/* Wizard de Cadastro em 5 Etapas (Criar / Editar) */}
      <div ref={wizardRef}>
        <CadastroWizard
          editingDonor={editingDonor}
          onCancelEdit={cancelEditDonor}
          onSubmitted={(result) => {
            setLastVerdict(result);
            cancelEditDonor();
          }}
        />
      </div>

      {/* Tabela Central de Doadoras com CRUD */}
      <DoadorasTable onEditDonor={handleStartEdit} />
    </div>
  );
};
