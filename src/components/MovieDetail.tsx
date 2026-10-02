import React from 'react';
import { 
  Play, 
  Plus, 
  Check, 
  X, 
  Star, 
  Calendar, 
  Clock, 
  Sparkles, 
  Volume2, 
  Subtitles, 
  Tv,
  Film
} from 'lucide-react';
import { MovieItem } from '../types';
import { Link } from 'react-router-dom';

export interface MovieDetailProps {
  movie: MovieItem;
  isOpen: boolean;
  onClose: () => void;
  onPlayMovie?: (movie: MovieItem) => void;
  isInWatchlist?: (movieId: string) => boolean;
  onToggleWatchlist?: (movie: MovieItem) => void;
}

export const MovieDetail: React.FC<MovieDetailProps> = ({
  movie,
  isOpen,
  onClose,
  onPlayMovie,
  isInWatchlist,
  onToggleWatchlist
}) => {
  if (!isOpen || !movie) return null;

  const inWatchlist = isInWatchlist ? isInWatchlist(movie.id) : false;
  const targetWatchUrl = `/watch/${movie.slug || movie.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#12151E] border border-[#D4AF37]/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.2)] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto">
          
          {/* Header Banner Backdrop */}
          <div className="relative aspect-video sm:aspect-[21/9] w-full bg-black overflow-hidden">
            <img
              src={movie.backdropUrl || movie.backdropPath || movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12151E] via-[#12151E]/60 to-transparent" />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Link
                to={targetWatchUrl}
                onClick={(e) => {
                  if (onPlayMovie) {
                    e.preventDefault();
                    onPlayMovie(movie);
                  }
                  onClose();
                }}
                className="w-16 h-16 rounded-full bg-[#D4AF37] hover:bg-amber-300 text-black flex items-center justify-center shadow-2xl transition-transform hover:scale-110 cursor-pointer"
              >
                <Play className="w-8 h-8 fill-current ml-1" />
              </Link>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-8 space-y-6 -mt-8 relative z-10">
            
            {/* Title & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#D4AF37] text-black font-black text-[10px] uppercase tracking-wider">
                  {movie.quality || '4K HDR'}
                </span>
                {movie.hasDolbyAtmos && (
                  <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/15 text-zinc-300 text-[10px] font-bold uppercase">
                    DOLBY ATMOS
                  </span>
                )}
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-black/60 border border-amber-400/40 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.rating || '8.8'}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-xs font-semibold text-[#D4AF37] tracking-wider uppercase">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 border-y border-white/10 py-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                <span>{movie.releaseYear || '2025'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span>{movie.duration || movie.runtime || '2h 15m'}</span>
              </div>
              <div>
                <span className="text-zinc-500">Rating: </span>
                <span className="font-bold text-white">{movie.contentRating || '16+'}</span>
              </div>
              {movie.genres?.length > 0 && (
                <div>
                  <span className="text-zinc-500">Genres: </span>
                  <span className="text-zinc-200">{movie.genres.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Synopsis
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {movie.overview || 'Master quality stream feed prepared with lossless multi-channel sound.'}
              </p>
            </div>

            {/* Tech Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Bitrate Stream</div>
                <div className="text-xs font-black text-[#D4AF37]">4K UHD 60 FPS</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Audio Track</div>
                <div className="text-xs font-black text-white">Dolby Atmos / 5.1</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Subtitles</div>
                <div className="text-xs font-black text-emerald-400">Sinhala & English CC</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Media Type</div>
                <div className="text-xs font-black text-white capitalize">{movie.mediaType || 'Movie'}</div>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
              <Link
                to={targetWatchUrl}
                onClick={(e) => {
                  if (onPlayMovie) {
                    e.preventDefault();
                    onPlayMovie(movie);
                  }
                  onClose();
                }}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-950/40 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Stream Film Now</span>
              </Link>

              {onToggleWatchlist && (
                <button
                  onClick={() => onToggleWatchlist(movie)}
                  className={`px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                    inWatchlist
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-black/60 hover:bg-black/80 border-white/20 text-white'
                  }`}
                >
                  {inWatchlist ? <Check className="w-4 h-4 text-[#D4AF37]" /> : <Plus className="w-4 h-4" />}
                  <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default MovieDetail;
