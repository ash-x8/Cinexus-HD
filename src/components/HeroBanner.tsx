import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Info, 
  Plus, 
  Check, 
  Volume2, 
  VolumeX, 
  Star, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Film,
  Tv
} from 'lucide-react';
import { MovieItem } from '../types';
import { Link } from 'react-router-dom';

export interface HeroBannerProps {
  featuredMovies: MovieItem[];
  onPlayMovie?: (movie: MovieItem) => void;
  onOpenDetails?: (movie: MovieItem) => void;
  isInWatchlist: (movieId: string) => boolean;
  onToggleWatchlist: (movie: MovieItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredMovies,
  onPlayMovie,
  onOpenDetails,
  isInWatchlist,
  onToggleWatchlist
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isTrailerActive, setIsTrailerActive] = useState(false);

  const currentMovie = featuredMovies[currentIndex] || featuredMovies[0];

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setInterval(() => {
      if (!isTrailerActive) {
        setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
      }
    }, 8500);
    return () => clearInterval(timer);
  }, [featuredMovies.length, isTrailerActive]);

  if (!currentMovie) return null;

  const inWatchlist = isInWatchlist(currentMovie.id);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    setIsTrailerActive(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
    setIsTrailerActive(false);
  };

  const targetWatchUrl = `/watch/${currentMovie.slug || currentMovie.id}`;

  return (
    <div id="hero-banner" className="relative w-full h-[85vh] min-h-[620px] max-h-[880px] overflow-hidden select-none bg-[#07090e]">
      
      {/* Background Backdrop or Live Video Preview */}
      <div className="absolute inset-0 z-0">
        {isTrailerActive && currentMovie.demoVideoUrl ? (
          <video
            autoPlay
            loop
            muted={isMuted}
            playsInline
            src={currentMovie.demoVideoUrl}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={currentMovie.backdropUrl || currentMovie.backdropPath || currentMovie.posterUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-center transform scale-105 transition-all duration-1000 ease-out"
          />
        )}

        {/* Ambient Dark Cinema Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/70 to-[#07090e]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/85 to-transparent w-full md:w-3/4" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-2xl space-y-4 animate-fadeIn">
          
          {/* Release / Tech Badges in Dark Gold */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black shadow-lg shadow-amber-950/60 uppercase tracking-widest text-[10px] font-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>CINEXUS PREMIERE</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-[11px] uppercase">
              {currentMovie.quality || '4K ULTRA HD'}
            </span>

            {currentMovie.hasDolbyAtmos && (
              <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-zinc-300 font-mono text-[10px] uppercase">
                DOLBY ATMOS
              </span>
            )}

            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{currentMovie.rating || '8.9'}</span>
            </div>
          </div>

          {/* Title with Gold-Trimmed Display Typography */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white font-display tracking-tight leading-[1.1] drop-shadow-2xl">
            {currentMovie.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
            <span>{currentMovie.releaseYear || '2025'}</span>
            <span>·</span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
              {currentMovie.contentRating || '16+'}
            </span>
            <span>·</span>
            <span>{currentMovie.duration || currentMovie.runtime || '2h 14m'}</span>
            <span>·</span>
            <span className="text-[#D4AF37] font-semibold">
              {currentMovie.genres?.slice(0, 3).join(', ') || 'Action, Sci-Fi'}
            </span>
          </div>

          {/* Plot Overview */}
          <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
            {currentMovie.overview || currentMovie.tagline || 'Experience high-bitrate 4K streaming playback with lossless multichannel audio.'}
          </p>

          {/* Interactive CTA Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              to={targetWatchUrl}
              onClick={(e) => {
                if (onPlayMovie) {
                  e.preventDefault();
                  onPlayMovie(currentMovie);
                }
              }}
              className="px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-xl shadow-amber-950/50 hover:scale-105 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Stream in 4K</span>
            </Link>

            <button
              onClick={() => onToggleWatchlist(currentMovie)}
              className={`px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                inWatchlist
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                  : 'bg-black/60 hover:bg-black/80 border-white/20 text-white hover:border-[#D4AF37]/50'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4 text-[#D4AF37]" /> : <Plus className="w-4 h-4" />}
              <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </button>

            {onOpenDetails && (
              <button
                onClick={() => onOpenDetails(currentMovie)}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors cursor-pointer"
                title="View Full Film Details"
              >
                <Info className="w-4 h-4" />
              </button>
            )}

            {currentMovie.demoVideoUrl && (
              <button
                onClick={() => setIsTrailerActive(!isTrailerActive)}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors cursor-pointer hidden sm:flex items-center gap-2 text-xs font-bold"
              >
                <Film className="w-4 h-4 text-[#D4AF37]" />
                <span>{isTrailerActive ? 'Close Trailer' : 'Preview Trailer'}</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Slide Navigation Controls */}
      {featuredMovies.length > 1 && (
        <div className="absolute bottom-8 right-6 z-20 flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 text-white hover:text-[#D4AF37] transition-all cursor-pointer backdrop-blur-md"
            title="Previous Featured Film"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex gap-1.5 px-2">
            {featuredMovies.slice(0, 6).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-[#D4AF37]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 text-white hover:text-[#D4AF37] transition-all cursor-pointer backdrop-blur-md"
            title="Next Featured Film"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
