import React from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Edit3,
  Route,
  Milk,
  ShieldCheck,
  Tag,
  Calendar,
  Thermometer,
} from 'lucide-react';
import { Donor } from '../../../types/donor';
import { useApp } from '../../../hooks/useApp';
import {
  calculateMilkClass,
  getMilkClassDescription,
  getConsolidatedSerologyStatus,
} from '../../../services/donorService';
import { buildWhatsAppUrl } from '../../../services/routeService';
import { Modal } from '../../ui/Modal';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface DonorProfileModalProps {
  donor: Donor | null;
  onClose: () => void;
  onEdit?: (donor: Donor) => void;
}

export const DonorProfileModal: React.FC<DonorProfileModalProps> = ({
  donor,
  onClose,
  onEdit,
}) => {
  const { bottles, navigateToDonorRoute, setSelectedBottleId, setCurrentView } = useApp();

  if (!donor) return null;

  const donorBottles = bottles.filter((b) => b.doadoraId === donor.id);
  const totalVolumeMl = donorBottles.reduce((acc, b) => acc + b.volume, 0);
  const avgTemp =
    donorBottles.length > 0
      ? (donorBottles.reduce((acc, b) => acc + b.temp, 0) / donorBottles.length).toFixed(1)
      : null;

  const milkClass = calculateMilkClass(donor.parto);
  const milkDesc = getMilkClassDescription(milkClass);
  const serology = getConsolidatedSerologyStatus(donor);

  const serologyLabel = (s: string) =>
    s === 'normal' ? 'Não Reagente' : s === 'pendente' ? 'Pendente' : 'Reagente / Alterada';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Informações da Doadora — ${donor.nome}`}
      subtitle={`DOAD-${String(donor.id).padStart(3, '0')} · Zona ${donor.zona} · Cadastro ${donor.statusCadastro === 'ativa' ? 'Ativo' : 'Inativo'}`}
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs">
        {/* Faixa de Resumo & Ações Rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-blh-slate-50 border border-blh-line">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={
                donor.aptidao === 'Apta'
                  ? 'success'
                  : donor.aptidao === 'Pendente'
                  ? 'warning'
                  : 'danger'
              }
              dot
            >
              Aptidão: {donor.aptidao}
            </Badge>
            <Badge variant="zone">{milkDesc.name}</Badge>
            <Badge
              variant={
                donor.geocodeStatus === 'verified' ? 'success' : 'neutral'
              }
            >
              {donor.geocodeStatus === 'verified' ? 'Endereço verificado' : 'Localização aproximada'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={buildWhatsAppUrl(donor.nome, donor.telefone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 hover:bg-emerald-200 font-bold border border-emerald-300 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onClose();
                  onEdit(donor);
                }}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Editar
              </Button>
            )}
            {donor.aptidao === 'Apta' && donor.statusCadastro === 'ativa' && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  navigateToDonorRoute(donor.zona, donor.id);
                }}
                leftIcon={<Route className="w-3.5 h-3.5" />}
              >
                Ver na Rota
              </Button>
            )}
          </div>
        </div>

        {/* KPIs da Doadora */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-blh-line bg-white">
            <span className="text-[10px] font-bold uppercase text-blh-slate-500 block">
              Frascos Coletados
            </span>
            <span className="text-lg font-mono font-bold text-blh-primary flex items-center gap-1.5 mt-0.5">
              <Milk className="w-4 h-4" /> {donorBottles.length}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-blh-line bg-white">
            <span className="text-[10px] font-bold uppercase text-blh-slate-500 block">
              Volume Total Doado
            </span>
            <span className="text-lg font-mono font-bold text-blh-slate-900 mt-0.5 block">
              {totalVolumeMl} mL
            </span>
          </div>
          <div className="p-3 rounded-xl border border-blh-line bg-white">
            <span className="text-[10px] font-bold uppercase text-blh-slate-500 block">
              Média Térmica
            </span>
            <span className="text-lg font-mono font-bold text-blh-slate-900 flex items-center gap-1 mt-0.5">
              <Thermometer className="w-4 h-4 text-sky-600" />
              {avgTemp ? `${avgTemp} °C` : 'Sem aferição'}
            </span>
          </div>
        </div>

        {/* Dados Cadastrais & Endereço */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-blh-line bg-white space-y-2">
            <h4 className="font-bold text-blh-slate-900 uppercase tracking-wider text-[11px] border-b border-blh-line pb-1.5">
              Identificação &amp; Contato
            </h4>
            <div className="flex justify-between">
              <span className="text-blh-slate-500">Bebê / Data do Parto:</span>
              <strong className="text-blh-slate-900">{donor.bebe} ({donor.parto || '—'})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-blh-slate-500">Cartão SUS:</span>
              <strong className="font-mono text-blh-slate-900">{donor.sus}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-blh-slate-500">CPF:</span>
              <strong className="font-mono text-blh-slate-900">{donor.cpf}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blh-slate-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Telefone:
              </span>
              <strong className="font-mono text-blh-slate-900">{donor.telefone}</strong>
            </div>
            <div className="pt-1 border-t border-blh-line/60 flex items-start gap-1.5 text-blh-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blh-primary shrink-0 mt-0.5" />
              <span>{donor.endereco} ({donor.bairro})</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blh-line bg-white space-y-2">
            <h4 className="font-bold text-blh-slate-900 uppercase tracking-wider text-[11px] border-b border-blh-line pb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blh-primary" />
              Triagem Sanitária &amp; Sorologia ({serologyLabel(serology)})
            </h4>
            <div className="flex justify-between">
              <span className="text-blh-slate-500">1ª Amostra:</span>
              <strong className="text-blh-slate-900">
                {serologyLabel(donor.sorologia1)} {donor.soro1Data ? `(${donor.soro1Data})` : ''}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-blh-slate-500">2ª Amostra:</span>
              <strong className="text-blh-slate-900">
                {serologyLabel(donor.sorologia2)} {donor.soro2Data ? `(${donor.soro2Data})` : ''}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-blh-slate-500">3ª Amostra:</span>
              <strong className="text-blh-slate-900">
                {serologyLabel(donor.sorologia3)} {donor.soro3Data ? `(${donor.soro3Data})` : ''}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-blh-slate-500">Armazenamento / Extração:</span>
              <strong className="text-blh-slate-900">{donor.equipamento} · {donor.extracao}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-blh-slate-500">Tatuagem / Transfusão:</span>
              <strong className="text-blh-slate-900">
                {donor.tatuagemData || donor.tatuagem} / {donor.transfusaoData || donor.transfusao}
              </strong>
            </div>
            {donor.motivoInapta && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[11px] mt-1">
                <strong>Observação de Triagem:</strong> {donor.motivoInapta}
              </div>
            )}
          </div>
        </div>

        {/* Histórico Operacional de Coletas & Frascos */}
        <div className="p-4 rounded-xl border border-blh-line bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-blh-line pb-2">
            <h4 className="font-bold text-blh-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blh-primary" />
              Histórico de Coletas e Frascos ({donorBottles.length})
            </h4>
          </div>

          {donorBottles.length === 0 ? (
            <p className="text-blh-slate-500 py-3 text-center">
              Nenhuma coleta registrada para esta doadora até o momento.
            </p>
          ) : (
            <div className="divide-y divide-blh-line max-h-48 overflow-y-auto">
              {donorBottles.map((b) => (
                <div key={b.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-mono font-bold text-blh-primary">{b.codigo}</span>
                    <span className="text-blh-slate-600 ml-2">
                      {b.dataHoraColeta} · <strong>{b.volume} mL</strong> · {b.temp}°C
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        b.statusPast === 'Pasteurizado' || b.statusPast === 'Dispensado'
                          ? 'success'
                          : b.statusPast === 'Descartado'
                          ? 'danger'
                          : 'info'
                      }
                      size="sm"
                    >
                      {b.statusPast}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBottleId(b.id);
                        onClose();
                        setCurrentView('etiquetas');
                      }}
                      className="p-1.5 rounded hover:bg-blh-slate-100 text-blh-slate-600 hover:text-blh-primary"
                      title="Ver etiqueta deste frasco"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
