import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  caption?: string;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'alert' | 'accent' | 'warn' | 'success';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  caption,
  trend,
  icon,
  variant = 'default',
  className
}) => {
  const variantStyles = {
    default: 'bg-white border-blh-line hover:border-blh-line-strong',
    alert: 'bg-white border-red-200 hover:border-red-300 ring-1 ring-red-50',
    accent: 'bg-white border-blh-accent-soft hover:border-blh-accent/30 ring-1 ring-blh-accent-soft',
    warn: 'bg-white border-amber-200 hover:border-amber-300 ring-1 ring-amber-50',
    success: 'bg-white border-emerald-200 hover:border-emerald-300 ring-1 ring-emerald-50',
  };

  const accentColor = {
    default: 'text-blh-slate-900',
    alert: 'text-blh-danger',
    accent: 'text-blh-accent-dark',
    warn: 'text-blh-amber-dark',
    success: 'text-blh-success',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'relative p-5 rounded-lg border shadow-card transition-all duration-200 hover:shadow-md flex flex-col justify-between group',
          variantStyles[variant],
          className
        )
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-blh-slate-600 uppercase tracking-wider">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-md bg-blh-slate-100 flex items-center justify-center text-blh-slate-600 group-hover:bg-blh-primary-soft group-hover:text-blh-primary transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="my-1">
        <div className={clsx('text-2xl lg:text-3xl font-bold font-sans tabular-nums tracking-tight', accentColor[variant])}>
          {value}
        </div>
      </div>

      {(caption || trend) && (
        <div className="flex items-center justify-between gap-2 mt-2 pt-2.5 border-t border-blh-slate-100 text-xs text-blh-slate-600">
          {caption && <span className="truncate font-medium">{caption}</span>}
          {trend && (
            <span
              className={clsx(
                'font-semibold shrink-0 flex items-center gap-0.5',
                trend.isPositive ? 'text-emerald-700' : 'text-rose-700'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
