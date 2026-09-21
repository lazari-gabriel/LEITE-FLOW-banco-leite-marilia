import React from 'react';
import { ZONAS_SEMANA } from '../../../constants/zones';
import { useApp } from '../../../hooks/useApp';
import { WeekDay } from '../../../types/donor';
import { ChevronRight, Users, Milk } from 'lucide-react';

export const WeekMatrixOverview: React.FC = () => {
  const { donors, bottles, selectedDay, setSelectedDay, setCurrentView } = useApp();

  const handleSelectDay = (dia: WeekDay) => {
    setSelectedDay(dia);
    setCurrentView('roteirizacao');
  };

  return (
    <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-blh-line">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-bold text-blh-slate-900">
            Matriz Operacional Semanal de Coletas — Marília
          </h2>
          <p className="text-xs sm:text-sm text-blh-slate-600 mt-0.5">
            Zoneamento logístico por dia da semana da van coletora do Banco de Leite Humano.
          </p>
        </div>
        <button
          onClick={() => setCurrentView('roteirizacao')}
          className="text-xs font-bold text-blh-primary hover:text-blh-primary-dark inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors"
        >
          <span>Abrir Roteirizador</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 mt-5">
        {ZONAS_SEMANA.map((z) => {
          const aptCount = donors.filter(
            (d) => d.zona === z.zona && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
          ).length;
          const bottlesCount = bottles.filter((b) => b.zona === z.zona).length;
          const isSelected = selectedDay === z.dia;

          return (
            <div
              key={z.dia}
              onClick={() => handleSelectDay(z.dia)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group hover:border-blh-primary hover:shadow-md ${
                isSelected
                  ? 'border-blh-primary bg-blh-primary-soft/40 shadow-sm ring-1 ring-blh-primary/30'
                  : 'border-blh-line bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-blh-slate-800">
                    {z.dia}-feira
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-xs"
                    style={{ backgroundColor: z.cor }}
                    title={`Zona ${z.zona}`}
                  />
                </div>

                <div className="font-sans font-bold text-sm text-blh-slate-900 mb-1">
                  Zona {z.zona}
                </div>

                <p className="text-xs text-blh-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {z.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-blh-line space-y-2 text-xs">
                <div className="flex items-center justify-between text-blh-slate-700">
                  <span className="flex items-center gap-1.5 text-blh-slate-600 font-medium">
                    <Users className="w-3.5 h-3.5 text-blh-slate-500" />
                    <span>Doadoras Aptas</span>
                  </span>
                  <span className="font-bold font-mono tabular-nums text-blh-primary text-sm">{aptCount}</span>
                </div>
                <div className="flex items-center justify-between text-blh-slate-700">
                  <span className="flex items-center gap-1.5 text-blh-slate-600 font-medium">
                    <Milk className="w-3.5 h-3.5 text-blh-slate-500" />
                    <span>Frascos Coletados</span>
                  </span>
                  <span className="font-bold font-mono tabular-nums text-blh-slate-900 text-sm">{bottlesCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
