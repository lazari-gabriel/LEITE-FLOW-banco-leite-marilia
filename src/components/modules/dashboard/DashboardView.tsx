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
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../../hooks/useApp';
import { ZoneName } from '../../../types/donor';
import { ZONAS_SEMANA } from '../../../constants/zones';
import { StatCard } from '../../ui/StatCard';
import { TripleVerificationPipeline } from './TripleVerificationPipeline';
import { WeekMatrixOverview } from './WeekMatrixOverview';
import { Button } from '../../ui/Button';
import {
  AnimatedCounter,
  DashboardSkeleton,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from '../../motion';
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING, MOTION_VIEWPORT } from '../../../lib/motion';

function parseBrDate(dateStr: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((dateStr || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

export const DashboardView: React.FC = () => {
  const { donors, bottles, routes, setCurrentView, isDataLoading } = useApp();
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
    const avgTempNum =
      totalBottles > 0
        ? filteredBottles.reduce((acc, b) => acc + b.temp, 0) / totalBottles
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
      avgTempNum,
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
    const totalVol = rows.reduce((acc, r) => acc + r.volumeMl, 0);
    return { rows, maxVol, totalVol };
  }, [bottles]);

  const operationalAlerts = useMemo(() => {
    const list: {
      id: string;
      severity: 'danger' | 'warning';
      text: string;
      actionLabel: string;
      view: 'accountability' | 'cadastro' | 'roteirizacao';
    }[] = [];
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

  if (isDataLoading && donors.length === 0 && routes.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho Operacional + Filtro Real de Zona */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.outExpo }}
        className="relative overflow-hidden bg-white p-5 sm:p-6 rounded-2xl border border-blh-line shadow-card space-y-4"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blh-primary via-emerald-500 to-blh-primary-light"
        />

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
                  ? metrics.activeRoutes === 1
                    ? '1 rota em trânsito'
                    : `${metrics.activeRoutes} rotas em trânsito`
                  : 'Nenhuma rota em trânsito agora'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
              Painel Operacional &amp; Logístico — BLH Marília
            </h1>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
              Acompanhe em tempo real doadoras, coletas, rotas e o processamento laboratorial do Banco de Leite.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0 flex-wrap">
            <select
              aria-label="Filtrar painel por zona"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value as 'Todas' | ZoneName)}
              className="text-xs font-bold px-3 py-2 rounded-lg border border-blh-slate-300 bg-white text-blh-slate-800 hover:border-blh-primary focus:outline-none focus:ring-2 focus:ring-blh-primary/30 transition-colors cursor-pointer"
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

        {/* Faixa Operacional Real de Rotas e Paradas com Stagger */}
        <StaggerContainer
          staggerDelay={0.045}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-blh-line/60 text-xs"
        >
          <StaggerItem yOffset={8}>
            <div className="p-2.5 rounded-xl bg-blh-slate-50 border border-blh-line hover:border-blh-line-strong transition-colors flex items-center justify-between gap-2">
              <span className="text-[11px] text-blh-slate-600 font-medium flex items-center gap-1.5 shrink-0">
                <Truck className="w-3.5 h-3.5 text-blh-primary" /> Rotas:
              </span>
              <span className="font-mono font-bold text-blh-slate-900 tabular-nums text-right">
                <AnimatedCounter value={metrics.activeRoutes} />{' '}
                {metrics.activeRoutes === 1 ? 'ativa' : 'ativas'} ·{' '}
                <AnimatedCounter value={metrics.planningRoutes} />{' '}
                {metrics.planningRoutes === 1 ? 'planejada' : 'planejadas'}
              </span>
            </div>
          </StaggerItem>
          <StaggerItem yOffset={8}>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 hover:border-emerald-300 transition-colors flex items-center justify-between gap-2">
              <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Coletadas:
              </span>
              <span className="font-mono font-bold text-emerald-900 tabular-nums">
                <AnimatedCounter value={metrics.collectedStops} /> /{' '}
                <AnimatedCounter value={metrics.scheduledStops} />
              </span>
            </div>
          </StaggerItem>
          <StaggerItem yOffset={8}>
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:border-amber-300 transition-colors flex items-center justify-between gap-2">
              <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pendentes:
              </span>
              <span className="font-mono font-bold text-amber-900 tabular-nums">
                <AnimatedCounter value={metrics.pendingStops} />
              </span>
            </div>
          </StaggerItem>
          <StaggerItem yOffset={8}>
            <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 hover:border-rose-300 transition-colors flex items-center justify-between gap-2">
              <span className="text-[11px] text-rose-800 font-medium flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 shrink-0" /> Não realizadas:
              </span>
              <span className="font-mono font-bold text-rose-900 tabular-nums">
                <AnimatedCounter value={metrics.skippedStops} />
              </span>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </motion.div>

      {/* Alertas Operacionais Prioritários (somente reais) */}
      <AnimatePresence initial={false}>
        {operationalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: MOTION_EASE.outExpo }}
            className="space-y-2"
          >
            {operationalAlerts.map((al, idx) => (
              <motion.div
                key={al.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{
                  duration: 0.26,
                  delay: idx * 0.05,
                  ease: MOTION_EASE.outExpo,
                }}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-sm ${
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIs Principais com Stagger Animation & Animated Counters */}
      <StaggerContainer
        staggerDelay={0.055}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4"
      >
        <StaggerItem>
          <StatCard
            label="Doadoras Aptas"
            value={<AnimatedCounter value={metrics.aptDonors} />}
            caption={
              metrics.pendingDonors === 1
                ? '1 pendente de sorologia'
                : `${metrics.pendingDonors} pendentes de sorologia`
            }
            variant="success"
            icon={<Users className="w-4 h-4 text-emerald-600" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Inaptas / Inativas"
            value={<AnimatedCounter value={metrics.inaptOrInactive} />}
            caption="Histórico preservado para auditoria"
            variant="alert"
            icon={<UserX className="w-4 h-4 text-rose-600" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Frascos Coletados"
            value={<AnimatedCounter value={metrics.totalBottles} />}
            caption="Rastreados com código único"
            variant="default"
            icon={<Milk className="w-4 h-4 text-blh-primary" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Volume Coletado"
            value={
              <span className="inline-flex items-baseline">
                <AnimatedCounter value={metrics.totalVolumeMl} localeFormat />
                <span className="text-sm font-semibold text-blh-slate-600 ml-1.5 font-sans">
                  mL
                </span>
              </span>
            }
            caption={`${(metrics.totalVolumeMl / 1000).toFixed(2)} litros acumulados`}
            variant="accent"
            icon={<Droplets className="w-4 h-4 text-blh-accent" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Temperatura de Transporte"
            value={
              metrics.avgTempNum !== null ? (
                <span className="inline-flex items-baseline">
                  <AnimatedCounter value={metrics.avgTempNum} decimals={1} />
                  <span className="text-sm font-semibold text-blh-slate-600 ml-1.5 font-sans">
                    °C
                  </span>
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
        </StaggerItem>
      </StaggerContainer>

      {/* Funil Vivo da Cadeia de Custódia */}
      <TripleVerificationPipeline bottles={filteredBottles} aptDonorsCount={metrics.aptDonors} />

      {/* Gráfico Real de Distribuição por Zona com Animação de Preenchimento */}
      <ScrollReveal>
        <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blh-line pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blh-primary-soft flex items-center justify-center text-blh-primary shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-blh-slate-900">
                  Distribuição Geográfica de Volume Coletado (Marília)
                </h2>
                <p className="text-xs text-blh-slate-500">
                  Volume total (mL) e quantidade de frascos por zona operacional. Clique numa zona para filtrar.
                </p>
              </div>
            </div>
            {zoneFilter !== 'Todas' && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={MOTION_SPRING.tap}
                onClick={() => setZoneFilter('Todas')}
                className="text-xs font-bold text-blh-primary bg-blh-primary-soft px-3 py-1 rounded-full border border-blh-primary/20 self-start sm:self-center hover:bg-blh-primary hover:text-white transition-colors"
              >
                Filtro: Zona {zoneFilter} ✕
              </motion.button>
            )}
          </div>

          <div className="space-y-3">
            {zoneChartData.rows.map((row, idx) => {
              const pct =
                row.volumeMl > 0
                  ? Math.max(4, Math.round((row.volumeMl / zoneChartData.maxVol) * 100))
                  : 0;
              const sharePct =
                zoneChartData.totalVol > 0
                  ? Math.round((row.volumeMl / zoneChartData.totalVol) * 100)
                  : 0;
              const isSelectedZone = zoneFilter === row.zona;

              return (
                <motion.button
                  key={row.zona}
                  type="button"
                  onClick={() =>
                    setZoneFilter((prev) => (prev === row.zona ? 'Todas' : row.zona))
                  }
                  whileHover={{ x: 2 }}
                  transition={MOTION_SPRING.tap}
                  className={`w-full text-left p-2.5 -mx-2.5 rounded-xl transition-colors space-y-1.5 group ${
                    isSelectedZone
                      ? 'bg-blh-primary-soft/60 ring-1 ring-blh-primary/25'
                      : 'hover:bg-blh-slate-50/90'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-blh-slate-800 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: row.cor }}
                      />
                      <span>Zona {row.zona}</span>
                      {sharePct > 0 && (
                        <span className="text-[10px] font-mono font-semibold text-blh-slate-500 bg-blh-slate-100 px-1.5 py-0.5 rounded">
                          {sharePct}%
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-blh-slate-600 tabular-nums">
                      <strong className="text-blh-slate-900">
                        <AnimatedCounter value={row.volumeMl} localeFormat /> mL
                      </strong>{' '}
                      (<AnimatedCounter value={row.bottles} />{' '}
                      {row.bottles === 1 ? 'frasco' : 'frascos'})
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-blh-slate-100 overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-full relative overflow-hidden"
                      style={{ backgroundColor: row.cor }}
                      initial={{ width: '0%' }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={MOTION_VIEWPORT}
                      transition={{
                        duration: MOTION_DURATION.chart,
                        delay: idx * 0.07,
                        ease: MOTION_EASE.outExpo,
                      }}
                    >
                      {pct > 0 && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                      )}
                    </motion.div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* Matriz Operacional Semanal */}
      <WeekMatrixOverview />
    </div>
  );
};
