import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieItem } from '../../types';
import { ContentCard } from './ContentCard';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  items: MovieItem[];
  isTop10?: boolean;
}

export const ContentRow: React.FC<ContentRowProps> = ({ title, subtitle, badge, items, isTop10 = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const distance = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  return (
    <section className="relative w-full py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-end justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display flex items-center gap-2.5">
            <span>{title}</span>
            {badge && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20">
                {badge}
              </span>
            )}
          </h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Scroll Arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Row Container */}
      <div
        ref={scrollRef}
        className="flex items-start gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => (
          <div key={item.id} className="w-36 sm:w-44 md:w-52 shrink-0">
            <ContentCard content={item} rank={isTop10 ? index + 1 : undefined} />
          </div>
        ))}
      </div>
    </section>
  );
};
