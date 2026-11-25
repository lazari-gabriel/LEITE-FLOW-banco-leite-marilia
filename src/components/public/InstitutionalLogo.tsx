import React, { useState } from 'react';

interface InstitutionalLogoProps {
  variant?: 'default' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<InstitutionalLogoProps['size']>, string> = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-20',
};

const TEXT_SIZE_CLASSES: Record<NonNullable<InstitutionalLogoProps['size']>, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export const InstitutionalLogo: React.FC<InstitutionalLogoProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const base = import.meta.env.BASE_URL || '/';
  const sources = [`${base}logo-institucional.png`, `${base}logo-horizontal.png`];
  const [sourceIndex, setSourceIndex] = useState(0);

  const handleError = () => {
    setSourceIndex((prev) => prev + 1);
  };

  const renderGraphic = () => {
    if (sourceIndex >= sources.length) {
      return (
        <span
          className={`font-display font-bold tracking-tight text-[#1E242B] ${TEXT_SIZE_CLASSES[size]}`}
        >
          Leite<span className="text-[#4A6B5D]">Flow</span>
        </span>
      );
    }

    return (
      <img
        src={sources[sourceIndex]}
        alt="LEITFLOW — Banco de Leite Humano de Marília"
        loading="eager"
        decoding="async"
        onError={handleError}
        className={`${sizeClass} w-auto object-contain`}
      />
    );
  };

  if (variant === 'dark') {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-sm flex items-center">
          {renderGraphic()}
        </div>
      </div>
    );
  }

  return <div className={`inline-flex items-center select-none ${className}`}>{renderGraphic()}</div>;
};
