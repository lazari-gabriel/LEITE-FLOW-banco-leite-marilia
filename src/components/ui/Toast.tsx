import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types/common';

export interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2.5 max-w-md w-full pointer-events-none p-2 sm:p-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-white shadow-elevation',
    error: 'border-rose-200 bg-white shadow-elevation',
    warning: 'border-amber-200 bg-white shadow-elevation',
    info: 'border-sky-200 bg-white shadow-elevation',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border ${borders[toast.type]} transition-all duration-200 animate-slideIn`}
      role="alert"
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-blh-slate-900 leading-snug">{toast.title}</h4>
        {toast.description && (
          <p className="text-xs text-blh-slate-600 mt-1 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-blh-slate-400 hover:text-blh-slate-700 p-1 rounded hover:bg-blh-slate-100 transition-colors shrink-0"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
