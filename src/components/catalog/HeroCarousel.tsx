import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Bookmark, Star, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { MovieItem } from '../../types';
import { usePlayer } from '../../context/PlayerContext';

interface HeroCarouselProps {
  items: MovieItem[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ items }) => {
  const navigate = useNavigate();
  const { toggleWatchlist, isInWatchlist, playContent } = usePlayer();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slides every 8 seconds
  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];
  if (!current) return null;

  const isSaved = isInWatchlist(current.id);
  const detailUrl = current.mediaType === 'movie' ? `/movie/${current.slug || current.id}` : `/tv/${current.slug || current.id}`;
  const backdropUrl = current.backdropPath || current.posterPath || (current as any).backdropUrl || (current as any).posterUrl || '';

  return (
    <div className="relative w-full h-[65vh] sm:h-[75vh] lg:h-[82vh] max-h-[850px] overflow-hidden bg-[#0B0D12] select-none">
      {/* Background Image with Cinematic Scrims */}
      <div className="absolute inset-0">
        {backdropUrl && (
          <img
            key={current.id}
            src={backdropUrl}
            alt={current.title}
            className="w-full h-full object-cover object-center transition-all duration-1000 filter brightness-75 scale-100 animate-fadeIn"
          />
        )}
        {/* Measured Luxury Obsidian Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-[#0B0D12]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D12] via-[#0B0D12]/75 to-transparent" />
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-2xl space-y-4">
          
          {/* Metadata row */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-300">
            <span className="font-bold text-amber-400 tracking-wider uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {current.quality || '4K ULTRA HD'}
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>{current.releaseYear || (current as any).releaseDate?.slice(0, 4)}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono tabular-nums">{current.rating?.toFixed(1) || '8.5'}</span>
            </span>
            {current.runtime && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>{current.runtime}</span>
              </>
            )}
            {current.genres?.length > 0 && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>{current.genres.slice(0, 2).join(' / ')}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display leading-tight drop-shadow-md">
            {current.title}
          </h1>

          {/* Synopsis */}
          <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 leading-relaxed drop-shadow">
            {current.overview}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => playContent(current)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm tracking-wide uppercase transition-all hover:scale-105 shadow-xl shadow-amber-950/50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5 text-zinc-950" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => navigate(detailUrl)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md border border-white/15 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>Details</span>
            </button>

            <button
              onClick={() => toggleWatchlist(current)}
              className={`p-3 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(229,169,60,0.3)]'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
              title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isSaved ? <Check className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Slide Controls */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all hover:scale-110 cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all hover:scale-110 cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot Navigation Indicators */}
          <div className="absolute bottom-6 right-6 sm:right-8 z-20 flex items-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'w-8 bg-amber-400 shadow-[0_0_10px_rgba(229,169,60,0.8)]'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
