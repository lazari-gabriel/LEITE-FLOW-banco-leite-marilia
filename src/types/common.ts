export type ViewMode = 
  | 'visao'
  | 'cadastro'
  | 'roteirizacao'
  | 'mapa'
  | 'etiquetas'
  | 'accountability';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}
