import React from 'react';
import { 
  Route, 
  MapPin, 
  Tag, 
  UserPlus, 
  LayoutDashboard, 
  Menu
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { ViewMode } from '../../types/common';

interface BottomNavProps {
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMobileMenu }) => {
  const { currentView, setCurrentView, currentZoneStops, stats } = useApp();

  const navItems = [
    {
      id: 'roteirizacao' as ViewMode,
      label: 'Rotas',
      badge: currentZoneStops.length > 0 ? `${currentZoneStops.length}` : null,
      icon: <Route className="w-5 h-5" />,
    },
    {
      id: 'mapa' as ViewMode,
      label: 'Mapa',
      badge: null,
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      id: 'cadastro' as ViewMode,
      label: 'Doadoras',
      badge: null,
      icon: <UserPlus className="w-5 h-5" />,
    },
    {
      id: 'etiquetas' as ViewMode,
      label: 'Frascos',
      badge: stats.totalBottles > 0 ? `${stats.totalBottles}` : null,
      icon: <Tag className="w-5 h-5" />,
    },
    {
      id: 'visao' as ViewMode,
      label: 'Painel',
      badge: null,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
  ];

  return (
    <nav 
      aria-label="Navegação móvel"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-blh-line pb-safe shadow-elevation transition-all duration-200"
    >
      <div className="grid grid-cols-6 items-center px-1.5 py-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentView(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 select-none ${
                isActive
                  ? 'text-blh-primary font-bold'
                  : 'text-blh-slate-500 hover:text-blh-slate-800 font-medium'
              }`}
            >
              {/* Active Highlight Pill */}
              {isActive && (
                <span className="absolute inset-0 bg-blh-primary-soft/80 rounded-xl -z-10 animate-scaleIn" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[16px] h-4 bg-emerald-600 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-0.5 truncate ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu / Mais Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-blh-slate-500 hover:text-blh-slate-800 transition-all duration-150 active:scale-90 select-none"
          aria-label="Abrir menu completo"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
};
