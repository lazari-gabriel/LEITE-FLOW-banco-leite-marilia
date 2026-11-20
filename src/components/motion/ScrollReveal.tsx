import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE, MOTION_VIEWPORT } from '../../lib/motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  delay?: number;
  duration?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  direction = 'up',
  distance = 16,
  delay = 0,
  duration = MOTION_DURATION.medium,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={MOTION_VIEWPORT}
      transition={{
        duration,
        delay,
        ease: MOTION_EASE.outExpo,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
