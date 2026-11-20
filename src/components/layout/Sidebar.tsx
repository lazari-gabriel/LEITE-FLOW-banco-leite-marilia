import React from 'react';
import { 
  Route, 
  MapPin, 
  Tag, 
  UserCheck, 
  LayoutDashboard, 
  ShieldCheck, 
  Milk, 
  ChevronLeft, 
  ChevronRight,
  X,
  Truck,
  LogOut
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useAuth, UserRole } from '../../context/AuthContext';
import { ViewMode } from '../../types/common';
import { LEITE_FLOW } from '../../constants/blh';

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
  setIsMobileOpen
}) => {
  const { currentView, setCurrentView, currentZoneStops, stats, routeAssignment, routeMetrics } = useApp();
  const { user, logout, hasRole } = useAuth();

  const roleLabels: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    COORDENADOR_BLH: 'Coordenação BLH',
    COLETOR_CAMPO: 'Coleta Externa',
    LABORATORIO: 'Laboratório BLH',
  };

  const navItems = [
    {
      id: 'roteirizacao' as ViewMode,
      label: 'Rotas de Coleta',
      badge: `${currentZoneStops.length} Paradas`,
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
      badge: null,
      icon: <UserCheck className="w-5 h-5 shrink-0" />,
      allowed: hasRole('ADMIN', 'COORDENADOR_BLH'),
    },
    {
      id: 'visao' as ViewMode,
      label: 'Painel Geral',
      badge: null,
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      allowed: true,
    },
    {
      id: 'accountability' as ViewMode,
      label: 'Laboratório & Frascos',
      badge: null,
      icon: <ShieldCheck className="w-5 h-5 shrink-0" />,
      allowed: true,
    }
  ].filter((item) => item.allowed);

  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-blh-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-blh-slate-900 text-slate-100 flex flex-col border-r border-blh-slate-800 transition-all duration-300 shadow-xl
          ${isCollapsed ? 'w-20' : 'w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-blh-slate-800 flex items-center justify-between">
          <div 
            onClick={() => handleNavigate('roteirizacao')}
            className="flex items-center gap-3 min-w-0 cursor-pointer group"
          >
            {isCollapsed ? (
              <img
                src="/logo-circle-white.png"
                alt="LEITE FLOW"
                className="w-10 h-10 object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/logo-circle-white.png"
                  alt="LEITE FLOW"
                  className="w-10 h-10 object-contain shrink-0 drop-shadow-md group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 truncate">
                  <h1 className="font-serif font-black text-base leading-tight text-white tracking-wide truncate">
                    LEITE FLOW
                  </h1>
                  <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase truncate">
                    Hosp. Materno Infantil
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-blh-slate-400 hover:text-white hover:bg-blh-slate-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blh-slate-500">
              Menu de Acesso
            </div>
          )}

          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all group relative
                  ${isActive 
                    ? 'bg-blh-primary text-white shadow-sm' 
                    : 'text-blh-slate-400 hover:text-slate-100 hover:bg-blh-slate-800/80'
                  }
                  ${isCollapsed ? 'justify-center px-0' : ''}
                `}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-emerald-400 rounded-r-full" />
                )}

                {item.icon}

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Status da Van & Telemetria de Frota */}
        {!isCollapsed && (
          <div className="p-3.5 mx-3 mb-3 rounded-xl bg-gradient-to-b from-blh-slate-800 to-blh-slate-900 border border-blh-slate-800 shadow-hud text-xs space-y-2.5">
            {/* Status Live */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  {routeAssignment?.status === 'active' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    routeAssignment?.status === 'active'
                      ? 'bg-emerald-500'
                      : routeAssignment?.status === 'completed'
                      ? 'bg-sky-500'
                      : 'bg-blh-slate-500'
                  }`} />
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
                <span className="text-blh-slate-400 block text-[9px] uppercase font-bold tracking-wider">Média Caixa</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">
                  {stats.totalBottles > 0 ? `${stats.averageTemp} °C` : 'Sem aferição'}
                </span>
              </div>
              <div className="bg-blh-slate-900/60 p-1.5 rounded-lg border border-blh-slate-800">
                <span className="text-blh-slate-400 block text-[9px] uppercase font-bold tracking-wider">Percurso Est.</span>
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
        )}

        {/* Footer — Usuário Autenticado & Logout */}
        <div className="p-3 border-t border-blh-slate-800 flex items-center justify-between gap-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0 px-1 flex-1">
              <div className="w-8 h-8 rounded-full bg-blh-slate-800 border border-blh-slate-700 flex items-center justify-center font-serif text-xs font-bold text-emerald-400 shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'LF'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {user?.name || LEITE_FLOW.hospitalName}
                </p>
                <p className="text-[10px] text-emerald-400 truncate">
                  {user ? roleLabels[user.role] : 'Banco de Leite de Marília'}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-blh-slate-800 border border-blh-slate-700 flex items-center justify-center font-serif text-xs font-bold text-emerald-400">
                {user?.name?.charAt(0).toUpperCase() || 'LF'}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => void logout()}
              className="p-1.5 rounded-md text-blh-slate-400 hover:text-rose-300 hover:bg-blh-slate-800 transition-colors"
              title="Sair do sistema"
              aria-label="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-md text-blh-slate-400 hover:text-white hover:bg-blh-slate-800 transition-colors"
              title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
