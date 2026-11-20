import React from 'react';
import { Copy, Truck } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { RouteAssignment } from '../../../types/route';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

interface DuplicateRouteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteAssignment | null;
}

export const DuplicateRouteConfirmModal: React.FC<DuplicateRouteConfirmModalProps> = ({
  isOpen,
  onClose,
  route,
}) => {
  const { duplicateRoute } = useApp();

  const handleConfirm = () => {
    if (!route) return;
    duplicateRoute(route.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen && !!route}
      onClose={onClose}
      title={route ? `Duplicar Rota ${route.code}?` : 'Duplicar Rota'}
      subtitle={route ? `${route.name} (${route.vehicleName})` : undefined}
      maxWidth="md"
    >
      {route && (
        <div className="space-y-4 text-left">
          <div className="p-3.5 bg-blh-primary-soft/60 rounded-xl border border-blh-line text-xs text-blh-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blh-primary">
              <Truck className="w-4 h-4 shrink-0" />
              O que será copiado na nova rota
            </div>
            <p>
              • Veículo, placa, motorista, coletor(a), turno (<strong>{route.shift || 'Manhã'}</strong>) e zona (<strong>Zona {route.zone} · {route.day}-feira</strong>).
            </p>
            <p>
              • A nova rota iniciará em <strong>Planejamento</strong> sem paradas duplicadas, pronta para receber doadoras em <strong>Montar Paradas</strong>.
            </p>
          </div>

          <div className="pt-2 border-t border-blh-line flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Confirmar Duplicação
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
