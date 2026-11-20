import React from 'react';
import { motion } from 'motion/react';
import { ZONAS_SEMANA } from '../../../constants/zones';
import { useApp } from '../../../hooks/useApp';
import { WeekDay } from '../../../types/donor';
import { ChevronRight, Users, Milk, Truck } from 'lucide-react';
import { AnimatedCounter, ScrollReveal, StaggerContainer, StaggerItem } from '../../motion';
import { MOTION_SPRING } from '../../../lib/motion';

export const WeekMatrixOverview: React.FC = () => {
  const { donors, bottles, routes, selectedDay, setSelectedDay, setCurrentView } = useApp();

  const handleSelectDay = (dia: WeekDay) => {
    setSelectedDay(dia);
    setCurrentView('roteirizacao');
  };

  return (
    <ScrollReveal>
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-blh-line">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-blh-slate-900">
              Programação Semanal de Coletas — Marília
            </h2>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-0.5">
              Zoneamento das coletas por dia útil. Selecione um dia para gerenciar frota e paradas.
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            transition={MOTION_SPRING.tap}
            onClick={() => setCurrentView('roteirizacao')}
            className="text-xs font-bold text-blh-primary hover:text-blh-primary-dark inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors group"
          >
            <span>Gerenciar rotas</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </div>

        <StaggerContainer
          triggerOnScroll
          staggerDelay={0.055}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 mt-5"
        >
          {ZONAS_SEMANA.map((z) => {
            const aptCount = donors.filter(
              (d) => d.zona === z.zona && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
            ).length;
            const zoneBottles = bottles.filter((b) => b.zona === z.zona);
            const zoneRoutes = routes.filter((r) => r.day === z.dia && r.status !== 'canceled');
            const isSelected = selectedDay === z.dia;

            return (
              <StaggerItem key={z.dia}>
                <motion.button
                  type="button"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={MOTION_SPRING.gentle}
                  onClick={() => handleSelectDay(z.dia)}
                  className={`w-full h-full p-4 rounded-xl border text-left transition-[border-color,box-shadow,background-color] duration-200 cursor-pointer flex flex-col justify-between group hover:border-blh-primary hover:shadow-elevation focus:outline-none focus:ring-2 focus:ring-blh-primary/40 ${
                    isSelected
                      ? 'border-blh-primary bg-blh-primary-soft/40 shadow-sm ring-1 ring-blh-primary/30'
                      : 'border-blh-line bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-blh-slate-800">{z.dia}-feira</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm group-hover:scale-125 transition-transform"
                        style={{ backgroundColor: z.cor }}
                        title={`Zona ${z.zona}`}
                      />
                    </div>

                    <div className="font-sans font-bold text-sm text-blh-slate-900 mb-1 group-hover:text-blh-primary transition-colors">
                      Zona {z.zona}
                    </div>

                    <p className="text-xs text-blh-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {z.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-blh-line space-y-1.5 text-xs w-full">
                    <div className="flex items-center justify-between text-blh-slate-700">
                      <span className="flex items-center gap-1.5 text-blh-slate-600 font-medium">
                        <Truck className="w-3.5 h-3.5 text-blh-slate-500" />
                        <span>Rotas</span>
                      </span>
                      <span className="font-bold font-mono tabular-nums text-blh-slate-900">
                        <AnimatedCounter value={zoneRoutes.length} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-blh-slate-700">
                      <span className="flex items-center gap-1.5 text-blh-slate-600 font-medium">
                        <Users className="w-3.5 h-3.5 text-blh-slate-500" />
                        <span>Doadoras Aptas</span>
                      </span>
                      <span className="font-bold font-mono tabular-nums text-blh-primary">
                        <AnimatedCounter value={aptCount} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-blh-slate-700">
                      <span className="flex items-center gap-1.5 text-blh-slate-600 font-medium">
                        <Milk className="w-3.5 h-3.5 text-blh-slate-500" />
                        <span>Frascos</span>
                      </span>
                      <span className="font-bold font-mono tabular-nums text-blh-slate-900">
                        <AnimatedCounter value={zoneBottles.length} />
                      </span>
                    </div>
                  </div>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </ScrollReveal>
  );
};
