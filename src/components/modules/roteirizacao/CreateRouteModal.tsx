import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Truck, User, HeartHandshake, Calendar, Clock, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { WeekDay, ZoneName } from '../../../types/donor';
import { RouteFormData, RouteShift } from '../../../types/route';
import { ZONAS_SEMANA, DAY_BY_ZONE, ZONE_BY_DAY } from '../../../constants/zones';
import { FLEET_VEHICLES, FLEET_DRIVERS, FLEET_COLLECTORS } from '../../../data/initialRoutes';
import { Button } from '../../ui/Button';

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDay?: WeekDay;
  onCreated?: (routeId: string) => void;
}

export const CreateRouteModal: React.FC<CreateRouteModalProps> = ({
  isOpen,
  onClose,
  defaultDay = 'Segunda',
  onCreated
}) => {
  const { createRoute, donors, getAllAssignedDonorIds } = useApp();

  const initialZone = (ZONE_BY_DAY[defaultDay]?.zona || 'Norte') as ZoneName;
  const [name, setName] = useState('');
  const [day, setDay] = useState<WeekDay>(defaultDay);
  const [zone, setZone] = useState<ZoneName>(initialZone);
  const [shift, setShift] = useState<RouteShift>('Manhã');
  const [vehicleName, setVehicleName] = useState(FLEET_VEHICLES[0]?.name || '');
  const [vehiclePlate, setVehiclePlate] = useState(FLEET_VEHICLES[0]?.plate || '');
  const [driverName, setDriverName] = useState(FLEET_DRIVERS[0]?.name || '');
  const [collectorName, setCollectorName] = useState(FLEET_COLLECTORS[0]?.name || '');
  const [autoFill, setAutoFill] = useState(true);
  const [notes, setNotes] = useState('');

  // Ao abrir o modal, inicializa com o dia e zona sincronizados
  React.useEffect(() => {
    if (isOpen) {
      setDay(defaultDay);
      const z = (ZONE_BY_DAY[defaultDay]?.zona || 'Norte') as ZoneName;
      setZone(z);
    }
  }, [isOpen, defaultDay]);

  // Ao selecionar a Zona de Coleta, atualiza o Dia da Semana automaticamente
  const handleZoneChange = (newZone: ZoneName) => {
    setZone(newZone);
    const correspondingDay = (DAY_BY_ZONE[newZone] || 'Segunda') as WeekDay;
    setDay(correspondingDay);
  };

  // Ao selecionar o Dia da Semana, atualiza a Zona de Coleta automaticamente
  const handleDayChange = (newDay: WeekDay) => {
    setDay(newDay);
    const zConfig = ZONE_BY_DAY[newDay];
    if (zConfig) {
      setZone(zConfig.zona);
    }
  };

  // Seleção rápida de veículo pré-cadastrado
  const handleSelectVehicle = (vehId: string) => {
    const veh = FLEET_VEHICLES.find((v) => v.id === vehId);
    if (veh) {
      setVehicleName(veh.name);
      setVehiclePlate(veh.plate);
    }
  };

  // Cálculo de doadoras disponíveis na zona sem conflito de rota no mesmo dia
  const assignedMap = getAllAssignedDonorIds(day);
  const availableZoneDonors = donors.filter(
    (d) => d.zona === zone && d.aptidao === 'Apta' && d.statusCadastro === 'ativa' && !assignedMap.has(d.id)
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleName.trim()) {
      alert('Informe o veículo da rota.');
      return;
    }
    if (!driverName.trim()) {
      alert('Informe o Motorista / Condutor.');
      return;
    }

    const formData: RouteFormData = {
      name: name.trim() || `Rota ${zone} - ${shift}`,
      day,
      zone,
      shift,
      vehicleName: vehicleName.trim(),
      vehiclePlate: vehiclePlate.trim(),
      driverName: driverName.trim(),
      collectorName: collectorName.trim() || 'Equipe BLH',
      autoFillZoneDonors: autoFill,
      notes: notes.trim()
    };

    const newRoute = createRoute(formData);
    onCreated?.(newRoute.id);
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
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Criar Nova Rota de Frota</h3>
              <p className="text-xs text-emerald-100">Despacho de veículo para coleta de leite materno</p>
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
              Identificação da Rota / Apelido
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Van 02 - Rota Norte Apoio ou Coleta Urgência"
              className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary focus:border-transparent outline-none transition"
            />
          </div>

          {/* Zona de Coleta, Dia da Semana e Turno (Sincronizados) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
                Zona de Coleta
              </label>
              <select
                value={zone}
                onChange={(e) => handleZoneChange(e.target.value as ZoneName)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary outline-none bg-white font-medium"
              >
                <option value="Norte">Zona Norte (Segunda)</option>
                <option value="Sul">Zona Sul (Terça)</option>
                <option value="Oeste">Zona Oeste (Quarta)</option>
                <option value="Leste">Zona Leste (Quinta)</option>
                <option value="Rural">Zona Rural (Sexta)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Dia da Semana</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Automático
                </span>
              </label>
              <select
                value={day}
                onChange={(e) => handleDayChange(e.target.value as WeekDay)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary outline-none bg-white font-medium"
              >
                <option value="Segunda">Segunda-feira (Zona Norte)</option>
                <option value="Terça">Terça-feira (Zona Sul)</option>
                <option value="Quarta">Quarta-feira (Zona Oeste)</option>
                <option value="Quinta">Quinta-feira (Zona Leste)</option>
                <option value="Sexta">Sexta-feira (Zona Rural)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
                Turno
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
          </div>

          {/* Veículo & Placa */}
          <div className="p-3.5 bg-blh-slate-50 rounded-xl border border-blh-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blh-slate-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blh-primary" />
                Veículo da Frota
              </span>
              <div className="flex gap-1.5">
                {FLEET_VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVehicle(v.id)}
                    className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-blh-primary hover:text-white border border-blh-slate-200 text-blh-slate-700 transition font-medium"
                  >
                    {v.name.split(' - ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="Modelo do Veículo (ex: Mercedes Sprinter BLH)"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-1 focus:ring-blh-primary"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="Placa (ex: BRA-2E19)"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-1 focus:ring-blh-primary font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Tripulação da Coleta */}
          <div className="p-3.5 bg-blh-slate-50 rounded-xl border border-blh-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-blh-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blh-primary" />
              Equipe Operacional
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
                  placeholder="Nome do motorista"
                  list="drivers-list"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-1 focus:ring-blh-primary"
                  required
                />
                <datalist id="drivers-list">
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
                  placeholder="Nome da coletora / técnica"
                  list="collectors-list"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-1 focus:ring-blh-primary"
                />
                <datalist id="collectors-list">
                  {FLEET_COLLECTORS.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Pré-alocação automática de paradas */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoFill}
                onChange={(e) => setAutoFill(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div className="text-left">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Alocar automaticamente doadoras disponíveis da Zona {zone}
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Inclui <strong>{availableZoneDonors.length} doadoras</strong> aptas que não estão alocadas em outra van no mesmo dia, já ordenadas por menor distância (TSP).
                </p>
              </div>
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1">
              Observações Operacionais (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Levar caixas extras de gelox; parada prioritária no Palmital."
              className="w-full text-xs px-3 py-2 rounded-lg border border-blh-slate-300 outline-none focus:ring-1 focus:ring-blh-primary"
            />
          </div>

          {/* Botões de Ação */}
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
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Criar Rota na Frota
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
