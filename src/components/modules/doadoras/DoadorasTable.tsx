import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Eye, 
  Route, 
  Check, 
  X, 
  ShieldAlert, 
  Edit3, 
  UserX, 
  UserCheck, 
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Donor, ZoneName } from '../../../types/donor';
import { useApp } from '../../../hooks/useApp';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { EmptyState } from '../../ui/EmptyState';
import { calculateMilkClass, getMilkClassDescription } from '../../../services/donorService';

interface DoadorasTableProps {
  onEditDonor?: (donor: Donor) => void;
}

type SortField = 'id' | 'nome' | 'zona' | 'aptidao' | 'statusCadastro';

export const DoadorasTable: React.FC<DoadorasTableProps> = ({ onEditDonor }) => {
  const { donors, navigateToDonorRoute, deleteDonor, reactivateDonor, startEditDonor } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todas');
  const [selectedCadastroStatus, setSelectedCadastroStatus] = useState<string>('Todas');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [inspectDonor, setInspectDonor] = useState<Donor | null>(null);
  const [inactivatingDonor, setInactivatingDonor] = useState<Donor | null>(null);
  const [reactivatingDonor, setReactivatingDonor] = useState<Donor | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtragem combinada
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      const matchSearch =
        d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.bebe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.sus.includes(searchTerm);

      const matchZone = selectedZone === 'Todas' || d.zona === selectedZone;
      const matchStatus = selectedStatus === 'Todas' || d.aptidao === selectedStatus;
      const matchCadastro =
        selectedCadastroStatus === 'Todas' ||
        (selectedCadastroStatus === 'Ativas' && d.statusCadastro === 'ativa') ||
        (selectedCadastroStatus === 'Inativas' && d.statusCadastro === 'inativa');

      return matchSearch && matchZone && matchStatus && matchCadastro;
    });
  }, [donors, searchTerm, selectedZone, selectedStatus, selectedCadastroStatus]);

  // Ordenação
  const sortedDonors = useMemo(() => {
    return [...filteredDonors].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') comparison = a.id - b.id;
      else if (sortField === 'nome') comparison = a.nome.localeCompare(b.nome);
      else if (sortField === 'zona') comparison = a.zona.localeCompare(b.zona);
      else if (sortField === 'aptidao') comparison = a.aptidao.localeCompare(b.aptidao);
      else if (sortField === 'statusCadastro') comparison = (a.statusCadastro || 'ativa').localeCompare(b.statusCadastro || 'ativa');
      return sortAsc ? comparison : -comparison;
    });
  }, [filteredDonors, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedDonors.length / itemsPerPage) || 1;
  const paginatedDonors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedDonors.slice(start, start + itemsPerPage);
  }, [sortedDonors, currentPage, itemsPerPage]);

  const handleConfirmInactivate = () => {
    if (inactivatingDonor) {
      deleteDonor(inactivatingDonor.id);
      setInactivatingDonor(null);
    }
  };

  const handleConfirmReactivate = () => {
    if (reactivatingDonor) {
      reactivateDonor(reactivatingDonor.id);
      setReactivatingDonor(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card space-y-4">
      {/* Header & Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-blh-line">
        <div>
          <h2 className="text-base sm:text-lg font-sans font-bold text-blh-slate-900">
            Doadoras Cadastradas &amp; Gestão Central (CRUD)
          </h2>
          <p className="text-xs sm:text-sm text-blh-slate-600 mt-0.5">
            Base oficial de doadoras. Remoções são sempre lógicas para proteger o histórico de coletas.
          </p>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Busca */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blh-slate-400" />
            <input
              type="text"
              placeholder="Buscar doadora, bebê ou SUS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
            />
          </div>

          {/* Filtro Zona */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white font-medium text-blh-slate-800 focus:outline-none focus:ring-2 focus:ring-blh-primary/30"
          >
            <option value="Todas">Todas as Zonas</option>
            <option value="Norte">Zona Norte</option>
            <option value="Sul">Zona Sul</option>
            <option value="Oeste">Zona Oeste</option>
            <option value="Leste">Zona Leste</option>
            <option value="Rural">Zona Rural/Maracá</option>
          </select>

          {/* Filtro Aptidão */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white font-medium text-blh-slate-800 focus:outline-none focus:ring-2 focus:ring-blh-primary/30"
          >
            <option value="Todas">Aptidão: Todas</option>
            <option value="Apta">Aptas (Go)</option>
            <option value="Inapta">Inaptas (No-Go)</option>
            <option value="Pendente">Pendentes</option>
          </select>

          {/* Filtro Cadastro Ativo/Inativo */}
          <select
            value={selectedCadastroStatus}
            onChange={(e) => setSelectedCadastroStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-blh-slate-300 bg-white font-medium text-blh-slate-800 focus:outline-none focus:ring-2 focus:ring-blh-primary/30"
          >
            <option value="Todas">Cadastro: Todos</option>
            <option value="Ativas">Apenas Ativas</option>
            <option value="Inativas">Inativas (Removidas)</option>
          </select>
        </div>
      </div>

      {/* Tabela de Dados */}
      {filteredDonors.length === 0 ? (
        <EmptyState
          title="Nenhuma doadora encontrada"
          description="Nenhum registro corresponde aos filtros ou termos de pesquisa selecionados."
          actionLabel="Limpar Filtros"
          onAction={() => {
            setSearchTerm('');
            setSelectedZone('Todas');
            setSelectedStatus('Todas');
            setSelectedCadastroStatus('Todas');
          }}
        />
      ) : (
        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <table className="w-full text-left text-xs text-blh-slate-700">
            <thead className="bg-blh-slate-50 border-b border-blh-line text-[11px] font-bold text-blh-slate-600 uppercase tracking-wider">
              <tr>
                <th 
                  onClick={() => handleSort('id')}
                  className="px-4 py-3 cursor-pointer hover:bg-blh-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Código</span>
                    {sortField === 'id' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-blh-primary" /> : <ArrowDown className="w-3 h-3 text-blh-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-blh-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('nome')}
                  className="px-4 py-3 cursor-pointer hover:bg-blh-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Doadora &amp; Bebê</span>
                    {sortField === 'nome' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-blh-primary" /> : <ArrowDown className="w-3 h-3 text-blh-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-blh-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('zona')}
                  className="px-4 py-3 cursor-pointer hover:bg-blh-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Zona / Endereço</span>
                    {sortField === 'zona' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-blh-primary" /> : <ArrowDown className="w-3 h-3 text-blh-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-blh-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3">Classificação</th>
                <th className="px-4 py-3">Sorologia</th>
                <th 
                  onClick={() => handleSort('aptidao')}
                  className="px-4 py-3 cursor-pointer hover:bg-blh-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Veredito</span>
                    {sortField === 'aptidao' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-blh-primary" /> : <ArrowDown className="w-3 h-3 text-blh-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-blh-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('statusCadastro')}
                  className="px-4 py-3 cursor-pointer hover:bg-blh-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Cadastro</span>
                    {sortField === 'statusCadastro' ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-blh-primary" /> : <ArrowDown className="w-3 h-3 text-blh-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-blh-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blh-line">
              {paginatedDonors.map((d) => {
                const isApt = d.aptidao === 'Apta';
                const isActive = d.statusCadastro === 'ativa';
                const milkClass = calculateMilkClass(d.parto);
                const milkDesc = getMilkClassDescription(milkClass);

                // Cálculo de dias de vida do bebê
                const dParto = new Date(d.parto);
                const diffTime = Math.abs(new Date().getTime() - dParto.getTime());
                const diasBebe = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                return (
                  <tr
                    key={d.id}
                    className={`hover:bg-blh-slate-50/70 transition-colors group ${
                      !isActive ? 'bg-blh-slate-50/50 opacity-75' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 font-mono tabular-nums font-bold text-blh-slate-900 text-xs">
                      DOAD-{String(d.id).padStart(3, '0')}
                    </td>
                    <td className="px-4 py-3.5">
                      <strong className="block text-blh-slate-900 font-bold text-xs sm:text-sm">
                        {d.nome}
                      </strong>
                      <span className="text-xs text-blh-slate-600 font-medium">
                        Bebê: {d.bebe} ({diasBebe} dias de vida)
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-blh-slate-900">
                        Zona {d.zona}
                      </span>
                      <span className="block text-xs text-blh-slate-600 truncate max-w-[200px]" title={d.endereco}>
                        {d.endereco}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-blh-primary-soft text-blh-primary font-bold text-xs border border-blh-primary/20">
                        {milkDesc.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-bold text-xs ${
                          d.sorologia1 === 'normal'
                            ? 'text-emerald-800'
                            : 'text-rose-800'
                        }`}
                      >
                        {d.sorologia1 === 'normal' ? 'Não Reagente' : 'Alterada'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={isApt ? 'success' : d.aptidao === 'Pendente' ? 'warning' : 'danger'}
                        dot
                        icon={isApt ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                      >
                        {d.aptidao}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setInactivatingDonor(d);
                          } else {
                            setReactivatingDonor(d);
                          }
                        }}
                        title={isActive ? "Cadastro Ativo. Clique para inativar (solicita confirmação)." : "Cadastro Inativo. Clique para reativar."}
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs ${
                          isActive
                            ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-300 hover:bg-emerald-200/90 hover:border-emerald-400'
                            : 'bg-blh-slate-100 text-blh-slate-600 border border-blh-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                        }`}
                      >
                        {isActive ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Editar Cadastro na aba Cadastro de Doadora */}
                        {onEditDonor && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditDonor(d)}
                            title="Editar Cadastro da Doadora"
                            className="p-2 min-h-[38px] min-w-[38px] rounded-lg text-blh-slate-700 hover:text-blh-primary hover:bg-blh-slate-100"
                            aria-label="Editar Doadora"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Laudo se inapta */}
                        {!isApt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setInspectDonor(d)}
                            title="Ver laudo de contraindicação"
                            className="p-2 min-h-[38px] min-w-[38px] rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                            aria-label="Ver Laudo"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Rota */}
                        {isApt && isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigateToDonorRoute(d.zona, d.id)}
                            className="font-bold border-blh-slate-300 hover:border-blh-primary text-blh-slate-800 hover:text-blh-primary min-h-[38px]"
                          >
                            Rota
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Barra de Paginação Operacional */}
          <div className="p-4 border-t border-blh-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blh-slate-600">
            <div>
              Mostrando <strong className="text-blh-slate-900">{sortedDonors.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> a{' '}
              <strong className="text-blh-slate-900">{Math.min(currentPage * itemsPerPage, sortedDonors.length)}</strong> de{' '}
              <strong className="text-blh-slate-900">{sortedDonors.length}</strong> doadoras
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-blh-slate-200 text-blh-slate-700 hover:bg-blh-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                        currentPage === page
                          ? 'bg-blh-primary text-white shadow-xs'
                          : 'border border-blh-slate-200 text-blh-slate-700 hover:bg-blh-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-blh-slate-200 text-blh-slate-700 hover:bg-blh-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1"
                  aria-label="Próxima página"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Laudo / Motivo da Reprovação */}
      {inspectDonor && (
        <Modal
          isOpen={true}
          onClose={() => setInspectDonor(null)}
          title={`Laudo da Triagem Sanitária — DOAD-${String(inspectDonor.id).padStart(3, '0')}`}
          subtitle={`Doadora: ${inspectDonor.nome}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-rose-950 mb-1">
                  Contraindicação Sanitária Identificada
                </strong>
                <p className="text-xs text-rose-800 leading-relaxed">
                  {inspectDonor.motivoInapta ||
                    'Doadora reprovada na avaliação Go / No-Go por critérios de biossegurança do BLH de Marília (sorologia reagente, hábitos restritos ou condições de armazenamento inadequadas).'}
                </p>
              </div>
            </div>

            <div className="text-xs space-y-2 text-blh-slate-600 bg-blh-slate-50 p-3.5 rounded-lg border border-blh-line">
              <div className="flex justify-between">
                <span>Sorologia 1ª Amostra:</span>
                <strong className="text-blh-slate-900">{inspectDonor.sorologia1 === 'normal' ? 'Normal' : 'Alterada'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tabagismo:</span>
                <strong className="text-blh-slate-900">{inspectDonor.fumo === 'nao' ? 'Não' : 'Ativo / Ocasional'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tatuagem / Piercing recente:</span>
                <strong className="text-blh-slate-900">{inspectDonor.tatuagem}</strong>
              </div>
              <div className="flex justify-between">
                <span>Saneamento (Água Encanada):</span>
                <strong className="text-blh-slate-900">{inspectDonor.aguaPotavel ? 'Sim' : 'Não'}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setInspectDonor(null)}>
                Fechar Laudo
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Confirmação de Inativação Central */}
      {inactivatingDonor && (
        <Modal
          isOpen={true}
          onClose={() => setInactivatingDonor(null)}
          title="Confirmar Inativação da Doadora"
          subtitle={`DOAD-${String(inactivatingDonor.id).padStart(3, '0')} — ${inactivatingDonor.nome}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900">Remoção Lógica (Inativação)</p>
                <p className="mt-1 leading-relaxed text-rose-800">
                  Deseja realmente inativar o cadastro de <strong>{inactivatingDonor.nome}</strong>?
                </p>
                <p className="mt-2 text-rose-700 text-[11px]">
                  • Ela não será incluída em rotas futuras de coleta.<br />
                  • Ela poderá ser reativada a qualquer momento nesta tabela.
                </p>
                <div className="mt-3 p-2.5 rounded bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-semibold text-[11px]">
                  ✓ Regra de Ouro da Integridade: Todo o histórico de coletas e frascos anteriores desta doadora permanece 100% preservado no sistema e no Dashboard.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-blh-line flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setInactivatingDonor(null)}>
                Cancelar
              </Button>

              <Button
                type="button"
                size="md"
                onClick={handleConfirmInactivate}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                leftIcon={<UserX className="w-4 h-4" />}
              >
                Inativar Doadora
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Confirmação de Reativação */}
      {reactivatingDonor && (
        <Modal
          isOpen={true}
          onClose={() => setReactivatingDonor(null)}
          title="Reativar Cadastro de Doadora"
          subtitle={`DOAD-${String(reactivatingDonor.id).padStart(3, '0')} — ${reactivatingDonor.nome}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-900">Reativação Cadastral</p>
                <p className="mt-1 leading-relaxed text-emerald-800">
                  Deseja restabelecer o status <strong>Ativo</strong> de <strong>{reactivatingDonor.nome}</strong>?
                </p>
                <p className="mt-2 text-emerald-700 text-[11px]">
                  • Ela voltará a ficar disponível para roteirização e coletas de leite semanais.<br />
                  • Todos os registros e coletas anteriores permanecem vinculados normalmente.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-blh-line flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setReactivatingDonor(null)}>
                Cancelar
              </Button>

              <Button
                type="button"
                size="md"
                onClick={handleConfirmReactivate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                leftIcon={<UserCheck className="w-4 h-4" />}
              >
                Reativar Cadastro
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
