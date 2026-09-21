import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Donor } from '../../../types/donor';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

interface SkipStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  donor: Donor | null;
  onConfirm: (motivo: string) => void;
}

const PRESET_REASONS = [
  'Doadora ausente / Não atendeu',
  'Bebê internado / Em tratamento',
  'Sem frascos cheios / Volume insuficiente',
  'Desistência temporária da doação',
  'Mudança de endereço / Não localizada',
  'Outro motivo'
];

export const SkipStopModal: React.FC<SkipStopModalProps> = ({
  isOpen,
  onClose,
  donor,
  onConfirm
}) => {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  if (!donor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Outro motivo' ? customReason.trim() : selectedReason;
    if (!finalReason) return;
    onConfirm(finalReason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Parada Não Realizada"
      subtitle={`Doadora: ${donor.nome}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Atenção ao registrar não comparecimento</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Esta parada será marcada como <strong>não realizada</strong> nesta rota de hoje. O histórico permanente permanece intacto.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-blh-slate-800 mb-2">
            Selecione o motivo:
          </label>
          <div className="space-y-1.5">
            {PRESET_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedReason === reason
                    ? 'border-rose-300 bg-rose-50/60 font-semibold text-rose-950'
                    : 'border-blh-slate-200 hover:bg-blh-slate-50 text-blh-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="skipReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedReason === 'Outro motivo' && (
          <div>
            <label className="block text-xs font-semibold text-blh-slate-700 mb-1">
              Descreva o motivo detalhado *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Ex: Mãe pediu para recolher amanhã pois teve consulta médica..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        )}

        <div className="pt-3 border-t border-blh-line flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            type="submit"
            size="md"
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            disabled={selectedReason === 'Outro motivo' && !customReason.trim()}
          >
            Confirmar Não Realizada
          </Button>
        </div>
      </form>
    </Modal>
  );
};
