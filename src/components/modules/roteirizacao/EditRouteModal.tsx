import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Truck, User, Edit3, AlertCircle, Save } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { RouteAssignment, RouteShift, RouteStatus } from '../../../types/route';
import { FLEET_VEHICLES, FLEET_DRIVERS, FLEET_COLLECTORS } from '../../../data/initialRoutes';
import { Button } from '../../ui/Button';

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
  const { updateRoute } = useApp();

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
      alert('Informe o veículo.');
      return;
    }
    if (!driverName.trim()) {
      alert('Informe o Motorista / Condutor.');
      return;
    }

    updateRoute(route.id, {
      name: name.trim() || route.name,
      shift,
      vehicleName: vehicleName.trim(),
      vehiclePlate: vehiclePlate.trim(),
      driverName: driverName.trim(),
      collectorName: collectorName.trim() || 'Equipe BLH',
      status,
      notes: notes.trim()
    });

    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-blh-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-elevation w-full max-w-xl overflow-hidden border border-blh-slate-200 my-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-blh-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white/20 text-xs font-mono font-bold">
                  {route.code}
                </span>
                <h3 className="text-base font-bold text-white">Editar Dados da Rota</h3>
              </div>
              <p className="text-xs text-emerald-100">Atualização de veículo, tripulação e turno operacional</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-left">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
                Turno Operacional
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as RouteShift)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary outline-none bg-white font-medium"
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
                Status da Rota
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RouteStatus)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary outline-none bg-white font-medium"
              >
                <option value="planning">Planejamento</option>
                <option value="active">Em Trânsito (Ativa)</option>
                <option value="completed">Concluída</option>
                <option value="canceled">Cancelada</option>
              </select>
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
              Tripulação Alocada
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
                  Pessoa que foi coletar
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
      </div>
    </div>,
    document.body
  );
};
