import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../ui/Button';
import { Logo } from '../../ui/Logo';
import { ApiError } from '../../../services/apiClient';
import { LEITE_FLOW } from '../../../constants/blh';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível conectar ao servidor do LEITE FLOW. Verifique se a API está ativa.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const quickFillDev = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-blh-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-blh-line shadow-elevation overflow-hidden animate-fadeIn">
        {/* Cabeçalho institucional */}
        <div className="bg-blh-slate-900 px-6 py-7 text-white text-center space-y-2 border-b border-blh-slate-800">
          <div className="flex justify-center">
            <Logo variant="circle" theme="dark" size="lg" />
          </div>
          <h1 className="font-serif font-bold text-xl tracking-tight">LEITE FLOW</h1>
          <p className="text-xs text-emerald-300 font-medium">
            {LEITE_FLOW.hospitalName} · Banco de Leite Humano
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 text-xs text-blh-slate-600 bg-blh-primary-soft/60 border border-blh-line px-3 py-2 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-blh-primary shrink-0" />
            <span>Acesso restrito a profissionais autorizados (LGPD &amp; RDC 171/2006).</span>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-blh-slate-700 mb-1">
              E-mail institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-blh-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@leiteflow.org"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-blh-slate-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-blh-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
              />
            </div>
          </div>

          <Button type="submit" size="lg" isLoading={submitting} className="w-full font-bold">
            Entrar no Sistema
          </Button>

          {/* Atalhos de perfil exibidos exclusivamente em ambiente de desenvolvimento */}
          {import.meta.env.DEV && (
            <div className="pt-4 border-t border-blh-line space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blh-slate-500">
                Perfis de Desenvolvimento (RBAC)
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => quickFillDev('admin@leiteflow.org', 'Admin@2026')}
                  className="px-2.5 py-1.5 rounded-md border border-blh-line hover:bg-blh-slate-50 text-left font-medium text-blh-slate-700"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => quickFillDev('coordenacao@leiteflow.org', 'Coord@2026')}
                  className="px-2.5 py-1.5 rounded-md border border-blh-line hover:bg-blh-slate-50 text-left font-medium text-blh-slate-700"
                >
                  Coordenação BLH
                </button>
                <button
                  type="button"
                  onClick={() => quickFillDev('coletor@leiteflow.org', 'Coleta@2026')}
                  className="px-2.5 py-1.5 rounded-md border border-blh-line hover:bg-blh-slate-50 text-left font-medium text-blh-slate-700"
                >
                  Coletor de Campo
                </button>
                <button
                  type="button"
                  onClick={() => quickFillDev('laboratorio@leiteflow.org', 'Lab@2026')}
                  className="px-2.5 py-1.5 rounded-md border border-blh-line hover:bg-blh-slate-50 text-left font-medium text-blh-slate-700"
                >
                  Laboratório
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
