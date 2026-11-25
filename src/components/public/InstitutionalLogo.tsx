import React, { useState } from 'react';

interface InstitutionalLogoProps {
  variant?: 'default' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

const ICON_SIZE_CLASSES: Record<NonNullable<InstitutionalLogoProps['size']>, string> = {
  sm: 'h-7 w-auto',
  md: 'h-9 w-auto',
  lg: 'h-11 w-auto',
  xl: 'h-14 w-auto',
};

const TITLE_SIZE_CLASSES: Record<NonNullable<InstitutionalLogoProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-lg sm:text-[19px]',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export const InstitutionalLogo: React.FC<InstitutionalLogoProps> = ({
  variant = 'default',
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const base = import.meta.env.BASE_URL || '/';
  const sources = [`${base}logo-mark.png`, `${base}logo-symbol.png`];
  const [sourceIndex, setSourceIndex] = useState(0);

  const isDark = variant === 'dark';

  const renderMark = () => {
    if (sourceIndex >= sources.length) {
      return (
        <svg
          viewBox="0 0 40 32"
          aria-hidden="true"
          className={`${ICON_SIZE_CLASSES[size]} shrink-0 text-[#1F93DC]`}
          fill="none"
        >
          <path
            d="M11 3C11 3 4 12.2 4 17.5C4 21.6 7.1 25 11 25C14.9 25 18 21.6 18 17.5C18 12.2 11 3 11 3Z"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 22C6.5 28 15 29.5 21 22.5C25.5 17.2 28.5 7 37 6"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    return (
      <img
        src={sources[sourceIndex]}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        onError={() => setSourceIndex((prev) => prev + 1)}
        className={`${ICON_SIZE_CLASSES[size]} shrink-0 object-contain`}
      />
    );
  };

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        isDark ? 'text-white' : 'text-[#1E242B]'
      } ${className}`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-xl transition-colors ${
          isDark ? 'bg-white/95 px-2 py-1.5 shadow-sm' : ''
        }`}
      >
        {renderMark()}
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-semibold tracking-[-0.02em] ${TITLE_SIZE_CLASSES[size]} ${
            isDark ? 'text-white' : 'text-[#1E242B]'
          }`}
        >
          LEIT<span className={isDark ? 'text-[#A8C9B9]' : 'text-[#4A6B5D]'}>FLOW</span>
        </span>
        {showSubtitle && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.14em] mt-1 ${
              isDark ? 'text-white/65' : 'text-[#6E7781]'
            }`}
          >
            BLH · Marília – SP
          </span>
        )}
      </span>
    </div>
  );
};
