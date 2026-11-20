import React, { useState, useEffect } from 'react';
import { Truck, User, Save } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { RouteAssignment, RouteShift, RouteStatus } from '../../../types/route';
import { FLEET_DRIVERS, FLEET_COLLECTORS } from '../../../data/initialRoutes';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

interface EditRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteAssignment | null;
}

export const EditRouteModal: React.FC<EditRouteModalProps> = ({
  isOpen,
  onClose,
  route
}) => {
  const { updateRoute, addToast } = useApp();

  const [name, setName] = useState('');
  const [shift, setShift] = useState<RouteShift>('Manhã');
  const [vehicleName, setVehicleName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [collectorName, setCollectorName] = useState('');
  const [status, setStatus] = useState<RouteStatus>('planning');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (route) {
      setName(route.name || '');
      setShift(route.shift || 'Manhã');
      setVehicleName(route.vehicleName || '');
      setVehiclePlate(route.vehiclePlate || '');
      setDriverName(route.driverName || '');
      setCollectorName(route.collectorName || '');
      setStatus(route.status);
      setNotes(route.notes || '');
    }
  }, [route]);

  if (!isOpen || !route) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleName.trim()) {
      addToast({ type: 'warning', title: 'Veículo obrigatório', description: 'Informe o veículo.' });
      return;
    }
    if (!driverName.trim()) {
      addToast({ type: 'warning', title: 'Condutor obrigatório', description: 'Informe o Motorista / Condutor.' });
      return;
    }

    updateRoute(route.id, {
      name: name.trim() || route.name,
      shift,
      vehicleName: vehicleName.trim(),
      vehiclePlate: vehiclePlate.trim(),
      driverName: driverName.trim(),
      collectorName: collectorName.trim() || 'Equipe BLH',
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Dados da Rota (${route.code})`}
      subtitle="Atualize veículo, equipe e turno da coleta"
      maxWidth="xl"
    >
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Nome da Rota */}
          <div>
            <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
              Identificação / Nome da Rota
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary outline-none"
              required
            />
          </div>

          {/* Turno e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
                Turno Operacional
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as RouteShift)}
                className="w-full h-10 text-sm px-3 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary outline-none bg-white font-medium"
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
                Status Atual
              </label>
              <div className="w-full h-10 flex items-center text-xs px-3 rounded-lg border border-blh-slate-200 bg-blh-slate-50 font-bold text-blh-slate-700 truncate">
                {status === 'planning'
                  ? 'Planejamento (use Iniciar Rota)'
                  : status === 'active'
                  ? 'Em Trânsito (use Finalizar Rota)'
                  : status === 'completed'
                  ? 'Concluída (registro arquivado)'
                  : 'Cancelada'}
              </div>
            </div>
          </div>

          {/* Veículo & Placa */}
          <div className="p-3.5 bg-blh-slate-50 rounded-xl border border-blh-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-blh-slate-800 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blh-primary" />
              Veículo e Placa
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="Modelo do Veículo"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-1 focus:ring-blh-primary"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="Placa"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-1 focus:ring-blh-primary font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Tripulação */}
          <div className="p-3.5 bg-blh-slate-50 rounded-xl border border-blh-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-blh-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blh-primary" />
              Equipe responsável
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-blh-slate-600 mb-1">
                  Motorista / Condutor
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  list="edit-drivers-list"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-1 focus:ring-blh-primary"
                  required
                />
                <datalist id="edit-drivers-list">
                  {FLEET_DRIVERS.map((d) => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-blh-slate-600 mb-1">
                  Responsável pela coleta
                </label>
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  list="edit-collectors-list"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-1 focus:ring-blh-primary"
                />
                <datalist id="edit-collectors-list">
                  {FLEET_COLLECTORS.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1">
              Observações Operacionais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções para o motorista ou coletor..."
              className="w-full text-xs p-3 rounded-lg border border-blh-slate-300 outline-none focus:ring-1 focus:ring-blh-primary resize-none"
            />
          </div>

          {/* Botões */}
          <div className="pt-3 border-t border-blh-slate-200 flex items-center justify-end gap-2.5">
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
              type="submit"
              size="sm"
              className="bg-blh-primary hover:bg-blh-primary-dark text-white font-bold"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
    </Modal>
  );
};
