import React, { useState } from 'react';
import { Info } from 'lucide-react';

export const ImpactCalculator: React.FC = () => {
  const [mlPerDay, setMlPerDay] = useState(150);
  const weeklyMl = mlPerDay * 7;
  const babiesFed = Math.max(1, Math.floor(weeklyMl / 70));

  return (
    <section id="calculadora" className="py-12 sm:py-16 bg-white border-b border-[#EFECE6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
            Simulador Educativo de Impacto
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] mt-1">
            Calcule o impacto da doação em frascos
          </h2>
          <p className="text-sm text-[#8C8275] mt-2">
            Bebês prematuros iniciam com apenas 1 ml a 5 ml por mamada. Veja como poucos mililitros
            fazem toda a diferença na UTI Neonatal.
          </p>
        </div>

        <div className="bg-[#FAF9F6] p-5 sm:p-10 rounded-3xl border border-[#EFECE6] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="md:col-span-7 space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="impact-ml-slider"
                    className="text-sm font-semibold text-[#1E242B]"
                  >
                    Excedente diário estimado:
                  </label>
                  <span className="px-3 py-1 rounded-full bg-[#EBF1EE] text-[#4A6B5D] font-bold text-sm border border-[#4A6B5D]/20 tabular-nums">
                    {mlPerDay} ml / dia
                  </span>
                </div>
                <input
                  id="impact-ml-slider"
                  type="range"
                  min={30}
                  max={500}
                  step={10}
                  value={mlPerDay}
                  onChange={(e) => setMlPerDay(Number(e.target.value))}
                  aria-label="Volume diário estimado em mililitros"
                  className="w-full h-2.5 bg-[#EFECE6] rounded-lg appearance-none cursor-pointer accent-[#4A6B5D]"
                />
                <div className="flex justify-between text-[11px] text-[#8C8275] mt-1">
                  <span>30 ml</span>
                  <span>250 ml</span>
                  <span>500 ml</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#EFECE6] text-xs text-[#1E242B]/80 leading-relaxed flex items-start gap-3">
                <Info className="w-5 h-5 text-[#4A6B5D] flex-shrink-0 mt-0.5" />
                <span>
                  A equipe do BLH Marília fornece frascos de vidro esterilizados com tampa plástica
                  na residência da doadora sem custo, após triagem clínica e sorológica.
                </span>
              </div>
            </div>

            <div className="md:col-span-5 bg-[#EFECE6] p-5 sm:p-6 rounded-2xl border border-[#8C8275]/20 text-center space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#8C8275]">
                  Em 1 semana de doação
                </span>
                <div className="font-display text-3xl font-bold text-[#1E242B] mt-0.5 tabular-nums">
                  {weeklyMl.toLocaleString('pt-BR')} ml
                </div>
              </div>
              <div className="w-full h-px bg-[#8C8275]/20" />
              <div>
                <span className="text-xs uppercase tracking-wider text-[#8C8275]">
                  Alimenta aproximadamente
                </span>
                <div className="font-display text-4xl font-bold text-[#4A6B5D] my-1 tabular-nums">
                  {babiesFed}{' '}
                  <span className="text-lg font-sans font-normal text-[#1E242B]">
                    {babiesFed === 1 ? 'bebê/semana' : 'bebês/semana'}
                  </span>
                </div>
                <span className="text-[11px] text-[#8C8275]">(Dieta inicial prematura)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
