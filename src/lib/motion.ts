import type { Transition, Variants } from 'motion/react';

/**
 * Padrão Global de Animações — LEITE FLOW
 *
 * Direção visual: SaaS Clínico de Alta Precisão (profissional, fluido, natural e leve).
 * Todas as durações e curvas foram calibradas para não atrasar operações administrativas
 * e respeitam globalmente `prefers-reduced-motion` via <MotionConfig reducedMotion="user">.
 */

export const MOTION_EASE = {
  /** Desaceleração precisa e responsiva (entradas de tela, cards, barras) */
  outExpo: [0.16, 1, 0.3, 1] as const,
  /** Movimento suave e elegante (modais, drawers, reveals) */
  smooth: [0.22, 1, 0.36, 1] as const,
  /** Transição equilibrada para microinterações */
  inOut: [0.4, 0, 0.2, 1] as const,
};

export const MOTION_DURATION = {
  instant: 0.14,
  fast: 0.2,
  normal: 0.3,
  medium: 0.42,
  chart: 0.72,
  counter: 0.65,
} as const;

export const MOTION_SPRING = {
  /** Indicadores de navegação (sidebar pill, abas, botões táteis) */
  snappy: {
    type: 'spring',
    stiffness: 440,
    damping: 34,
    mass: 0.8,
  } satisfies Transition,
  /** Elevação de cards, modais e notificações toast */
  gentle: {
    type: 'spring',
    stiffness: 320,
    damping: 30,
    mass: 0.9,
  } satisfies Transition,
  /** Retorno tátil para clique/toque */
  tap: {
    type: 'spring',
    stiffness: 520,
    damping: 32,
  } satisfies Transition,
};

export const MOTION_VIEWPORT = {
  once: true,
  amount: 0.12 as const,
};

export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.normal,
      ease: MOTION_EASE.outExpo,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: MOTION_DURATION.instant,
      ease: MOTION_EASE.inOut,
    },
  },
};

export const tabSwapVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: MOTION_EASE.outExpo,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: {
      duration: 0.14,
      ease: MOTION_EASE.inOut,
    },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.03,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: MOTION_DURATION.normal,
      ease: MOTION_EASE.outExpo,
    },
  },
};

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

export const modalPanelVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.955,
    y: 14,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: MOTION_EASE.outExpo,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: {
      duration: 0.16,
      ease: MOTION_EASE.inOut,
    },
  },
};

export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 28,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: MOTION_SPRING.gentle,
  },
  exit: {
    opacity: 0,
    x: 24,
    scale: 0.95,
    transition: {
      duration: 0.18,
      ease: MOTION_EASE.inOut,
    },
  },
};
