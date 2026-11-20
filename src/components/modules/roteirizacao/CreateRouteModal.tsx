import React, { useState } from 'react';
import { Truck, User, Plus, Sparkles } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { WeekDay, ZoneName } from '../../../types/donor';
import { RouteFormData, RouteShift } from '../../../types/route';
import { DAY_BY_ZONE, ZONE_BY_DAY } from '../../../constants/zones';
import { FLEET_VEHICLES, FLEET_DRIVERS, FLEET_COLLECTORS } from '../../../data/initialRoutes';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

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
  const { createRoute, donors, getAllAssignedDonorIds, addToast } = useApp();

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
      addToast({ type: 'warning', title: 'Veículo obrigatório', description: 'Informe o veículo da rota.' });
      return;
    }
    if (!driverName.trim()) {
      addToast({ type: 'warning', title: 'Condutor obrigatório', description: 'Informe o Motorista / Condutor.' });
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Nova Rota de Frota"
      subtitle="Despacho de veículo para coleta de leite materno"
      maxWidth="xl"
    >
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Nome da Rota */}
          <div>
            <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
              Identificação da Rota / Apelido
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Van 02 - Rota Norte Apoio ou Coleta Urgência"
              className="w-full h-10 text-sm px-3.5 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary outline-none transition"
            />
          </div>

          {/* Zona de Coleta, Dia da Semana e Turno (Sincronizados e Alinhados) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="h-5 flex items-center text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
                Zona de Coleta
              </label>
              <select
                value={zone}
                onChange={(e) => handleZoneChange(e.target.value as ZoneName)}
                className="w-full h-10 text-sm px-3 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary outline-none bg-white font-medium"
              >
                <option value="Norte">Zona Norte</option>
                <option value="Sul">Zona Sul</option>
                <option value="Oeste">Zona Oeste</option>
                <option value="Leste">Zona Leste</option>
                <option value="Rural">Zona Rural</option>
              </select>
            </div>

            <div>
              <label className="h-5 flex items-center justify-between gap-1 text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
                <span className="truncate">Dia da Semana</span>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                  Auto
                </span>
              </label>
              <select
                value={day}
                onChange={(e) => handleDayChange(e.target.value as WeekDay)}
                className="w-full h-10 text-sm px-3 rounded-lg border border-blh-slate-300 focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary outline-none bg-white font-medium"
              >
                <option value="Segunda">Segunda-feira</option>
                <option value="Terça">Terça-feira</option>
                <option value="Quarta">Quarta-feira</option>
                <option value="Quinta">Quinta-feira</option>
                <option value="Sexta">Sexta-feira</option>
              </select>
            </div>

            <div>
              <label className="h-5 flex items-center text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
                Turno
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
          </div>

          {/* Veículo & Placa */}
          <div className="p-3.5 bg-blh-slate-50 rounded-xl border border-blh-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-blh-slate-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blh-primary" />
                Veículo da Frota
              </span>
              <div className="flex gap-1.5">
                {FLEET_VEHICLES.map((v) => {
                  const isCurrentVehicle = vehicleName === v.name;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVehicle(v.id)}
                      className={`text-[11px] px-2.5 py-0.5 rounded-md border transition font-semibold ${
                        isCurrentVehicle
                          ? 'bg-blh-primary text-white border-blh-primary shadow-sm'
                          : 'bg-white hover:bg-blh-primary-soft hover:border-blh-primary/40 border-blh-slate-200 text-blh-slate-700'
                      }`}
                    >
                      {v.name.split(' - ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="Modelo do Veículo (ex.: Mercedes Sprinter BLH)"
                  className="w-full h-10 text-xs px-3 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="Placa (ex.: BRA-2E19)"
                  className="w-full h-10 text-xs px-3 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary font-mono uppercase"
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
                  className="w-full h-10 text-xs px-3 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
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
                  className="w-full h-10 text-xs px-3 rounded-lg border border-blh-slate-300 bg-white outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
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
          <div className="p-3.5 bg-blh-primary-soft/60 rounded-xl border border-blh-line-strong border-l-4 border-l-blh-primary">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoFill}
                onChange={(e) => setAutoFill(e.target.checked)}
                className="mt-0.5 rounded accent-blh-primary focus:ring-blh-primary w-4 h-4 cursor-pointer shrink-0"
              />
              <div className="text-left">
                <span className="text-xs font-bold text-blh-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blh-primary shrink-0" />
                  Alocar automaticamente doadoras disponíveis da Zona {zone}
                </span>
                <p className="text-[11px] text-blh-slate-700 mt-0.5 leading-relaxed">
                  Inclui{' '}
                  <strong>
                    {availableZoneDonors.length}{' '}
                    {availableZoneDonors.length === 1 ? 'doadora apta' : 'doadoras aptas'}
                  </strong>{' '}
                  que não estão alocadas em outra van no mesmo dia, já ordenadas por menor distância (TSP).
                </p>
              </div>
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-blh-slate-700 uppercase tracking-wider mb-1.5">
              Observações Operacionais (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Levar caixas extras de gelo reciclável; parada prioritária no Palmital."
              className="w-full h-10 text-xs px-3 rounded-lg border border-blh-slate-300 outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
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
    </Modal>
  );
};
