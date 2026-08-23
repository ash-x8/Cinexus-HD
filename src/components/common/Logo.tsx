import React from 'react';
import { BRANDING } from '../../config/branding';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'badge' | 'watermark' | 'icon';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'horizontal',
  showSubtitle = false,
  className = '',
  onClick
}) => {
  // Size dimensions
  const scaleMap = {
    xs: { height: 20, iconSize: 22, text: 'text-sm', subText: 'text-[7px]' },
    sm: { height: 26, iconSize: 28, text: 'text-lg', subText: 'text-[8px]' },
    md: { height: 34, iconSize: 36, text: 'text-2xl', subText: 'text-[9px]' },
    lg: { height: 46, iconSize: 48, text: 'text-3xl sm:text-4xl', subText: 'text-[11px]' },
    xl: { height: 60, iconSize: 64, text: 'text-4xl sm:text-5xl', subText: 'text-xs' }
  };

  const current = scaleMap[size];

  // SVG Cinema Film-Reel 3D Icon with play triangle
  const ReelIcon = ({ sz = current.iconSize }: { sz?: number }) => (
    <div 
      style={{ width: sz, height: sz }} 
      className="relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_0_14px_rgba(229,9,20,0.65)]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cinexusRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3344" />
            <stop offset="45%" stopColor="#e50914" />
            <stop offset="85%" stopColor="#aa050f" />
            <stop offset="100%" stopColor="#660007" />
          </linearGradient>

          <linearGradient id="cinexusBevelHighlight" x1="15%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#ff6b77" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="cinexusSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>

          <filter id="cinexusGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#e50914" floodOpacity="0.75"/>
          </filter>
        </defs>

        {/* Outer 3D Film-Strip Reel curved into 'C' */}
        <path 
          d="M84,18 C66,4 34,6 17,23 C0,41 0,69 17,84 C34,98 69,97 84,79 L71,68 C60,80 38,81 26,71 C15,60 15,40 26,29 C38,18 60,18 71,29 Z" 
          fill="url(#cinexusRedGrad)" 
          filter="url(#cinexusGlowFilter)"
        />

        {/* Film Perforations (curved sprocket square cutouts) */}
        <rect x="22" y="24" width="3.5" height="5.5" rx="1" transform="rotate(-36 22 24)" fill="#07090e" />
        <rect x="13" y="38" width="3.5" height="5.5" rx="1" transform="rotate(-16 13 38)" fill="#07090e" />
        <rect x="11" y="54" width="3.5" height="5.5" rx="1" transform="rotate(12 11 54)" fill="#07090e" />
        <rect x="16" y="69" width="3.5" height="5.5" rx="1" transform="rotate(32 16 69)" fill="#07090e" />
        <rect x="28" y="79" width="3.5" height="5.5" rx="1" transform="rotate(52 28 79)" fill="#07090e" />

        {/* Metallic Bevel Lip Reflection */}
        <path 
          d="M78,21 C62,11 38,11 23,24" 
          stroke="url(#cinexusBevelHighlight)" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
        />

        {/* Inner Solid Play Triangle in vivid ruby red */}
        <polygon 
          points="41,31 73,50 41,69" 
          fill="url(#cinexusRedGrad)" 
          className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
        />
        <polygon 
          points="43,35 69,50 43,65" 
          fill="#ff2a3b" 
          opacity="0.95"
        />
      </svg>
    </div>
  );

  // 1. Watermark Variant (clean, subtle, non-intrusive for player overlay)
  if (variant === 'watermark') {
    return (
      <div 
        className={`flex items-center gap-1.5 select-none pointer-events-none opacity-80 backdrop-blur-[2px] px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 ${className}`}
      >
        <ReelIcon sz={20} />
        <div className="flex items-baseline font-black tracking-wider uppercase font-cinema leading-none text-xs">
          <span className="text-white">CINE</span>
          <span className="text-red-500 font-extrabold mx-0.5 transform -skew-x-6">X</span>
          <span className="text-red-500">US</span>
        </div>
      </div>
    );
  }

  // 2. Circular Badge Variant (matching provided square badge artwork)
  if (variant === 'badge') {
    return (
      <div 
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center p-6 rounded-full bg-gradient-to-b from-[#151b26] to-[#07090e] border-2 border-red-600/40 shadow-[0_0_35px_rgba(229,9,20,0.35)] select-none group cursor-pointer ${className}`}
      >
        {/* Glowing Halo */}
        <div className="absolute inset-0 rounded-full border border-red-500/20 animate-pulse pointer-events-none" />
        
        <ReelIcon sz={current.iconSize * 1.5} />
        
        <div className="flex items-baseline font-black tracking-widest uppercase font-cinema leading-none text-xl sm:text-2xl mt-3">
          <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">CINE</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-rose-600 font-extrabold mx-0.5 transform -skew-x-6 drop-shadow-[0_0_10px_rgba(229,9,20,0.9)]">
            X
          </span>
          <span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]">US</span>
        </div>
        
        <span className="text-[9px] font-bold text-slate-300 tracking-[0.25em] uppercase mt-1.5 opacity-90">
          {BRANDING.tagline}
        </span>
      </div>
    );
  }

  // 3. Icon Only Variant
  if (variant === 'icon') {
    return (
      <div onClick={onClick} className={`select-none ${className}`}>
        <ReelIcon />
      </div>
    );
  }

  // 4. Default Horizontal Wordmark Logo
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2 select-none group cursor-pointer ${className}`}
    >
      <ReelIcon />

      <div className="flex flex-col">
        <div className={`flex items-baseline font-black tracking-wider uppercase font-cinema leading-none ${current.text}`}>
          <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">CINE</span>
          <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-br from-red-400 via-red-500 to-rose-600 font-extrabold mx-0.5 transform -skew-x-6 drop-shadow-[0_0_12px_rgba(229,9,20,0.85)]">
            X
          </span>
          <span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]">US</span>
        </div>

        {showSubtitle && (
          <span className={`text-slate-400 font-bold uppercase tracking-[0.25em] ${current.subText} mt-0.5`}>
            {BRANDING.tagline}
          </span>
        )}
      </div>
    </div>
  );
};
