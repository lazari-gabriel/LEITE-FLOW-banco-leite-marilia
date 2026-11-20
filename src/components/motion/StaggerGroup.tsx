import React from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE, MOTION_VIEWPORT } from '../../lib/motion';

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
  triggerOnScroll?: boolean;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerDelay = 0.055,
  delayChildren = 0.02,
  triggerOnScroll = false,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  if (triggerOnScroll) {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={MOTION_VIEWPORT}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  yOffset?: number;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  yOffset = 12,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: yOffset, scale: 0.985 },
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

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};
