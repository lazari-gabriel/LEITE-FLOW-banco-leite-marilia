import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { modalBackdropVariants, modalPanelVariants, MOTION_SPRING } from '../../lib/motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop com blur suave e fade controlado */}
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-blh-slate-950/70 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container com escala, opacidade e movimento refinado */}
          <motion.div
            variants={modalPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white rounded-2xl shadow-floating border border-blh-line overflow-hidden z-10 my-auto`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-blh-line flex items-center justify-between bg-blh-slate-50/70">
              <div>
                <h3 id={titleId} className="text-base font-semibold text-blh-slate-900 font-serif">
                  {title}
                </h3>
                {subtitle && <p className="text-xs text-blh-slate-500 mt-0.5">{subtitle}</p>}
              </div>
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.06, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                transition={MOTION_SPRING.tap}
                className="p-1.5 rounded-lg text-blh-slate-400 hover:text-blh-slate-700 hover:bg-blh-slate-100 transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
