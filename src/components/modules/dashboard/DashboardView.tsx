import React from 'react';
import { Users, UserX, Milk, Thermometer, Droplets, MapPin, Route, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { StatCard } from '../../ui/StatCard';
import { TripleVerificationPipeline } from './TripleVerificationPipeline';
import { WeekMatrixOverview } from './WeekMatrixOverview';
import { Button } from '../../ui/Button';

export const DashboardView: React.FC = () => {
  const { stats, setCurrentView } = useApp();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho da Visão Geral */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blh-line shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-0.5 rounded-md">
                LEITE FLOW · Centro de Controle
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operação de Frota Ativa
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
              Logística &amp; Coleta de Leite Materno
            </h1>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
              Acompanhe as coletas em campo, o cadastro de doadoras de Marília e a rastreabilidade segura dos frascos até os recém-nascidos da UTI Neonatal.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
            <Button
              size="sm"
              onClick={() => setCurrentView('roteirizacao')}
              leftIcon={<Route className="w-4 h-4" />}
              className="font-bold shadow-sm"
            >
              Ver Rotas do Dia
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('mapa')}
              leftIcon={<MapPin className="w-4 h-4" />}
            >
              Abrir Mapa
            </Button>
          </div>
        </div>

        {/* Barra de Telemetria de Frota Integrada */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-blh-line/60 text-xs">
          <div className="p-2.5 rounded-xl bg-blh-slate-50 border border-blh-line flex items-center justify-between">
            <span className="text-[11px] text-blh-slate-500 font-medium">Veículo Escala:</span>
            <span className="font-mono font-bold text-blh-slate-900">Van 01 (Fiorino)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <span className="text-[11px] text-emerald-800 font-medium">Cadeia Frio:</span>
            <span className="font-mono font-bold text-emerald-900">-17.2°C (Ideal)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between">
            <span className="text-[11px] text-sky-800 font-medium">Norma ANVISA:</span>
            <span className="font-mono font-bold text-sky-900">RDC 171/2006</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blh-slate-50 border border-blh-line flex items-center justify-between">
            <span className="text-[11px] text-blh-slate-500 font-medium">Base Operacional:</span>
            <span className="font-bold text-blh-slate-800 truncate ml-1">Hosp. Mat. Infantil</span>
          </div>
        </div>
      </div>

      {/* Cards Principais com Linguagem Humana */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Doadoras Aptas"
          value={stats.aptDonors}
          caption="Liberadas para coleta semanal"
          variant="success"
          icon={<Users className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Doadoras Inaptas / Inativas"
          value={stats.inaptDonors}
          caption={`${stats.inactiveDonors} inativadas (histórico preservado)`}
          variant="alert"
          icon={<UserX className="w-4 h-4 text-rose-600" />}
        />
        <StatCard
          label="Frascos Coletados"
          value={stats.totalBottles}
          caption="Rastreados com código único"
          variant="default"
          icon={<Milk className="w-4 h-4 text-blh-primary" />}
        />
        <StatCard
          label="Volume Coletado"
          value={
            <span className="inline-flex items-baseline">
              <span>{stats.totalVolumeMl}</span>
              <span className="text-sm font-semibold text-blh-slate-600 ml-1.5 font-sans">mL</span>
            </span>
          }
          caption="Leite cru aguardando pasteurização"
          variant="accent"
          icon={<Droplets className="w-4 h-4 text-blh-accent" />}
        />
        <StatCard
          label="Temperatura da Caixa"
          value={
            <span className="inline-flex items-baseline">
              <span>{stats.averageTemp}</span>
              <span className="text-sm font-semibold text-blh-slate-600 ml-1.5 font-sans">°C</span>
            </span>
          }
          caption="Cadeia de frio < -10°C em 100%"
          variant="warn"
          icon={<Thermometer className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* Tripla Verificação Hospitalar */}
      <TripleVerificationPipeline />

      {/* Resumo da Matriz Semanal de Marília */}
      <WeekMatrixOverview />
    </div>
  );
};
