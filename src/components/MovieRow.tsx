import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { MovieItem, WatchProgress } from '../types';
import { MovieCard } from './MovieCard';

interface MovieRowProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  movies: MovieItem[];
  isTop10?: boolean;
  onPlayMovie: (movie: MovieItem) => void;
  onOpenDetails: (movie: MovieItem) => void;
  isInWatchlist: (movieId: string) => boolean;
  onToggleWatchlist: (movie: MovieItem) => void;
  watchProgressMap?: Record<string, WatchProgress>;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  id,
  title,
  subtitle,
  icon,
  badge,
  movies,
  isTop10 = false,
  onPlayMovie,
  onOpenDetails,
  isInWatchlist,
  onToggleWatchlist,
  watchProgressMap = {}
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (movies.length === 0) return null;

  return (
    <section id={`row-${id}`} className="py-4 sm:py-6 relative">
      
      {/* Row Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 sm:mb-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            {icon && <div className="text-red-500">{icon}</div>}
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-display text-white tracking-wide">
              {title}
            </h2>
            {badge && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/40">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Scroll Arrows */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            id={`row-prev-btn-${id}`}
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id={`row-next-btn-${id}`}
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Container */}
      <div className="relative group">
        <div
          ref={rowRef}
          className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 pb-3"
          style={{ scrollbarWidth: 'none' }}
        >
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              rank={isTop10 ? index + 1 : undefined}
              onPlayMovie={onPlayMovie}
              onOpenDetails={onOpenDetails}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={onToggleWatchlist}
              watchProgress={watchProgressMap[movie.id]}
            />
          ))}
        </div>
      </div>

    </section>
  );
};
