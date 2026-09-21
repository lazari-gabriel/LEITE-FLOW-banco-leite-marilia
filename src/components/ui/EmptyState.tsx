import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <PackageOpen className="w-10 h-10 text-blh-slate-400" />,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-blh-line bg-blh-slate-50/50 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 border border-blh-line">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-blh-slate-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-blh-slate-500 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
