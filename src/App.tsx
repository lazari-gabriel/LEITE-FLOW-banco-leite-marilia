import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './components/modules/dashboard/DashboardView';
import { DoadorasView } from './components/modules/doadoras/DoadorasView';
import { RoteirizacaoView } from './components/modules/roteirizacao/RoteirizacaoView';
import { InteractiveMapView } from './components/modules/mapa/InteractiveMapView';
import { EtiquetasView } from './components/modules/etiquetas/EtiquetasView';
import { AccountabilityView } from './components/modules/accountability/AccountabilityView';

const MainRouter: React.FC = () => {
  const { currentView } = useApp();

  switch (currentView) {
    case 'visao':
      return <DashboardView />;
    case 'cadastro':
      return <DoadorasView />;
    case 'roteirizacao':
      return <RoteirizacaoView />;
    case 'mapa':
      return <InteractiveMapView />;
    case 'etiquetas':
      return <EtiquetasView />;
    case 'accountability':
      return <AccountabilityView />;
    default:
      return <DashboardView />;
  }
};

export function App() {
  return (
    <AppProvider>
      <AppShell>
        <MainRouter />
      </AppShell>
    </AppProvider>
  );
}

export default App;
