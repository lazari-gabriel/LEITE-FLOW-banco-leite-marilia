import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import {
  AuthProvider,
  useAuth,
  UserRole,
  getDefaultRouteForRole,
} from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { LoginView } from './components/modules/auth/LoginView';
import { PublicHomePage } from './components/public/PublicHomePage';
import {
  ModuleLoadingSkeleton,
  PageTransition,
  SessionLoadingScreen,
} from './components/motion';

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

const RoleGuard: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({
  roles,
  children,
}) => {
  const { hasRole, user } = useAuth();
  if (!hasRole(...roles)) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }
  return <>{children}</>;
};

const LoginRouteGuard: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <SessionLoadingScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <LoginView />;
};

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <SessionLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  return (
    <AppProvider>
      <AppShell>
        <PageTransition key={location.pathname} className="w-full">
          <Suspense fallback={<ModuleLoadingSkeleton />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </AppShell>
    </AppProvider>
  );
};

const FallbackRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <SessionLoadingScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <Navigate to="/" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/login" element={<LoginRouteGuard />} />

      {/* Rotas Protegidas do Sistema Operacional LEITFLOW */}
      <Route element={<ProtectedLayout />}>
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
      </Route>

      {/* Fallback */}
      <Route path="*" element={<FallbackRoute />} />
    </Routes>
  );
};

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </MotionConfig>
  );
}

export default App;
