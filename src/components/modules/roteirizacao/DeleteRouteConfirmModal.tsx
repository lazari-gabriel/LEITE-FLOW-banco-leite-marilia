import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { RouteAssignment } from '../../../types/route';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

interface DeleteRouteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteAssignment | null;
}

export const DeleteRouteConfirmModal: React.FC<DeleteRouteConfirmModalProps> = ({
  isOpen,
  onClose,
  route,
}) => {
  const { deleteRoute } = useApp();

  if (!route) return null;

  const handleConfirm = () => {
    deleteRoute(route.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Excluir Rota ${route.code}?`}
      subtitle={`${route.name} (${route.vehicleName})`}
      maxWidth="md"
    >
      <div className="space-y-4 text-left">
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            Regra de Segurança de Frota
          </div>
          <p>
            • As <strong>{route.donorIds.length} doadoras</strong> desta rota voltarão a ficar disponíveis para agendamento em outras rotas.
          </p>
          <p>
            • Coletas e frascos registrados anteriormente permanecerão <strong>preservados</strong> no histórico do Banco de Leite.
          </p>
        </div>

        <div className="pt-2 border-t border-blh-line flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={handleConfirm}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Confirmar Exclusão
          </Button>
        </div>
      </div>
    </Modal>
  );
};
