import React, { useState, useEffect } from 'react';
import { Menu, Clock, PlusCircle, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { MOTION_EASE, MOTION_SPRING } from '../../lib/motion';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { currentView, setCurrentView, stats } = useApp();
  const { hasRole } = useAuth();
  const canManageDonors = hasRole('ADMIN', 'COORDENADOR_BLH');
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentDateTime(`${dateStr} · ${timeStr}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const breadcrumbMap: Record<string, string> = {
    visao: 'Painel Geral',
    cadastro: 'Cadastro de Doadoras',
    roteirizacao: 'Rotas de Coleta do Dia',
    mapa: 'Mapa das Rotas',
    etiquetas: 'Etiquetas dos Frascos',
    accountability: 'Controle de Frascos',
  };

  const currentTitle = breadcrumbMap[currentView] || 'Painel';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-blh-line px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Menu & Official Brand Logo */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={MOTION_SPRING.tap}
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 rounded-lg text-blh-slate-600 hover:text-blh-slate-900 hover:bg-blh-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blh-primary"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        {/* Logo Oficial Leite Flow */}
        <Logo
          variant="responsive"
          size="sm"
          onClick={() => setCurrentView('roteirizacao')}
          className="cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
        />

        <div className="hidden md:flex items-center gap-2 text-xs text-blh-slate-400 min-w-0 border-l border-blh-line pl-3 overflow-hidden h-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={currentView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: MOTION_EASE.outExpo }}
              className="font-bold text-blh-slate-800 truncate"
            >
              {currentTitle}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Operational Status, Live Clock & Quick Action */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Cold Chain Real Average Badge */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-900 text-[11px] sm:text-xs font-semibold tabular-nums shadow-sm transition-colors hover:border-sky-300">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-700 shrink-0 hidden sm:inline" />
          <span className="hidden sm:inline">Média Caixa: </span>
          <strong className="font-mono text-sky-950 font-bold whitespace-nowrap">
            {stats.totalBottles > 0 ? `${stats.averageTemp}°C` : 'Sem aferição'}
          </strong>
          {stats.totalBottles > 0 && Number(stats.averageTemp) <= -10 && (
            <span className="hidden md:inline text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300">
              ANVISA ✓
            </span>
          )}
        </div>

        {/* Live Operational Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blh-slate-100 border border-blh-slate-200 text-blh-slate-800 text-xs font-mono font-medium tabular-nums shadow-sm">
          <Clock className="w-3.5 h-3.5 text-blh-slate-500 shrink-0" />
          <span>{currentDateTime}</span>
        </div>

        {/* Quick Action (respeitando RBAC) */}
        <AnimatePresence initial={false}>
          {canManageDonors && currentView !== 'cadastro' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.18, ease: MOTION_EASE.outExpo }}
            >
              <Button
                size="sm"
                onClick={() => setCurrentView('cadastro')}
                leftIcon={<PlusCircle className="w-4 h-4" />}
                className="shadow-sm font-bold"
              >
                <span className="hidden sm:inline">Nova</span> Doadora
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
