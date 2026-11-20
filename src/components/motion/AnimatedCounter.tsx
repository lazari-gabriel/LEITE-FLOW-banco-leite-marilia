import React, { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion';

export interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Usa formatação pt-BR (separador de milhar / vírgula decimal) quando habilitado */
  localeFormat?: boolean;
}

function formatNumber(num: number, decimals: number, localeFormat: boolean): string {
  if (!Number.isFinite(num)) return '0';
  if (localeFormat) {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return decimals > 0 ? num.toFixed(decimals) : String(Math.round(num));
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 0,
  duration = MOTION_DURATION.counter,
  prefix = '',
  suffix = '',
  className,
  localeFormat = false,
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReducedMotion = useReducedMotion();
  const prevValueRef = useRef<number>(0);
  const [displayValue, setDisplayValue] = useState<string>(() =>
    formatNumber(prefersReducedMotion ? value : 0, decimals, localeFormat)
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      prevValueRef.current = value;
      setDisplayValue(formatNumber(value, decimals, localeFormat));
      return;
    }

    if (!isInView) return;

    const from = prevValueRef.current;
    const to = Number.isFinite(value) ? value : 0;

    if (from === to) {
      setDisplayValue(formatNumber(to, decimals, localeFormat));
      return;
    }

    const controls = animate(from, to, {
      duration,
      ease: MOTION_EASE.outExpo,
      onUpdate: (latest) => {
        setDisplayValue(formatNumber(latest, decimals, localeFormat));
      },
      onComplete: () => {
        prevValueRef.current = to;
        setDisplayValue(formatNumber(to, decimals, localeFormat));
      },
    });

    return () => {
      controls.stop();
    };
  }, [value, decimals, duration, isInView, prefersReducedMotion, localeFormat]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};
