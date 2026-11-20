import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { LoginView } from './components/modules/auth/LoginView';

// Code-splitting por módulo (reduz bundle inicial e acelera carregamento mobile)
const DashboardView = lazy(() =>
  import('./components/modules/dashboard/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const DoadorasView = lazy(() =>
  import('./components/modules/doadoras/DoadorasView').then((m) => ({ default: m.DoadorasView }))
);
const RoteirizacaoView = lazy(() =>
  import('./components/modules/roteirizacao/RoteirizacaoView').then((m) => ({
    default: m.RoteirizacaoView,
  }))
);
const InteractiveMapView = lazy(() =>
  import('./components/modules/mapa/InteractiveMapView').then((m) => ({
    default: m.InteractiveMapView,
  }))
);
const EtiquetasView = lazy(() =>
  import('./components/modules/etiquetas/EtiquetasView').then((m) => ({ default: m.EtiquetasView }))
);
const AccountabilityView = lazy(() =>
  import('./components/modules/accountability/AccountabilityView').then((m) => ({
    default: m.AccountabilityView,
  }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ViewFallback: React.FC = () => (
  <div className="py-16 flex flex-col items-center justify-center gap-2 text-blh-slate-500">
    <div className="w-7 h-7 border-2 border-blh-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-medium">Carregando módulo...</span>
  </div>
);

const RoleGuard: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({
  roles,
  children,
}) => {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) {
    return <Navigate to="/rotas" replace />;
  }
  return <>{children}</>;
};

const AuthenticatedRoutes: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blh-bg flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blh-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-blh-slate-600">
            Validando sessão segura LEITE FLOW...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const defaultRoute = user?.role === 'LABORATORIO' ? '/laboratorio' : '/rotas';

  return (
    <AppProvider>
      <AppShell>
        <Suspense fallback={<ViewFallback />}>
          <Routes>
            <Route path="/login" element={<Navigate to={defaultRoute} replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route
              path="/doadoras"
              element={
                <RoleGuard roles={['ADMIN', 'COORDENADOR_BLH']}>
                  <DoadorasView />
                </RoleGuard>
              }
            />
            <Route path="/rotas" element={<RoteirizacaoView />} />
            <Route path="/mapa" element={<InteractiveMapView />} />
            <Route path="/etiquetas" element={<EtiquetasView />} />
            <Route path="/laboratorio" element={<AccountabilityView />} />
            <Route path="/" element={<Navigate to={defaultRoute} replace />} />
            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </AppProvider>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AuthenticatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
