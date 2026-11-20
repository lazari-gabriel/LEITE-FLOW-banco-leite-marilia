import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MOTION_EASE } from '../../lib/motion';

interface SkeletonBlockProps {
  className?: string;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ className }) => (
  <div
    aria-hidden="true"
    className={twMerge(clsx('rounded-lg skeleton-shimmer', className))}
  />
);

export const DashboardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="space-y-6"
    role="status"
    aria-label="Carregando painel operacional"
  >
    {/* Hero Banner Skeleton */}
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blh-line shadow-card space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-5 w-44 rounded-md" />
            <SkeletonBlock className="h-5 w-36 rounded-full" />
          </div>
          <SkeletonBlock className="h-8 w-80 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2.5">
          <SkeletonBlock className="h-9 w-36" />
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-blh-line/60">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 rounded-xl" />
        ))}
      </div>
    </div>

    {/* 5 KPI Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-xl border border-blh-line shadow-card space-y-3"
        >
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-8 w-8 rounded-md" />
          </div>
          <SkeletonBlock className="h-8 w-20" />
          <div className="pt-2.5 border-t border-blh-slate-100">
            <SkeletonBlock className="h-3 w-36" />
          </div>
        </div>
      ))}
    </div>

    {/* Pipeline + Chart Skeleton */}
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-blh-line shadow-card space-y-4">
      <SkeletonBlock className="h-6 w-72 max-w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  </motion.div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div
    className="bg-white rounded-xl border border-blh-line shadow-card overflow-hidden"
    role="status"
    aria-label="Carregando registros"
  >
    <div className="p-4 border-b border-blh-line flex items-center justify-between gap-3">
      <SkeletonBlock className="h-9 w-64 max-w-full" />
      <div className="flex gap-2">
        <SkeletonBlock className="h-8 w-20 rounded-full" />
        <SkeletonBlock className="h-8 w-20 rounded-full" />
      </div>
    </div>
    <div className="divide-y divide-blh-line/70">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SkeletonBlock className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <SkeletonBlock className="h-4 w-48 max-w-full" />
              <SkeletonBlock className="h-3 w-72 max-w-full" />
            </div>
          </div>
          <SkeletonBlock className="h-7 w-24 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

export const ModuleLoadingSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24, ease: MOTION_EASE.outExpo }}
    className="space-y-5"
    role="status"
    aria-label="Carregando módulo"
  >
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-blh-line shadow-card space-y-3">
      <SkeletonBlock className="h-5 w-44" />
      <SkeletonBlock className="h-7 w-72 max-w-full" />
      <SkeletonBlock className="h-4 w-96 max-w-full" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-blh-line shadow-card space-y-3">
          <SkeletonBlock className="h-3.5 w-24" />
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
      ))}
    </div>
    <TableSkeleton rows={4} />
  </motion.div>
);

export const SessionLoadingScreen: React.FC = () => (
  <div
    className="min-h-screen bg-blh-bg flex items-center justify-center p-4"
    role="status"
    aria-label="Validando sessão segura LEITE FLOW"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.32, ease: MOTION_EASE.outExpo }}
      className="bg-white border border-blh-line rounded-2xl shadow-elevation px-8 py-7 text-center max-w-xs w-full space-y-4"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-14 h-14 mx-auto rounded-2xl bg-blh-primary-soft border border-blh-line flex items-center justify-center shadow-sm"
      >
        <img
          src="/logo-circle.png"
          alt="LEITE FLOW"
          className="w-10 h-10 object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </motion.div>
      <div className="space-y-1">
        <p className="font-serif font-bold text-base text-blh-slate-900">LEITE FLOW</p>
        <p className="text-xs font-medium text-blh-slate-500">
          Validando sessão segura do BLH...
        </p>
      </div>
      <div className="w-full h-1.5 rounded-full bg-blh-slate-100 overflow-hidden">
        <motion.div
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-blh-primary via-emerald-500 to-blh-primary"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  </div>
);
