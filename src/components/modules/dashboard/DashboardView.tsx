import React, { useMemo, useState } from 'react';
import {
  Users,
  UserX,
  Milk,
  Thermometer,
  Droplets,
  MapPin,
  Route,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { ZoneName } from '../../../types/donor';
import { ZONAS_SEMANA } from '../../../constants/zones';
import { StatCard } from '../../ui/StatCard';
import { TripleVerificationPipeline } from './TripleVerificationPipeline';
import { WeekMatrixOverview } from './WeekMatrixOverview';
import { Button } from '../../ui/Button';

function parseBrDate(dateStr: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((dateStr || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

export const DashboardView: React.FC = () => {
  const { donors, bottles, routes, setCurrentView } = useApp();
  const [zoneFilter, setZoneFilter] = useState<'Todas' | ZoneName>('Todas');

  const filteredDonors = useMemo(
    () => (zoneFilter === 'Todas' ? donors : donors.filter((d) => d.zona === zoneFilter)),
    [donors, zoneFilter]
  );

  const filteredBottles = useMemo(
    () => (zoneFilter === 'Todas' ? bottles : bottles.filter((b) => b.zona === zoneFilter)),
    [bottles, zoneFilter]
  );

  const filteredRoutes = useMemo(
    () =>
      routes.filter(
        (r) => r.status !== 'canceled' && (zoneFilter === 'Todas' || r.zone === zoneFilter)
      ),
    [routes, zoneFilter]
  );

  // KPIs reais calculados sobre o escopo filtrado (zero mocks!)
  const metrics = useMemo(() => {
    const aptDonors = filteredDonors.filter(
      (d) => d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
    ).length;
    const pendingDonors = filteredDonors.filter(
      (d) => d.aptidao === 'Pendente' && d.statusCadastro === 'ativa'
    ).length;
    const inaptOrInactive = filteredDonors.filter(
      (d) => d.aptidao === 'Inapta' || d.statusCadastro === 'inativa'
    ).length;

    const totalBottles = filteredBottles.length;
    const totalVolumeMl = filteredBottles.reduce((acc, b) => acc + b.volume, 0);
    const compliantTempCount = filteredBottles.filter((b) => b.temp <= -10).length;
    const thermalDeviationCount = totalBottles - compliantTempCount;
    const avgTemp =
      totalBottles > 0
        ? (filteredBottles.reduce((acc, b) => acc + b.temp, 0) / totalBottles).toFixed(1)
        : null;
    const thermalRate =
      totalBottles > 0 ? Math.round((compliantTempCount / totalBottles) * 100) : null;

    // Coletas e rotas
    const activeRoutes = filteredRoutes.filter((r) => r.status === 'active').length;
    const planningRoutes = filteredRoutes.filter((r) => r.status === 'planning').length;
    const completedRoutes = filteredRoutes.filter((r) => r.status === 'completed').length;

    let scheduledStops = 0;
    let collectedStops = 0;
    let skippedStops = 0;

    filteredRoutes.forEach((r) => {
      scheduledStops += r.donorIds.length;
      if (r.visits && r.visits.length > 0) {
        collectedStops += r.visits.filter((v) => v.status === 'completed').length;
        skippedStops += r.visits.filter((v) => v.status === 'skipped').length;
      } else {
        skippedStops += r.skippedStops?.length ?? 0;
      }
    });
    const pendingStops = Math.max(0, scheduledStops - collectedStops - skippedStops);

    // Frascos crus vencendo em <= 3 dias (prazo ANVISA 15 dias)
    const now = Date.now();
    const expiringSoonBottles = filteredBottles.filter((b) => {
      if (b.statusPast === 'Pasteurizado' || b.statusPast === 'Dispensado' || b.statusPast === 'Descartado') {
        return false;
      }
      const exp = parseBrDate(b.validadeCru);
      if (!exp) return false;
      const daysLeft = Math.ceil((exp.getTime() - now) / (1000 * 60 * 60 * 24));
      return daysLeft <= 3;
    }).length;

    return {
      aptDonors,
      pendingDonors,
      inaptOrInactive,
      totalBottles,
      totalVolumeMl,
      avgTemp,
      thermalRate,
      thermalDeviationCount,
      activeRoutes,
      planningRoutes,
      completedRoutes,
      scheduledStops,
      collectedStops,
      skippedStops,
      pendingStops,
      expiringSoonBottles,
    };
  }, [filteredDonors, filteredBottles, filteredRoutes]);

  // Dados reais para gráfico de distribuição por Zona
  const zoneChartData = useMemo(() => {
    const rows = ZONAS_SEMANA.map((z) => {
      const zBottles = bottles.filter((b) => b.zona === z.zona);
      const vol = zBottles.reduce((acc, b) => acc + b.volume, 0);
      return {
        zona: z.zona,
        cor: z.cor,
        bottles: zBottles.length,
        volumeMl: vol,
      };
    });
    const maxVol = Math.max(1, ...rows.map((r) => r.volumeMl));
    return { rows, maxVol };
  }, [bottles]);

  const operationalAlerts = useMemo(() => {
    const list: { id: string; severity: 'danger' | 'warning'; text: string; actionLabel: string; view: 'accountability' | 'cadastro' | 'roteirizacao' }[] = [];
    if (metrics.expiringSoonBottles > 0) {
      list.push({
        id: 'exp',
        severity: 'danger',
        text: `${metrics.expiringSoonBottles} frasco(s) de leite cru vencendo em até 3 dias (prazo RDC 171 de 15 dias).`,
        actionLabel: 'Priorizar no Laboratório',
        view: 'accountability',
      });
    }
    if (metrics.thermalDeviationCount > 0) {
      list.push({
        id: 'temp',
        severity: 'danger',
        text: `${metrics.thermalDeviationCount} frasco(s) registrado(s) com temperatura acima de -10°C.`,
        actionLabel: 'Inspecionar Frascos',
        view: 'accountability',
      });
    }
    if (metrics.pendingDonors > 0) {
      list.push({
        id: 'soro',
        severity: 'warning',
        text: `${metrics.pendingDonors} doadora(s) aguardando lançamento de laudo sorológico para liberação.`,
        actionLabel: 'Atualizar Sorologias',
        view: 'cadastro',
      });
    }
    if (metrics.skippedStops > 0) {
      list.push({
        id: 'skip',
        severity: 'warning',
        text: `${metrics.skippedStops} parada(s) marcada(s) como não realizada(s) aguardando reagendamento.`,
        actionLabel: 'Ver Rotas',
        view: 'roteirizacao',
      });
    }
    return list;
  }, [metrics]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho Operacional + Filtro Real de Zona */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blh-line shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-0.5 rounded-md">
                LEITE FLOW · Centro Operacional
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  metrics.activeRoutes > 0
                    ? 'text-emerald-900 bg-emerald-100 border-emerald-300'
                    : 'text-blh-slate-700 bg-blh-slate-100 border-blh-slate-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    metrics.activeRoutes > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-blh-slate-400'
                  }`}
                />
                {metrics.activeRoutes > 0
                  ? `${metrics.activeRoutes} rota(s) em trânsito`
                  : 'Nenhuma rota em trânsito agora'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
              Painel Operacional &amp; Logístico — BLH Marília
            </h1>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
              Indicadores em tempo real calculados diretamente do banco de dados de doadoras, coletas, rotas e laboratório.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0 flex-wrap">
            <select
              aria-label="Filtrar painel por zona"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value as 'Todas' | ZoneName)}
              className="text-xs font-bold px-3 py-2 rounded-lg border border-blh-slate-300 bg-white text-blh-slate-800"
            >
              <option value="Todas">Todas as Zonas</option>
              {ZONAS_SEMANA.map((z) => (
                <option key={z.zona} value={z.zona}>
                  Zona {z.zona} ({z.dia})
                </option>
              ))}
            </select>

            <Button
              size="sm"
              onClick={() => setCurrentView('roteirizacao')}
              leftIcon={<Route className="w-4 h-4" />}
              className="font-bold shadow-sm"
            >
              Rotas do Dia
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('mapa')}
              leftIcon={<MapPin className="w-4 h-4" />}
            >
              Mapa
            </Button>
          </div>
        </div>

        {/* Faixa Operacional Real de Rotas e Paradas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-blh-line/60 text-xs">
          <div className="p-2.5 rounded-xl bg-blh-slate-50 border border-blh-line flex items-center justify-between">
            <span className="text-[11px] text-blh-slate-600 font-medium flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blh-primary" /> Rotas:
            </span>
            <span className="font-mono font-bold text-blh-slate-900">
              {metrics.activeRoutes} ativas · {metrics.planningRoutes} plan.
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Coletadas:
            </span>
            <span className="font-mono font-bold text-emerald-900">
              {metrics.collectedStops} / {metrics.scheduledStops}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pendentes:
            </span>
            <span className="font-mono font-bold text-amber-900">{metrics.pendingStops}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
            <span className="text-[11px] text-rose-800 font-medium flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Não Realiz.:
            </span>
            <span className="font-mono font-bold text-rose-900">{metrics.skippedStops}</span>
          </div>
        </div>
      </div>

      {/* Alertas Operacionais Prioritários (somente reais) */}
      {operationalAlerts.length > 0 && (
        <div className="space-y-2">
          {operationalAlerts.map((al) => (
            <div
              key={al.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                al.severity === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${
                    al.severity === 'danger' ? 'text-rose-600' : 'text-amber-600'
                  }`}
                />
                <span>{al.text}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setCurrentView(al.view)}>
                {al.actionLabel}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* KPIs Principais (100% Reais) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          label="Doadoras Aptas"
          value={metrics.aptDonors}
          caption={`${metrics.pendingDonors} pendente(s) de sorologia`}
          variant="success"
          icon={<Users className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Inaptas / Inativas"
          value={metrics.inaptOrInactive}
          caption="Histórico preservado p/ auditoria"
          variant="alert"
          icon={<UserX className="w-4 h-4 text-rose-600" />}
        />
        <StatCard
          label="Frascos Coletados"
          value={metrics.totalBottles}
          caption="Rastreados com código único"
          variant="default"
          icon={<Milk className="w-4 h-4 text-blh-primary" />}
        />
        <StatCard
          label="Volume Coletado"
          value={
            <span className="inline-flex items-baseline">
              <span>{metrics.totalVolumeMl}</span>
              <span className="text-sm font-semibold text-blh-slate-600 ml-1.5 font-sans">mL</span>
            </span>
          }
          caption={`${(metrics.totalVolumeMl / 1000).toFixed(2)} litros acumulados`}
          variant="accent"
          icon={<Droplets className="w-4 h-4 text-blh-accent" />}
        />
        <StatCard
          label="Cadeia de Frio Real"
          value={
            metrics.avgTemp !== null ? (
              <span className="inline-flex items-baseline">
                <span>{metrics.avgTemp}</span>
                <span className="text-sm font-semibold text-blh-slate-600 ml-1.5 font-sans">°C</span>
              </span>
            ) : (
              <span className="text-base font-semibold text-blh-slate-500">Sem medições</span>
            )
          }
          caption={
            metrics.thermalRate !== null
              ? `${metrics.thermalRate}% dentro da norma (≤ -10°C)`
              : 'Registre coletas para aferir'
          }
          variant={metrics.thermalDeviationCount > 0 ? 'alert' : 'warn'}
          icon={<Thermometer className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* Funil Vivo da Cadeia de Custódia */}
      <TripleVerificationPipeline bottles={filteredBottles} aptDonorsCount={metrics.aptDonors} />

      {/* Gráfico Real de Distribuição por Zona */}
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-blh-line pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blh-primary" />
            <div>
              <h2 className="text-base font-serif font-bold text-blh-slate-900">
                Distribuição Geográfica de Volume Coletado (Marília)
              </h2>
              <p className="text-xs text-blh-slate-500">
                Volume total (mL) e quantidade de frascos por zona operacional.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {zoneChartData.rows.map((row) => {
            const pct = row.volumeMl > 0 ? Math.max(4, Math.round((row.volumeMl / zoneChartData.maxVol) * 100)) : 0;
            return (
              <div key={row.zona} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blh-slate-800">Zona {row.zona}</span>
                  <span className="font-mono text-blh-slate-600">
                    <strong className="text-blh-slate-900">{row.volumeMl} mL</strong> ({row.bottles}{' '}
                    {row.bottles === 1 ? 'frasco' : 'frascos'})
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-blh-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: row.cor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matriz Operacional Semanal */}
      <WeekMatrixOverview />
    </div>
  );
};
