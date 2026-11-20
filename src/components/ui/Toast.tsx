import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ToastMessage } from '../../types/common';
import { toastVariants } from '../../lib/motion';

export interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2.5 max-w-md w-full pointer-events-none p-2 sm:p-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
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
    success: 'border-emerald-200 bg-white/95 backdrop-blur-md shadow-elevation',
    error: 'border-rose-200 bg-white/95 backdrop-blur-md shadow-elevation',
    warning: 'border-amber-200 bg-white/95 backdrop-blur-md shadow-elevation',
    info: 'border-sky-200 bg-white/95 backdrop-blur-md shadow-elevation',
  };

  const accentBars = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
  };

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`relative overflow-hidden pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${borders[toast.type]}`}
      role="alert"
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${accentBars[toast.type]}`} />
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-blh-slate-900 leading-snug">{toast.title}</h4>
        {toast.description && (
          <p className="text-xs text-blh-slate-600 mt-1 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(toast.id)}
        className="text-blh-slate-400 hover:text-blh-slate-700 p-1 rounded-md hover:bg-blh-slate-100 transition-colors shrink-0"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};
