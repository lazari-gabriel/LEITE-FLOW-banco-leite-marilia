import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  apiFetch,
  refreshSessionOnce,
  setAccessToken,
  setOnSessionExpired,
} from '../services/apiClient';

export type UserRole = 'ADMIN' | 'COORDENADOR_BLH' | 'COLETOR_CAMPO' | 'LABORATORIO';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const INTERNAL_PROTECTED_PATHS = [
  '/dashboard',
  '/doadoras',
  '/rotas',
  '/mapa',
  '/etiquetas',
  '/laboratorio',
];

export function getDefaultRouteForRole(role?: UserRole): string {
  switch (role) {
    case 'ADMIN':
    case 'COORDENADOR_BLH':
      return '/dashboard';
    case 'COLETOR_CAMPO':
      return '/rotas';
    case 'LABORATORIO':
      return '/laboratorio';
    default:
      return '/rotas';
  }
}

export function canRoleAccessPath(role: UserRole, pathname: string): boolean {
  const cleanPath = pathname.split('?')[0];
  if (!INTERNAL_PROTECTED_PATHS.some((p) => cleanPath === p || cleanPath.startsWith(`${p}/`))) {
    return false;
  }
  if (cleanPath === '/doadoras' || cleanPath.startsWith('/doadoras/')) {
    return role === 'ADMIN' || role === 'COORDENADOR_BLH';
  }
  return true;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiredNotice: string | null;
  clearSessionExpiredNotice: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const clearSessionExpiredNotice = useCallback(() => {
    setSessionExpiredNotice(null);
  }, []);

  // Trata expiração irrecuperável de sessão (quando refresh token HttpOnly falha após 401)
  useEffect(() => {
    setOnSessionExpired(() => {
      setAccessToken(null);
      setUser(null);
      queryClient.clear();
      setSessionExpiredNotice('Sua sessão expirou. Faça login novamente para continuar.');
      navigate('/login', { replace: true });
    });

    return () => {
      setOnSessionExpired(null);
    };
  }, [navigate, queryClient]);

  // Restaura sessão via refresh token HttpOnly ao carregar/atualizar a página (F5)
  // Deduplicado em apiClient para evitar múltiplas chamadas simultâneas (ex.: React StrictMode)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await refreshSessionOnce<AuthUser>();
        if (active && res?.accessToken && res.user) {
          setAccessToken(res.accessToken);
          setUser(res.user);
        } else if (active) {
          setAccessToken(null);
          setUser(null);
        }
      } catch {
        if (active) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthRetry: true,
    });
    setSessionExpiredNotice(null);
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', skipAuthRetry: true });
    } catch {
      // ignora erro de rede no encerramento local
    } finally {
      setAccessToken(null);
      setUser(null);
      setSessionExpiredNotice(null);
      queryClient.clear();
      navigate('/', { replace: true });
    }
  }, [navigate, queryClient]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sessionExpiredNotice,
        clearSessionExpiredNotice,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return ctx;
}
