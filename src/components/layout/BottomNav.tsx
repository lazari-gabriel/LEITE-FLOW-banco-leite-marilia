import React from 'react';
import {
  Route,
  MapPin,
  Tag,
  UserPlus,
  LayoutDashboard,
  Menu,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../context/AuthContext';
import { ViewMode } from '../../types/common';
import { MOTION_SPRING } from '../../lib/motion';

interface BottomNavProps {
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMobileMenu }) => {
  const { currentView, setCurrentView, currentZoneStops, stats } = useApp();
  const { hasRole } = useAuth();

  const navItems = [
    {
      id: 'visao' as ViewMode,
      label: 'Painel',
      badge: null,
      icon: <LayoutDashboard className="w-5 h-5" />,
      allowed: true,
    },
    {
      id: 'roteirizacao' as ViewMode,
      label: 'Rotas',
      badge: currentZoneStops.length > 0 ? `${currentZoneStops.length}` : null,
      icon: <Route className="w-5 h-5" />,
      allowed: true,
    },
    {
      id: 'mapa' as ViewMode,
      label: 'Mapa',
      badge: null,
      icon: <MapPin className="w-5 h-5" />,
      allowed: true,
    },
    {
      id: 'cadastro' as ViewMode,
      label: 'Doadoras',
      badge: null,
      icon: <UserPlus className="w-5 h-5" />,
      allowed: hasRole('ADMIN', 'COORDENADOR_BLH'),
    },
    {
      id: 'etiquetas' as ViewMode,
      label: 'Frascos',
      badge: stats.totalBottles > 0 ? `${stats.totalBottles}` : null,
      icon: <Tag className="w-5 h-5" />,
      allowed: true,
    },
  ].filter((item) => item.allowed);

  return (
    <nav
      aria-label="Navegação móvel"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-blh-line pb-safe shadow-elevation"
    >
      <div
        className={`grid ${navItems.length === 5 ? 'grid-cols-6' : 'grid-cols-5'} items-center px-1.5 py-1 max-w-md mx-auto`}
      >
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.9 }}
              transition={MOTION_SPRING.tap}
              onClick={() => setCurrentView(item.id)}
              className={`relative isolate flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors duration-150 select-none ${
                isActive
                  ? 'text-blh-primary font-bold'
                  : 'text-blh-slate-500 hover:text-blh-slate-800 font-medium'
              }`}
            >
              {/* Active Highlight Pill com layoutId deslizante */}
              {isActive && (
                <motion.span
                  layoutId="bottomnav-active-pill"
                  transition={MOTION_SPRING.snappy}
                  className="absolute inset-0 bg-blh-primary-soft/90 rounded-xl -z-10 border border-blh-primary/15"
                />
              )}

              {/* Icon Container with Badge */}
              <motion.div
                animate={{ y: isActive ? -1 : 0 }}
                transition={MOTION_SPRING.snappy}
                className="relative"
              >
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[16px] h-4 bg-emerald-600 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </motion.div>

              <span className={`text-[10px] tracking-tight mt-0.5 truncate ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}

        {/* Menu / Mais Drawer Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={MOTION_SPRING.tap}
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-blh-slate-500 hover:text-blh-slate-800 transition-colors duration-150 select-none"
          aria-label="Abrir menu completo"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">
            Menu
          </span>
        </motion.button>
      </div>
    </nav>
  );
};
