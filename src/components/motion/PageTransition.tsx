import React from 'react';
import { motion } from 'motion/react';
import { pageTransitionVariants, tabSwapVariants } from '../../lib/motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'page' | 'tab';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  variant = 'page',
}) => {
  return (
    <motion.div
      variants={variant === 'tab' ? tabSwapVariants : pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};
