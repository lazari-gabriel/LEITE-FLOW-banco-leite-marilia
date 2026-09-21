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
  HeartHandshake
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
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
  const { currentView, setCurrentView, currentZoneStops, stats } = useApp();

  const navItems = [
    {
      id: 'roteirizacao' as ViewMode,
      label: 'Rotas de Coleta',
      badge: `${currentZoneStops.length} Paradas`,
      badgeColor: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-bold',
      icon: <Route className="w-5 h-5 shrink-0" />
    },
    {
      id: 'mapa' as ViewMode,
      label: 'Mapa da Região',
      badge: 'Marília',
      badgeColor: 'bg-teal-950/70 text-teal-300 border border-teal-500/40',
      icon: <MapPin className="w-5 h-5 shrink-0" />
    },
    {
      id: 'etiquetas' as ViewMode,
      label: 'Etiquetas dos Frascos',
      badge: `${stats.totalBottles}`,
      badgeColor: 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 font-mono',
      icon: <Tag className="w-5 h-5 shrink-0" />
    },
    {
      id: 'cadastro' as ViewMode,
      label: 'Cadastrar Doadora',
      badge: null,
      icon: <UserCheck className="w-5 h-5 shrink-0" />
    },
    {
      id: 'visao' as ViewMode,
      label: 'Painel Geral',
      badge: null,
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />
    },
    {
      id: 'accountability' as ViewMode,
      label: 'Controle de Frascos',
      badge: null,
      icon: <ShieldCheck className="w-5 h-5 shrink-0" />
    }
  ];

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
        <div className="p-5 border-b border-blh-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-blh-primary flex items-center justify-center text-white shadow-md shrink-0">
              <Milk className="w-5 h-5 stroke-[2.2]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <h1 className="font-serif font-bold text-base leading-tight text-white tracking-wide truncate">
                  LEITE FLOW
                </h1>
                <p className="text-[11px] text-emerald-400 font-medium tracking-wider uppercase truncate">
                  Coleta &amp; Vida
                </p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-blh-slate-400 hover:text-white hover:bg-blh-slate-800 transition-colors"
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

        {/* Status da Van em Campo */}
        {!isCollapsed && (
          <div className="p-3.5 mx-3 mb-3 rounded-lg bg-blh-slate-800/70 border border-blh-slate-700/60 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <Truck className="w-4 h-4 shrink-0" />
              <span>Van em Operação</span>
            </div>
            <p className="text-blh-slate-300 text-[11px] truncate">
              {LEITE_FLOW.van.model}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-blh-slate-700/50 text-[10px] text-blh-slate-400">
              <span>Temperatura</span>
              <span className="text-emerald-400 font-mono font-bold">-17.2 °C ✓</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-blh-slate-800 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0 px-1">
              <div className="w-8 h-8 rounded-full bg-blh-slate-800 border border-blh-slate-700 flex items-center justify-center font-serif text-xs font-bold text-emerald-400 shrink-0">
                LF
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{LEITE_FLOW.hospitalName}</p>
                <p className="text-[10px] text-blh-slate-400 truncate">Banco de Leite de Marília</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-blh-slate-800 border border-blh-slate-700 flex items-center justify-center font-serif text-xs font-bold text-emerald-400">
                LF
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-md text-blh-slate-400 hover:text-white hover:bg-blh-slate-800 transition-colors"
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
