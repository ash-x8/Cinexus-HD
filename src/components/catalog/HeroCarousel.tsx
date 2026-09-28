import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Bookmark, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const backdropUrl = current.backdropPath || current.posterPath || '';

  return (
    <div className="relative w-full h-[65vh] sm:h-[75vh] lg:h-[82vh] max-h-[850px] overflow-hidden bg-black select-none">
      {/* Background Image with Cinematic Scrims */}
      <div className="absolute inset-0">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={current.title}
            className="w-full h-full object-cover object-center transition-opacity duration-700 filter brightness-75"
          />
        )}
        {/* Measured Scrims (Anti-AI slop rule 1.F) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080c] via-[#06080c]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080c] via-[#06080c]/60 to-transparent" />
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-2xl space-y-4">
          
          {/* Metadata row (Zero-Pill discipline) */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-300">
            <span className="font-semibold text-red-500 uppercase tracking-wider">{current.quality || '4K UHD'}</span>
            <span aria-hidden="true">·</span>
            <span>{current.releaseYear}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono tabular-nums">{current.rating?.toFixed(1) || '8.5'}</span>
            </span>
            {current.runtime && (
              <>
                <span aria-hidden="true">·</span>
                <span>{current.runtime}</span>
              </>
            )}
            {current.genres?.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
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
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-transform hover:scale-105 shadow-xl shadow-red-950/50"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => navigate(detailUrl)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md border border-white/15 transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>Details</span>
            </button>

            <button
              onClick={() => toggleWatchlist(current)}
              className={`p-3 rounded-xl backdrop-blur-md border transition-colors ${
                isSaved
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
              title={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Navigation Dots & Arrows */}
      {items.length > 1 && (
        <div className="absolute bottom-6 right-4 sm:right-8 z-20 flex items-center gap-3">
          <button
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))}
            className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 backdrop-blur-md transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-red-600' : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
            className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 backdrop-blur-md transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
