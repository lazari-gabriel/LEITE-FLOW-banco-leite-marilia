import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  useAuth,
  getDefaultRouteForRole,
  canRoleAccessPath,
} from '../../../context/AuthContext';
import { ApiError } from '../../../services/apiClient';
import { LEITE_FLOW } from '../../../constants/blh';
import { MOTION_DURATION, MOTION_EASE } from '../../../lib/motion';
import { InstitutionalLogo } from '../../public/InstitutionalLogo';

interface LoginLocationState {
  from?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginView: React.FC = () => {
  const { login, sessionExpiredNotice, clearSessionExpiredNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LoginLocationState | null) ?? null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validateFields = (): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return 'Informe seu e-mail institucional.';
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return 'Informe um endereço de e-mail institucional válido.';
    }
    if (!password) {
      return 'Informe sua senha de acesso.';
    }
    if (password.length < 6) {
      return 'A senha deve possuir no mínimo 6 caracteres.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const authenticatedUser = await login(email.trim().toLowerCase(), password);
      const requestedPath = locationState?.from;
      const targetRoute =
        requestedPath && canRoleAccessPath(authenticatedUser.role, requestedPath)
          ? requestedPath
          : getDefaultRouteForRole(authenticatedUser.role);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError('Muitas tentativas de acesso. Aguarde um minuto e tente novamente.');
        } else if (err.status === 401) {
          setError(err.message || 'E-mail ou senha incorretos.');
        } else if (err.status >= 500) {
          setError('O servidor do LEITFLOW está temporariamente indisponível. Tente novamente em instantes.');
        } else {
          setError(err.message);
        }
      } else {
        setError(
          'Não foi possível conectar ao servidor do LEITFLOW. Verifique sua conexão ou se o serviço está disponível.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1E242B] font-sans antialiased flex flex-col justify-between selection:bg-[#4A6B5D] selection:text-white relative overflow-hidden">
      {/* Subtle organic background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-24 w-96 h-96 rounded-full bg-[#EBF1EE] blur-3xl opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-[#EFECE6] blur-3xl opacity-80"
      />

      {/* Top Header with Back Button */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link
          to="/"
          onClick={clearSessionExpiredNotice}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4A6B5D] hover:text-[#3d594d] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#EBF1EE]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>

        <Link to="/" aria-label="Página inicial LEITFLOW">
          <InstitutionalLogo size="sm" />
        </Link>
      </header>

      {/* Center Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: MOTION_DURATION.medium, ease: MOTION_EASE.outExpo }}
          className="max-w-md w-full bg-white rounded-3xl p-7 sm:p-10 shadow-xl border border-[#EFECE6]"
        >
          <div className="text-center mb-7">
            <div className="flex justify-center mb-4">
              <InstitutionalLogo size="lg" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1E242B]">
              Acesse o Sistema
            </h1>
            <p className="text-xs text-[#8C8275] mt-1.5">
              Entre com seu e-mail institucional e senha do LEITFLOW
            </p>
          </div>

          {/* Compliance Badge */}
          <div className="mb-5 flex items-center gap-2.5 text-xs text-[#4A6B5D] bg-[#EBF1EE]/80 border border-[#4A6B5D]/15 px-3.5 py-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#4A6B5D] shrink-0" />
            <span>Acesso restrito a profissionais autorizados (LGPD &amp; RDC 171/2006).</span>
          </div>

          {/* Session Expired Notice */}
          <AnimatePresence mode="wait">
            {sessionExpiredNotice && !error && (
              <motion.div
                key="session-expired"
                role="status"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: MOTION_EASE.outExpo }}
                className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5"
              >
                <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>{sessionExpiredNotice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Feedback */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="login-error"
                role="alert"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.22, ease: MOTION_EASE.outExpo }}
                className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-[#1E242B] mb-1.5"
              >
                E-mail institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C8275] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={submitting}
                  placeholder="nome@leiteflow.org"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FAF9F6] text-sm text-[#1E242B] placeholder:text-[#8C8275]/70 focus:outline-none focus:border-[#4A6B5D] focus:ring-2 focus:ring-[#4A6B5D]/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#1E242B] mb-1.5"
              >
                Senha de acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C8275] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={submitting}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#EFECE6] bg-[#FAF9F6] text-sm text-[#1E242B] placeholder:text-[#8C8275]/70 focus:outline-none focus:border-[#4A6B5D] focus:ring-2 focus:ring-[#4A6B5D]/20 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={submitting}
                  aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                  aria-pressed={showPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#8C8275] hover:text-[#1E242B] hover:bg-[#EFECE6]/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6B5D]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[#4A6B5D] text-white font-semibold text-sm hover:bg-[#3d594d] transition-all shadow-md shadow-[#4A6B5D]/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#EFECE6] text-center space-y-1.5">
            <p className="text-[11px] font-medium text-[#1E242B]/80">
              {LEITE_FLOW.hospitalName}
            </p>
            <p className="text-[11px] text-[#8C8275]">
              Banco de Leite Humano de Marília • HCFAMEMA
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#8C8275]">
        &copy; {new Date().getFullYear()} LEITFLOW Marília-SP. Todos os direitos reservados.
      </footer>
    </div>
  );
};
