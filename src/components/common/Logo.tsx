import React, { useState } from 'react';
import { BRANDING } from '../../config/branding';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'badge' | 'watermark' | 'icon';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
  customLogoUrl?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'horizontal',
  showSubtitle = false,
  className = '',
  onClick,
  customLogoUrl
}) => {
  const [hasError, setHasError] = useState(false);
  const logoSrc = customLogoUrl || BRANDING.logoUrl;

  // Scale map for heights
  const scaleMap = {
    xs: { height: 'h-5', px: 20, text: 'text-xs', subText: 'text-[7px]' },
    sm: { height: 'h-7', px: 28, text: 'text-sm', subText: 'text-[8px]' },
    md: { height: 'h-9', px: 36, text: 'text-lg', subText: 'text-[9px]' },
    lg: { height: 'h-12', px: 48, text: 'text-2xl', subText: 'text-[11px]' },
    xl: { height: 'h-16', px: 64, text: 'text-3xl', subText: 'text-xs' }
  };

  const current = scaleMap[size];

  // 1. Watermark Variant (for player overlay, subtle & unobtrusive)
  if (variant === 'watermark') {
    return (
      <div 
        className={`flex items-center gap-1.5 select-none pointer-events-none opacity-85 hover:opacity-100 transition-opacity filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] ${className}`}
      >
        <img
          src={logoSrc}
          alt="CINEXUS"
          className="h-6 sm:h-7 w-auto object-contain"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // 2. Circular / Prominent Badge Variant (for login, signup, hero, intro)
  if (variant === 'badge') {
    return (
      <div 
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-[#141a24] to-[#07090e] border border-red-600/30 shadow-[0_0_40px_rgba(229,9,20,0.35)] select-none group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-red-500/60 ${className}`}
      >
        <div className="absolute inset-0 rounded-3xl border border-red-500/10 pointer-events-none" />
        <img
          src={logoSrc}
          alt="CINEXUS"
          className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(229,9,20,0.7)] transition-transform duration-300 group-hover:scale-105"
          onError={() => setHasError(true)}
        />
        {showSubtitle && (
          <span className="text-[10px] font-bold text-slate-300 tracking-[0.25em] uppercase mt-2.5 opacity-90">
            {BRANDING.tagline}
          </span>
        )}
      </div>
    );
  }

  // 3. Icon Only Variant
  if (variant === 'icon') {
    return (
      <div onClick={onClick} className={`select-none shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <img
          src={logoSrc}
          alt="CINEXUS"
          className={`${current.height} w-auto object-contain filter drop-shadow-[0_0_12px_rgba(229,9,20,0.6)]`}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // 4. Default Horizontal Brand Mark
  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none group ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={logoSrc}
        alt="CINEXUS"
        className={`${current.height} w-auto object-contain filter drop-shadow-[0_0_15px_rgba(229,9,20,0.5)] transition-transform duration-200 group-hover:scale-105`}
        onError={() => setHasError(true)}
      />

      {showSubtitle && (
        <span className={`text-slate-400 font-bold uppercase tracking-[0.2em] ${current.subText} hidden sm:inline-block ml-1`}>
          {BRANDING.tagline}
        </span>
      )}
    </div>
  );
};
