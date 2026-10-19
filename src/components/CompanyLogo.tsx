import React, { useState } from 'react';

interface CompanyLogoProps {
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'mark-only' | 'full';
  className?: string;
  darkMode?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  logoUrl,
  size = 'md',
  variant = 'full',
  className = '',
  darkMode = false
}) => {
  const [imgErr, setImgErr] = useState(false);

  // If a valid custom logo URL exists and has not errored, render it
  if (logoUrl && !imgErr) {
    const sizeClasses = {
      sm: 'h-8 max-w-[120px]',
      md: 'h-10 max-w-[170px]',
      lg: 'h-14 max-w-[220px]',
      xl: 'h-20 max-w-[280px]'
    }[size];

    return (
      <img
        src={logoUrl}
        alt="Creative Accessories Logo"
        onError={() => setImgErr(true)}
        className={`${sizeClasses} object-contain shrink-0 ${className}`}
      />
    );
  }

  // Exact vector reproduction of the official Creative Accessories logo
  const markDimensions = {
    sm: { width: 34, height: 34 },
    md: { width: 42, height: 42 },
    lg: { width: 56, height: 56 },
    xl: { width: 80, height: 80 }
  }[size];

  // The mark SVG
  const LogoMark = (
    <svg
      width={markDimensions.width}
      height={markDimensions.height}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
    >
      <defs>
        <linearGradient id="ca-blue-grad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B2A6B" />
          <stop offset="50%" stopColor="#114BA8" />
          <stop offset="100%" stopColor="#0E3882" />
        </linearGradient>
        <linearGradient id="ca-orange-grad" x1="40" y1="140" x2="180" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5722" />
          <stop offset="60%" stopColor="#FF8F00" />
          <stop offset="100%" stopColor="#FFA000" />
        </linearGradient>
      </defs>

      {/* Outer Blue C shape */}
      <path
        d="M 125,24 C 60,24 20,64 20,110 C 20,156 60,190 120,190 C 145,190 168,182 182,170 L 155,142 C 145,150 132,156 118,156 C 80,156 56,132 56,108 C 56,82 82,58 122,58 C 142,58 158,66 168,76 L 194,50 C 176,34 152,24 125,24 Z"
        fill="url(#ca-blue-grad)"
      />

      {/* Dynamic Swoosh Arc in Orange */}
      <path
        d="M 50,172 C 85,155 125,115 186,60 C 160,54 115,75 75,130 Z"
        fill="url(#ca-orange-grad)"
      />

      {/* The A Triangle */}
      <path
        d="M 112,172 L 150,68 L 188,172 L 154,172 L 148,150 L 126,150 L 122,172 Z"
        fill="#0E3882"
      />

      {/* White Garment Tag inside the A */}
      <path
        d="M 136,138 L 145,108 L 152,114 L 144,142 Z"
        fill="#FFFFFF"
      />
      <circle cx="148" cy="113" r="1.8" fill="#0B2A6B" />
    </svg>
  );

  if (variant === 'mark-only') {
    return <div className={`inline-flex items-center ${className}`}>{LogoMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {LogoMark}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline font-black tracking-tight leading-none text-base sm:text-lg">
          <span className={darkMode ? 'text-white' : 'text-[#0B2559]'}>Creative</span>
          <span className="text-[#F37021] ml-1">Accessories</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="h-[1px] w-3 bg-[#0B2559]/40 dark:bg-slate-500" />
          <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-[#0B2559] dark:text-indigo-300 whitespace-nowrap">
            TOTAL TRIMS SOLUTION
          </span>
          <span className="h-[1px] w-3 bg-[#0B2559]/40 dark:bg-slate-500" />
        </div>
        <div className="text-[7.5px] font-bold text-slate-500 dark:text-slate-400 tracking-wider hidden sm:block mt-0.5">
          LABELS · GARMENTS · ACCESSORIES · PRINTING
        </div>
      </div>
    </div>
  );
};
