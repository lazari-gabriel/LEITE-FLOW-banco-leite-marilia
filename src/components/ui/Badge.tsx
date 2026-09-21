import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'zone';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  icon,
  dot = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full border transition-colors select-none';

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 leading-tight',
    md: 'text-xs px-3 py-1 gap-2 leading-tight',
  };

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-300/80',
    danger: 'bg-rose-50 text-rose-900 border-rose-300/80',
    warning: 'bg-amber-50 text-amber-950 border-amber-300/80',
    info: 'bg-sky-50 text-sky-950 border-sky-300/80',
    neutral: 'bg-blh-slate-100 text-blh-slate-800 border-blh-slate-300',
    zone: 'bg-blh-primary-soft text-blh-primary font-bold border-blh-line-strong',
  };

  const dotColors = {
    success: 'bg-emerald-600',
    danger: 'bg-rose-600',
    warning: 'bg-amber-600',
    info: 'bg-sky-600',
    neutral: 'bg-blh-slate-500',
    zone: 'bg-blh-primary',
  };

  return (
    <span className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))} {...props}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {icon}
      <span>{children}</span>
    </span>
  );
};
