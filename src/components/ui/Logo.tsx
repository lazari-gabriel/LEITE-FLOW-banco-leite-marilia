import React from 'react';

export type LogoVariant = 'horizontal' | 'circle' | 'symbol' | 'responsive';
export type LogoTheme = 'light' | 'dark' | 'auto';

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  showSubtext?: boolean;
  subtext?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
  className = '',
  showSubtext = false,
  subtext = 'Banco de Leite Humano · Marília',
  onClick
}) => {
  const isDark = theme === 'dark';

  // Tamanhos padronizados
  const sizeClasses = {
    xs: {
      horizontal: 'h-6',
      circle: 'w-7 h-7',
      symbol: 'w-6 h-6'
    },
    sm: {
      horizontal: 'h-7 sm:h-8',
      circle: 'w-8 h-8 sm:w-9 sm:h-9',
      symbol: 'w-7 h-7 sm:w-8 sm:h-8'
    },
    md: {
      horizontal: 'h-8 sm:h-10',
      circle: 'w-10 h-10 sm:w-11 sm:h-11',
      symbol: 'w-8 h-8 sm:w-10 sm:h-10'
    },
    lg: {
      horizontal: 'h-10 sm:h-12',
      circle: 'w-12 h-12 sm:w-14 sm:h-14',
      symbol: 'w-11 h-11 sm:w-12 sm:h-12'
    },
    xl: {
      horizontal: 'h-14 sm:h-16',
      circle: 'w-16 h-16 sm:w-20 sm:h-20',
      symbol: 'w-14 h-14 sm:w-16 sm:h-16'
    },
    custom: {
      horizontal: '',
      circle: '',
      symbol: ''
    }
  };

  const horizontalSrc = isDark ? '/logo-horizontal-white.png' : '/logo-horizontal.png';
  const circleSrc = isDark ? '/logo-circle-white.png' : '/logo-circle.png';
  const symbolSrc = '/logo-symbol.png';

  const content = (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''
      } ${className}`}
    >
      {variant === 'responsive' ? (
        <>
          {/* Mobile: Símbolo em gota compacto */}
          <div className="flex sm:hidden items-center gap-2">
            <img
              src={symbolSrc}
              alt="LEITE FLOW"
              className={`${sizeClasses[size].symbol} object-contain shrink-0 drop-shadow-xs`}
            />
            <span
              className={`font-serif font-black text-sm tracking-tight ${
                isDark ? 'text-white' : 'text-blh-slate-900'
              }`}
            >
              leite<span className="text-blh-primary font-bold">flow</span>
            </span>
          </div>

          {/* Desktop & Tablet: Logo Horizontal Completo */}
          <div className="hidden sm:flex flex-col">
            <img
              src={horizontalSrc}
              alt="LEITE FLOW"
              className={`${sizeClasses[size].horizontal} w-auto object-contain shrink-0`}
            />
            {showSubtext && (
              <span
                className={`text-[10px] tracking-wider font-semibold uppercase mt-0.5 ${
                  isDark ? 'text-emerald-400' : 'text-blh-slate-500'
                }`}
              >
                {subtext}
              </span>
            )}
          </div>
        </>
      ) : variant === 'circle' ? (
        <div className="flex items-center gap-2.5">
          <img
            src={circleSrc}
            alt="LEITE FLOW"
            className={`${sizeClasses[size].circle} object-contain shrink-0`}
          />
          {showSubtext && (
            <div className="flex flex-col">
              <span
                className={`text-xs font-bold leading-tight ${
                  isDark ? 'text-white' : 'text-blh-slate-900'
                }`}
              >
                LEITE FLOW
              </span>
              <span
                className={`text-[10px] font-medium ${
                  isDark ? 'text-emerald-400' : 'text-blh-slate-500'
                }`}
              >
                {subtext}
              </span>
            </div>
          )}
        </div>
      ) : variant === 'symbol' ? (
        <img
          src={symbolSrc}
          alt="LEITE FLOW"
          className={`${sizeClasses[size].symbol} object-contain shrink-0`}
        />
      ) : (
        <div className="flex flex-col">
          <img
            src={horizontalSrc}
            alt="LEITE FLOW"
            className={`${sizeClasses[size].horizontal} w-auto object-contain shrink-0`}
          />
          {showSubtext && (
            <span
              className={`text-[10px] tracking-wider font-semibold uppercase mt-0.5 ${
                isDark ? 'text-emerald-400' : 'text-blh-slate-500'
              }`}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return content;
};
