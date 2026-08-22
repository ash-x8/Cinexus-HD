import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showSubtitle = false,
  className = '' 
}) => {
  const scaleMap = {
    sm: { height: 28, text: 'text-lg', sub: 'text-[8px]', reel: 26 },
    md: { height: 36, text: 'text-2xl', sub: 'text-[9px]', reel: 34 },
    lg: { height: 48, text: 'text-3xl', sub: 'text-[11px]', reel: 44 },
    xl: { height: 64, text: 'text-4xl sm:text-5xl', sub: 'text-xs', reel: 58 }
  };

  const current = scaleMap[size];

  return (
    <div className={`flex items-center gap-2 select-none group ${className}`}>
      {/* Brand Cinema Film-Reel Emblem */}
      <div 
        style={{ width: current.reel, height: current.reel }} 
        className="relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Film-strip reel curved into C shape */}
          <defs>
            <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff2a3b" />
              <stop offset="50%" stopColor="#e50914" />
              <stop offset="100%" stopColor="#990008" />
            </linearGradient>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff4d5a" stopOpacity="0" />
            </linearGradient>
            <filter id="neonShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#e50914" floodOpacity="0.6"/>
            </filter>
          </defs>

          {/* Curved Ribbon Outer C-Reel */}
          <path 
            d="M82,20 C65,6 35,8 18,25 C2,42 2,68 18,82 C35,96 68,95 82,78 L70,68 C60,80 38,81 27,71 C16,61 16,42 27,31 C38,20 60,20 70,30 Z" 
            fill="url(#redGrad)" 
            filter="url(#neonShadow)"
          />

          {/* Film perforations (sprocket holes) on curved reel ribbon */}
          <rect x="22" y="24" width="3" height="5" rx="1" transform="rotate(-35 22 24)" fill="#111827" />
          <rect x="13" y="38" width="3" height="5" rx="1" transform="rotate(-15 13 38)" fill="#111827" />
          <rect x="11" y="54" width="3" height="5" rx="1" transform="rotate(10 11 54)" fill="#111827" />
          <rect x="16" y="68" width="3" height="5" rx="1" transform="rotate(30 16 68)" fill="#111827" />
          <rect x="28" y="78" width="3" height="5" rx="1" transform="rotate(50 28 78)" fill="#111827" />

          {/* Glossy highlight ribbon */}
          <path 
            d="M75,23 C60,12 38,12 24,25" 
            stroke="url(#glowGrad)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />

          {/* Central Play Triangle */}
          <polygon 
            points="42,32 72,50 42,68" 
            fill="url(#redGrad)" 
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          />
          <polygon 
            points="44,36 68,50 44,64" 
            fill="#ff3b4b" 
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Typography Wordmark: C - INE - X - US */}
      <div className="flex flex-col">
        <div className={`flex items-baseline font-black tracking-wider uppercase font-cinema leading-none ${current.text}`}>
          <span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]">C</span>
          <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">INE</span>
          <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-br from-red-400 via-red-600 to-red-700 font-extrabold mx-0.5 transform -skew-x-6 drop-shadow-[0_0_12px_rgba(229,9,20,0.8)]">
            X
          </span>
          <span className="text-red-600 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">US</span>
        </div>

        {showSubtitle && (
          <span className={`text-slate-400 font-bold uppercase tracking-[0.25em] ${current.sub} mt-0.5`}>
            Ultra Cinema Stream
          </span>
        )}
      </div>
    </div>
  );
};
