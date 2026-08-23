import React from 'react';
import { Logo } from '../common/Logo';
import { BRANDING } from '../../config/branding';

interface PlayerWatermarkProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  opacity?: number;
  className?: string;
}

export const PlayerWatermark: React.FC<PlayerWatermarkProps> = ({
  position = 'top-right',
  opacity = 0.75,
  className = ''
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
    'bottom-right': 'bottom-16 right-4 sm:bottom-20 sm:right-6',
    'top-left': 'top-4 left-4 sm:top-6 sm:left-6',
    'bottom-left': 'bottom-16 left-4 sm:bottom-20 sm:left-6',
  };

  return (
    <div 
      className={`absolute z-30 pointer-events-none select-none transition-opacity duration-300 ${positionClasses[position]} ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <Logo 
        size="xs" 
        variant="watermark" 
        className="shadow-2xl hover:opacity-100 transition-opacity" 
      />
    </div>
  );
};
