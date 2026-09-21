import React from 'react';
import { ShieldCheck, Package, RotateCcw, Building2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { StatCard } from '../../ui/StatCard';
import { Badge } from '../../ui/Badge';
import { LEITE_FLOW } from '../../../constants/blh';

export const AccountabilityView: React.FC = () => {
  const { stats, bottles } = useApp();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-blh-line shadow-card">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-1 rounded-md mb-2">
          LEITE FLOW · Gestão Patrimonial
        </span>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-blh-slate-900 tracking-tight">
          Controle de Frascos &amp; Auditoria da Cadeia
        </h1>
        <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-3xl leading-relaxed">
          Prestação de contas e ciclo de devolução dos frascos de vidro esterilizados com tampa plástica distribuídos e recolhidos em Marília. O retorno dos frascos garante a sustentabilidade contínua da operação.
        </p>
      </div>

      {/* Grid de Reconciliação dos Frascos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Frascos no Hospital (Estoque)"
          value={stats.inventoryStock}
          caption="Prontos para envio às mães doadoras"
          variant="default"
          icon={<Package className="w-4 h-4 text-blh-primary" />}
        />
        <StatCard
          label="Frascos com as Doadoras"
          value={stats.bottlesWithMothers}
          caption="Aguardando a próxima rota semanal"
          variant="warn"
          icon={<Building2 className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Frascos Coletados Cheios"
          value={stats.totalBottles}
          caption="Na câmara fria (< -15°C)"
          variant="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Taxa de Retorno de Vidros"
          value={stats.returnRate}
          caption="Perda/Quebra histórica de 1.6%"
          variant="accent"
          icon={<RotateCcw className="w-4 h-4 text-blh-accent" />}
        />
      </div>

      {/* Matriz de Rastreabilidade Reversa (Cadernos 1, 2 e 3 do BLH) */}
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card space-y-4">
        <div className="pb-4 border-b border-blh-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blh-primary" />
              <h2 className="text-base sm:text-lg font-serif font-bold text-blh-slate-900">
                Engenharia de Rastreabilidade (Cadernos 1, 2 e 3)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-blh-slate-500 mt-0.5">
              Cada gota de leite administrada na UTI Neonatal pode ser rastreada de volta até a sorologia da doadora.
            </p>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 self-start sm:self-center">
            Cadeia de Custódia 100% Rastreada
          </span>
        </div>

        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <table className="w-full text-left text-xs text-blh-slate-700">
            <thead className="bg-blh-slate-50 border-b border-blh-line text-[11px] font-bold text-blh-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Frasco</th>
                <th className="px-4 py-3">Origem (Caderno 1)</th>
                <th className="px-4 py-3">Data &amp; Temp</th>
                <th className="px-4 py-3">Qualidade (Caderno 2)</th>
                <th className="px-4 py-3">Acidez / Calorias</th>
                <th className="px-4 py-3">Destino UTI (Caderno 3)</th>
                <th className="px-4 py-3">Validade Leite Cru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blh-line">
              {bottles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-blh-slate-500 text-xs">
                    Nenhum frasco coletado ainda. Inicie uma rota ou registre coletas para visualizar a auditoria patrimonial.
                  </td>
                </tr>
              ) : (
                bottles.map((f) => (
                  <tr key={f.id} className="hover:bg-blh-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-blh-slate-900">
                      {f.codigo}
                    </td>
                    <td className="px-4 py-3.5">
                      <strong className="block text-blh-slate-900">{f.doadoraNome}</strong>
                      <span className="text-[11px] text-blh-slate-500">
                        DOAD-{String(f.doadoraId).padStart(3, '0')} · Zona {f.zona}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block text-blh-slate-800">{f.dataHoraColeta}</span>
                      <span className="font-mono font-bold text-emerald-700 text-[11px]">
                        {f.temp} °C
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="success" size="sm">
                        {f.statusPast}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-blh-slate-700">
                      {f.acidez} · {f.crematocrito}
                    </td>
                    <td className="px-4 py-3.5">
                      <strong className="text-blh-slate-900 text-xs">{f.destinoUTI}</strong>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-amber-800">
                      {f.validadeCru}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
