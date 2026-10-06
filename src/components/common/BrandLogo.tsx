import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  className = '',
}) => {
  // Icon dimensions
  const iconDims = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const titleSizes = {
    sm: 'text-sm font-bold',
    md: 'text-base sm:text-lg font-bold',
    lg: 'text-xl sm:text-2xl font-black',
    xl: 'text-2xl sm:text-3xl font-black',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 min-w-0 ${className}`}>
      {/* Modern Fintech Emblem */}
      <div className={`${iconDims} relative flex-shrink-0 group`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            {/* Primary Cobalt-to-Sky Vector Gradient */}
            <linearGradient id="valoraPrimary" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Accent Cyan-to-Emerald Gradient */}
            <linearGradient id="valoraAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Glass Rim Light */}
            <linearGradient id="valoraGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>

            {/* Soft Ambient Shadow */}
            <filter id="valoraShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1d4ed8" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Background Rounded Diamond Shield / Vault Base */}
          <rect
            x="12"
            y="12"
            width="76"
            height="76"
            rx="22"
            transform="rotate(45 50 50)"
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Outer Prismatic Bevel */}
          <rect
            x="14"
            y="14"
            width="72"
            height="72"
            rx="20"
            transform="rotate(45 50 50)"
            fill="none"
            stroke="url(#valoraGlass)"
            strokeWidth="1.2"
            opacity="0.4"
          />

          {/* Central Ascendant 'V' Geometric Monogram (Valora / Valor / Wealth) */}
          <g filter="url(#valoraShadow)">
            {/* Left Ascending Wing */}
            <path
              d="M 28 32 L 48 74 C 49 76 51 76 52 74 L 59 58 L 41 24 C 39.5 21 35 22 33 25 L 28 32 Z"
              fill="url(#valoraPrimary)"
            />

            {/* Right Ascending Diamond Wing (Dynamic Apex) */}
            <path
              d="M 72 32 L 52 74 C 51 76 49 76 48 74 L 41 58 L 59 24 C 60.5 21 65 22 67 25 L 72 32 Z"
              fill="url(#valoraAccent)"
            />

            {/* Center Wealth Core Node */}
            <circle cx="50" cy="46" r="4.5" fill="#38bdf8" />
            <circle cx="50" cy="46" r="2.2" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className={`${titleSizes} tracking-tight text-white flex items-center gap-1.5 truncate`}>
              <span className="font-black tracking-tight">VALORA</span>
              <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent font-bold">FINANZAS</span>
            </h1>
          </div>
          {showSubtitle && (
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wide truncate hidden xs:block">
              Gestión Patrimonial & Flujo Diario
            </p>
          )}
        </div>
      )}
    </div>
  );
};
