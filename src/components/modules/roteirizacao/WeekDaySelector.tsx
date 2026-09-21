import React from 'react';
import { ZONAS_SEMANA } from '../../../constants/zones';
import { useApp } from '../../../hooks/useApp';
import { WeekDay } from '../../../types/donor';

export const WeekDaySelector: React.FC = () => {
  const { selectedDay, setSelectedDay, donors, bottles } = useApp();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {ZONAS_SEMANA.map((z) => {
        const isSelected = selectedDay === z.dia;
        const aptCount = donors.filter(
          (d) => d.zona === z.zona && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
        ).length;
        const bottlesCount = bottles.filter((b) => b.zona === z.zona).length;

        return (
          <button
            key={z.dia}
            type="button"
            onClick={() => setSelectedDay(z.dia)}
            className={`p-3.5 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between ${
              isSelected
                ? 'bg-blh-primary text-white border-blh-primary shadow-md ring-2 ring-blh-primary/20'
                : 'bg-white text-blh-slate-800 border-blh-line hover:border-blh-line-strong hover:bg-blh-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isSelected ? 'text-emerald-200' : 'text-blh-slate-500'
                  }`}
                >
                  {z.dia}-feira
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/50"
                  style={{ backgroundColor: z.cor }}
                />
              </div>

              <div className="font-serif font-bold text-sm leading-tight">
                Zona {z.zona}
              </div>

              <p
                className={`text-[11px] line-clamp-1 mt-0.5 ${
                  isSelected ? 'text-emerald-100' : 'text-blh-slate-500'
                }`}
              >
                {z.desc}
              </p>
            </div>

            <div
              className={`pt-2.5 mt-3 border-t flex items-center justify-between text-[11px] ${
                isSelected ? 'border-white/15 text-emerald-100' : 'border-blh-line text-blh-slate-600'
              }`}
            >
              <span>{aptCount} {aptCount === 1 ? 'doadora' : 'doadoras'}</span>
              <span className="font-mono font-bold">
                {bottlesCount} {bottlesCount === 1 ? 'frasco' : 'frascos'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
