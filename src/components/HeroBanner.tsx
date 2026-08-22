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
  Clapperboard, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';
import { MovieItem } from '../types';

interface HeroBannerProps {
  featuredMovies: MovieItem[];
  onPlayMovie: (movie: MovieItem) => void;
  onOpenDetails: (movie: MovieItem) => void;
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
    const timer = setInterval(() => {
      if (!isTrailerActive) {
        setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
      }
    }, 9000);
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

  return (
    <div id="hero-banner" className="relative w-full h-[80vh] min-h-[600px] max-h-[850px] overflow-hidden select-none">
      
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
            src={currentMovie.backdropUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-center transform scale-105 transition-all duration-1000 ease-out"
          />
        )}

        {/* Ambient Dark Gradient Overlays for High Contrast Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-[#07090e]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/80 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-transparent to-[#07090e]/80" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-2xl space-y-4">
          
          {/* Release / Tech Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-md bg-red-600 text-white shadow-md shadow-red-900/50 uppercase tracking-wider text-[11px] font-bold">
              ★ CINEXUS SPOTLIGHT
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-cyan-300 font-mono">
              {currentMovie.quality}
            </span>
            {currentMovie.hasDolbyAtmos && (
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200">
                Dolby Atmos
              </span>
            )}
            {currentMovie.hasHDR10Plus && (
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-amber-300 font-medium">
                HDR10+
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-slate-300">
              {currentMovie.contentRating}
            </span>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-cinema tracking-tight text-white drop-shadow-2xl leading-none">
              {currentMovie.title}
            </h1>
            {currentMovie.tagline && (
              <p className="text-sm sm:text-base text-red-400 font-medium italic drop-shadow">
                "{currentMovie.tagline}"
              </p>
            )}
          </div>

          {/* Metadata Row: Rating, Year, Duration, Genres */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{currentMovie.rating}</span>
              <span className="text-slate-400 text-xs font-normal">({currentMovie.votesCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-md">
              <span>🍅 {currentMovie.rottenTomatoesScore}% Fresh</span>
            </div>
            <span>•</span>
            <span className="font-semibold text-slate-200">{currentMovie.releaseYear}</span>
            <span>•</span>
            <span>{currentMovie.duration}</span>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              {currentMovie.genres.slice(0, 3).map((g) => (
                <span key={g} className="text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded text-[11px]">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Overview / Synopsis */}
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
            {currentMovie.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            
            {/* Play Movie / Trailer */}
            <button
              id="hero-play-main-btn"
              onClick={() => onPlayMovie(currentMovie)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-red-900/40 hover:shadow-red-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Watch in 4K</span>
            </button>

            {/* Preview Trailer in Background Toggle */}
            {currentMovie.demoVideoUrl && (
              <button
                id="hero-preview-toggle-btn"
                onClick={() => setIsTrailerActive(!isTrailerActive)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  isTrailerActive 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Clapperboard className="w-4 h-4 text-cyan-400" />
                <span>{isTrailerActive ? 'Stop Preview' : 'Teaser Preview'}</span>
              </button>
            )}

            {/* Watchlist Toggle */}
            <button
              id="hero-watchlist-toggle-btn"
              onClick={() => onToggleWatchlist(currentMovie)}
              className={`p-3 rounded-xl border transition-all ${
                inWatchlist 
                  ? 'bg-red-600/30 border-red-500 text-red-400' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            {/* Details Modal Trigger */}
            <button
              id="hero-details-btn"
              onClick={() => onOpenDetails(currentMovie)}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
              title="Full Details & Cast"
            >
              <Info className="w-5 h-5" />
            </button>

          </div>

        </div>

      </div>

      {/* Right Controls: Mute Toggle and Slide Navigation */}
      <div className="absolute bottom-16 right-4 sm:right-8 z-20 flex items-center gap-3">
        
        {isTrailerActive && (
          <button
            id="hero-mute-toggle-btn"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white backdrop-blur-sm transition-all"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 p-1.5 rounded-full backdrop-blur-md">
          <button
            id="hero-prev-slide-btn"
            onClick={prevSlide}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1 px-1">
            {featuredMovies.map((m, idx) => (
              <button
                key={m.id}
                id={`hero-indicator-${idx}`}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsTrailerActive(false);
                }}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex 
                    ? 'w-6 h-2 bg-red-600' 
                    : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <button
            id="hero-next-slide-btn"
            onClick={nextSlide}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
