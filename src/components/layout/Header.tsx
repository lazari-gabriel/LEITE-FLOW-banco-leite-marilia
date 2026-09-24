import React, { useState, useEffect } from 'react';
import { Menu, Clock, PlusCircle, ShieldCheck, Heart } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { Button } from '../ui/Button';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { currentView, setCurrentView } = useApp();
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

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blh-line px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Menu & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-md text-blh-slate-600 hover:text-blh-slate-900 hover:bg-blh-slate-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-blh-slate-600 min-w-0">
          <span
            className="font-bold text-blh-primary hover:text-blh-primary-dark transition-colors cursor-pointer tracking-wider"
            onClick={() => setCurrentView('roteirizacao')}
          >
            LEITE FLOW
          </span>
          <span className="text-blh-slate-400 font-medium">/</span>
          <span className="font-bold text-blh-slate-900 truncate">
            {breadcrumbMap[currentView] || 'Painel'}
          </span>
        </div>
      </div>

      {/* Right: Operational Status, Live Clock & Quick Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Cold Chain Live Telemetry Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-900 text-xs font-semibold tabular-nums shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600" />
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-sky-700 shrink-0" />
          <span>Sensor Frio: <strong className="font-mono text-sky-950">-17.2°C</strong></span>
          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300">ANVISA ✓</span>
        </div>

        {/* Live Operational Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blh-slate-100 border border-blh-slate-200 text-blh-slate-800 text-xs font-mono font-medium tabular-nums shadow-xs">
          <Clock className="w-3.5 h-3.5 text-blh-slate-500 shrink-0" />
          <span>{currentDateTime}</span>
        </div>

        {/* Quick Action */}
        {currentView !== 'cadastro' && (
          <Button
            size="sm"
            onClick={() => setCurrentView('cadastro')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="shadow-sm font-bold"
          >
            <span className="hidden sm:inline">Nova</span> Doadora
          </Button>
        )}
      </div>
    </header>
  );
};
