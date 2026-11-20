import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { LoginView } from './components/modules/auth/LoginView';
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
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) {
    return <Navigate to="/rotas" replace />;
  }
  return <>{children}</>;
};

const AnimatedModuleRoutes: React.FC<{ defaultRoute: string }> = ({ defaultRoute }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname} className="w-full">
        <Suspense fallback={<ModuleLoadingSkeleton />}>
          <Routes location={location}>
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
      </PageTransition>
    </AnimatePresence>
  );
};

const AuthenticatedRoutes: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <SessionLoadingScreen />;
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
        <AnimatedModuleRoutes defaultRoute={defaultRoute} />
      </AppShell>
    </AppProvider>
  );
};

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AuthenticatedRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </MotionConfig>
  );
}

export default App;
