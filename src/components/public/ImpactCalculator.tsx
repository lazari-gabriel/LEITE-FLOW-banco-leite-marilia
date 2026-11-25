import React, { useState } from 'react';
import { Info } from 'lucide-react';

export const ImpactCalculator: React.FC = () => {
  const [mlPerDay, setMlPerDay] = useState(150);
  const weeklyMl = mlPerDay * 7;
  // Baseado na referência pública do Ministério da Saúde / rBLH-BR: 1.000 mL podem atender até 10 recém-nascidos/dia (~100 mL/dia)
  const neonatalDayEquivalents = Math.max(1, Math.round(weeklyMl / 100));

  return (
    <section id="calculadora" className="py-12 sm:py-16 bg-[#FAF9F6] border-t border-[#EFECE6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
            Referência educativa
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] mt-1">
            Veja como cada volume doado faz diferença
          </h2>
          <p className="text-sm text-[#8C8275] mt-2 leading-relaxed">
            Recém-nascidos prematuros podem iniciar a alimentação com volumes muito pequenos, a
            partir de 1 mL por mamada. Qualquer quantidade doada com segurança contribui.
          </p>
        </div>

        <div className="bg-white p-5 sm:p-10 rounded-3xl border border-[#EFECE6] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="md:col-span-7 space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="impact-ml-slider"
                    className="text-sm font-semibold text-[#1E242B]"
                  >
                    Volume diário estimado para doação:
                  </label>
                  <span className="px-3 py-1 rounded-full bg-[#EBF1EE] text-[#4A6B5D] font-bold text-sm border border-[#4A6B5D]/20 tabular-nums">
                    {mlPerDay} mL / dia
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
                  <span>30 mL</span>
                  <span>250 mL</span>
                  <span>500 mL</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EFECE6] text-xs text-[#1E242B]/80 leading-relaxed flex items-start gap-3">
                <Info className="w-5 h-5 text-[#4A6B5D] flex-shrink-0 mt-0.5" />
                <span>
                  Estimativa ilustrativa baseada na referência divulgada pelo Ministério da Saúde e
                  pela Rede Brasileira de Bancos de Leite Humano (rBLH-BR): 1 litro pode atender até
                  10 recém-nascidos prematuros por dia. O volume prescrito varia conforme o peso e o
                  quadro clínico de cada bebê.
                </span>
              </div>
            </div>

            <div className="md:col-span-5 bg-[#EFECE6] p-5 sm:p-6 rounded-2xl border border-[#8C8275]/20 text-center space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#8C8275]">
                  Volume acumulado em 7 dias
                </span>
                <div className="font-display text-3xl font-bold text-[#1E242B] mt-0.5 tabular-nums">
                  {weeklyMl.toLocaleString('pt-BR')} mL
                </div>
              </div>
              <div className="w-full h-px bg-[#8C8275]/20" />
              <div>
                <span className="text-xs uppercase tracking-wider text-[#8C8275]">
                  Equivalente ilustrativo a até
                </span>
                <div className="font-display text-4xl font-bold text-[#4A6B5D] my-1 tabular-nums">
                  {neonatalDayEquivalents}{' '}
                  <span className="text-lg font-sans font-normal text-[#1E242B]">
                    {neonatalDayEquivalents === 1
                      ? 'dia de nutrição neonatal'
                      : 'dias de nutrição neonatal'}
                  </span>
                </div>
                <span className="text-[11px] text-[#8C8275]">
                  Referência rBLH-BR / Ministério da Saúde (1 L ≈ até 10 bebês/dia)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
