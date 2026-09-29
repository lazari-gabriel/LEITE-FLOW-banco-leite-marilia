import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { RouteAssignment } from '../../../types/route';
import { Button } from '../../ui/Button';

interface DeleteRouteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteAssignment | null;
}

export const DeleteRouteConfirmModal: React.FC<DeleteRouteConfirmModalProps> = ({
  isOpen,
  onClose,
  route
}) => {
  const { deleteRoute } = useApp();

  if (!isOpen || !route) return null;

  const handleConfirm = () => {
    deleteRoute(route.id);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-blh-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-elevation w-full max-w-md overflow-hidden border border-blh-slate-200 my-auto animate-scaleIn text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-blh-slate-900">
            Excluir Rota {route.code}?
          </h3>

          <p className="text-sm text-blh-slate-600 mt-2">
            Você está prestes a remover a rota <strong>{route.name}</strong> ({route.vehicleName}).
          </p>

          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Regra de Segurança de Frota
            </div>
            <p>
              • As <strong>{route.donorIds.length} doadoras</strong> desta rota serão devolvidas imediatamente para o pool de disponíveis para que possam ser alocadas em outro veículo.
            </p>
            <p>
              • Coletas e frascos registrados anteriormente permanecem <strong>100% preservados</strong> no histórico do laboratório.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-blh-slate-300 text-blh-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
