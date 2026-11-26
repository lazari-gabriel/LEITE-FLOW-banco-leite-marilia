import React from 'react';
import {
  Route,
  MapPin,
  Tag,
  UserCheck,
  LayoutDashboard,
  ShieldCheck,
  ChevronLeft,
  X,
  Truck,
  LogOut,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../hooks/useApp';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useDonorInterestsSummary } from '../../hooks/useDonorInterestsSummary';
import { ViewMode } from '../../types/common';
import { LEITE_FLOW } from '../../constants/blh';
import { MOTION_EASE, MOTION_SPRING } from '../../lib/motion';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { currentView, setCurrentView, currentZoneStops, stats, routeAssignment, routeMetrics } = useApp();
  const { user, logout, hasRole } = useAuth();
  const { data: interestSummary } = useDonorInterestsSummary();
  const newInterestsCount = interestSummary?.totalNew ?? 0;

  const roleLabels: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    COORDENADOR_BLH: 'Coordenação BLH',
    COLETOR_CAMPO: 'Coleta Externa',
    LABORATORIO: 'Laboratório BLH',
  };

  const navItems = [
    {
      id: 'visao' as ViewMode,
      label: 'Painel Geral',
      badge: null,
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      allowed: true,
    },
    {
      id: 'roteirizacao' as ViewMode,
      label: 'Rotas de Coleta',
      badge: `${currentZoneStops.length} ${currentZoneStops.length === 1 ? 'Parada' : 'Paradas'}`,
      badgeColor: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-bold',
      icon: <Route className="w-5 h-5 shrink-0" />,
      allowed: true,
    },
    {
      id: 'mapa' as ViewMode,
      label: 'Mapa da Região',
      badge: 'Marília',
      badgeColor: 'bg-teal-950/70 text-teal-300 border border-teal-500/40',
      icon: <MapPin className="w-5 h-5 shrink-0" />,
      allowed: true,
    },
    {
      id: 'etiquetas' as ViewMode,
      label: 'Etiquetas dos Frascos',
      badge: `${stats.totalBottles}`,
      badgeColor: 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 font-mono',
      icon: <Tag className="w-5 h-5 shrink-0" />,
      allowed: true,
    },
    {
      id: 'cadastro' as ViewMode,
      label: 'Doadoras & Triagem',
      badge:
        newInterestsCount > 0
          ? `${newInterestsCount} ${newInterestsCount === 1 ? 'nova' : 'novas'}`
          : null,
      badgeColor: 'bg-amber-950/80 text-amber-300 border border-amber-500/50 font-bold',
      icon: <UserCheck className="w-5 h-5 shrink-0" />,
      allowed: hasRole('ADMIN', 'COORDENADOR_BLH'),
    },
    {
      id: 'accountability' as ViewMode,
      label: 'Laboratório & Frascos',
      badge: null,
      icon: <ShieldCheck className="w-5 h-5 shrink-0" />,
      allowed: true,
    },
  ].filter((item) => item.allowed);

  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
    setIsMobileOpen(false);
  };

  // No mobile o drawer sempre abre na largura completa; o modo recolhido aplica-se ao desktop (lg+)
  const hideLabelsDesktop = isCollapsed
    ? 'lg:opacity-0 lg:-translate-x-2 lg:pointer-events-none'
    : 'opacity-100 translate-x-0';

  return (
    <>
      {/* Mobile Backdrop com blur e fade suave */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: MOTION_EASE.smooth }}
            className="fixed inset-0 bg-blh-slate-950/65 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container — curva expo sincronizada com AppShell, sem saltos de layout */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-blh-slate-900 text-slate-100 flex flex-col border-r border-blh-slate-800 shadow-2xl overflow-hidden will-change-[transform,width] transition-[transform,width] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)]
          w-72 ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header — logo fixo a 20px da esquerda (centro exato de w-20 = 80px) */}
        <div className="px-5 py-4 border-b border-blh-slate-800 flex items-center justify-between gap-2 shrink-0">
          <motion.div
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            transition={MOTION_SPRING.tap}
            onClick={() => handleNavigate('visao')}
            className="flex items-center gap-3 min-w-0 cursor-pointer group"
          >
            <img
              src="/logo-circle-white.png"
              alt="LEITE FLOW"
              className="w-10 h-10 object-contain shrink-0 drop-shadow-md group-hover:scale-105 transition-transform duration-200"
            />
            <div
              className={`min-w-0 whitespace-nowrap transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${hideLabelsDesktop}`}
            >
              <h1 className="font-serif font-black text-base leading-tight text-white tracking-wide truncate">
                LEITE FLOW
              </h1>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase truncate">
                Hospital Materno Infantil
              </p>
            </div>
          </motion.div>

          {/* Close button on mobile */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-blh-slate-400 hover:text-white hover:bg-blh-slate-800 transition-colors shrink-0"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Navigation Links — ícones fixos em pl-[18px] (centro exato no rail de 80px, zero salto horizontal) */}
        <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1.5 no-scrollbar">
          {/* Altura reservada para evitar salto vertical dos ícones ao recolher/expandir */}
          <div
            aria-hidden={isCollapsed}
            className={`px-3 h-6 flex items-center text-[10px] font-bold uppercase tracking-wider text-blh-slate-500 whitespace-nowrap transition-[opacity,transform] duration-200 ease-out ${hideLabelsDesktop}`}
          >
            Navegação
          </div>

          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                whileHover={isActive ? undefined : { x: isCollapsed ? 0 : 2 }}
                whileTap={{ scale: 0.985 }}
                transition={MOTION_SPRING.tap}
                className={`w-full flex items-center gap-3 pl-[18px] pr-3 py-3 rounded-lg text-sm font-medium transition-colors duration-150 group relative isolate overflow-hidden
                  ${isActive
                    ? 'text-white'
                    : 'text-blh-slate-400 hover:text-slate-100 hover:bg-blh-slate-800/70'
                  }
                `}
              >
                {/* Sliding Active Background Pill */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    transition={MOTION_SPRING.snappy}
                    className="absolute inset-0 bg-blh-primary rounded-lg shadow-sm -z-10 border border-emerald-400/20"
                  />
                )}

                {/* Sliding Emerald Active Indicator Bar (sem CSS transform para não conflitar com layoutId) */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    transition={MOTION_SPRING.snappy}
                    className="absolute left-0 inset-y-0 my-auto w-1 h-7 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.75)]"
                  />
                )}

                <span
                  className={`shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                >
                  {item.icon}
                </span>

                <div
                  className={`flex-1 flex items-center justify-between gap-2 min-w-0 text-left whitespace-nowrap transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${hideLabelsDesktop}`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-105 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </nav>

        {/* Status da Van & Telemetria de Frota — recolhimento suave por altura + opacidade */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
            isCollapsed ? 'lg:grid-rows-[0fr] lg:opacity-0' : 'grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-3.5 mx-3 mb-3 rounded-xl bg-gradient-to-b from-blh-slate-800 to-blh-slate-900 border border-blh-slate-800 shadow-hud text-xs space-y-2.5 min-w-[230px]">
              {/* Status Live */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    {routeAssignment?.status === 'active' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        routeAssignment?.status === 'active'
                          ? 'bg-emerald-500'
                          : routeAssignment?.status === 'completed'
                          ? 'bg-sky-500'
                          : 'bg-blh-slate-500'
                      }`}
                    />
                  </span>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-slate-200 truncate">
                    {routeAssignment
                      ? `${routeAssignment.code} · ${
                          routeAssignment.status === 'active'
                            ? 'Em Campo'
                            : routeAssignment.status === 'completed'
                            ? 'Concluída'
                            : 'Planejada'
                        }`
                      : 'Sem rota ativa'}
                  </span>
                </div>
                {routeAssignment?.vehiclePlate && (
                  <span className="font-mono text-[10px] font-semibold text-emerald-400/90 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40 shrink-0">
                    {routeAssignment.vehiclePlate}
                  </span>
                )}
              </div>

              {/* Veículo & Modelo */}
              <div className="text-[11px] text-blh-slate-300 font-medium truncate flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blh-slate-400 shrink-0" />
                <span className="truncate">{routeAssignment?.vehicleName || 'Nenhum veículo escalado'}</span>
              </div>

              {/* Telemetria Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blh-slate-800/80 text-[10px]">
                <div className="bg-blh-slate-900/60 p-1.5 rounded-lg border border-blh-slate-800">
                  <span className="text-blh-slate-400 block text-[9px] uppercase font-bold tracking-wider">Temp. média</span>
                  <span className="text-emerald-400 font-mono font-bold text-xs">
                    {stats.totalBottles > 0 ? `${stats.averageTemp} °C` : 'Sem aferição'}
                  </span>
                </div>
                <div className="bg-blh-slate-900/60 p-1.5 rounded-lg border border-blh-slate-800">
                  <span className="text-blh-slate-400 block text-[9px] uppercase font-bold tracking-wider">Percurso</span>
                  <span className="text-slate-200 font-mono font-bold text-xs">{routeMetrics.distanceKm.toFixed(1)} km</span>
                </div>
              </div>

              {/* Tripulação da Missão */}
              <div className="pt-2 border-t border-blh-slate-800/80 text-[10px] space-y-1">
                <div className="flex items-center justify-between text-blh-slate-400">
                  <span>Condutor:</span>
                  <span className="text-slate-300 font-medium truncate max-w-[120px]">
                    {routeAssignment?.driverName || 'Não escalado'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-blh-slate-400">
                  <span>Coletor(a):</span>
                  <span className="text-slate-300 font-medium truncate max-w-[120px]">
                    {routeAssignment?.collectorName || 'Não escalado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — Usuário Autenticado, Logout & Recolher */}
        <div className="px-3 py-3 border-t border-blh-slate-800 shrink-0">
          <div className={`flex items-center gap-2 ${isCollapsed ? 'lg:flex-col lg:justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'lg:justify-center' : 'px-1 flex-1'}`}>
              <div className="w-8 h-8 rounded-full bg-blh-slate-800 border border-blh-slate-700 flex items-center justify-center font-serif text-xs font-bold text-emerald-400 shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'LF'}
              </div>
              <div
                className={`min-w-0 flex-1 whitespace-nowrap transition-[opacity,transform] duration-200 ${
                  isCollapsed ? 'lg:hidden' : 'opacity-100'
                }`}
              >
                <p className="text-xs font-medium text-slate-200 truncate">
                  {user?.name || LEITE_FLOW.hospitalName}
                </p>
                <p className="text-[10px] text-emerald-400 truncate">
                  {user ? roleLabels[user.role] : 'Banco de Leite de Marília'}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-1 shrink-0 ${isCollapsed ? 'lg:flex-col' : ''}`}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => void logout()}
                className="p-1.5 rounded-md text-blh-slate-400 hover:text-rose-300 hover:bg-blh-slate-800 transition-colors"
                title="Sair do sistema"
                aria-label="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-md text-blh-slate-400 hover:text-white hover:bg-blh-slate-800 transition-colors"
                title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              >
                <motion.span
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: MOTION_EASE.outExpo }}
                  className="flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.span>
              </motion.button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
