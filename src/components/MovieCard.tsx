import React, { useState, useRef } from 'react';
import { 
  Play, 
  Plus, 
  Check, 
  Info, 
  Star, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Bookmark
} from 'lucide-react';
import { MovieItem, WatchProgress } from '../types';
import { Link, useNavigate } from 'react-router-dom';

export interface MovieCardProps {
  movie: MovieItem;
  rank?: number;
  onPlayMovie?: (movie: MovieItem) => void;
  onOpenDetails?: (movie: MovieItem) => void;
  isInWatchlist?: (movieId: string) => boolean;
  onToggleWatchlist?: (movie: MovieItem) => void;
  watchProgress?: WatchProgress;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  rank,
  onPlayMovie,
  onOpenDetails,
  isInWatchlist,
  onToggleWatchlist,
  watchProgress
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const inWatchlist = isInWatchlist ? isInWatchlist(movie.id) : false;
  const targetWatchUrl = `/watch/${movie.slug || movie.id}`;

  // Clicking anywhere on the movie card immediately opens/plays the movie
  const handleCardClick = (e: React.MouseEvent) => {
    // If user clicked sub-buttons like Watchlist or Info, let those handle it
    const target = e.target as HTMLElement;
    if (target.closest('button[data-subaction]')) {
      return;
    }

    if (onPlayMovie) {
      onPlayMovie(movie);
    } else {
      navigate(targetWatchUrl);
    }
  };

  // 3D Card Hover Tilt Micro-interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg
    const rotateY = ((x - centerX) / centerX) * 6; // max 6 deg
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setVideoLoaded(false);
  };

  return (
    <div
      ref={cardRef}
      id={`movie-card-${movie.id}`}
      onClick={handleCardClick}
      className="relative flex-shrink-0 group cursor-pointer w-44 sm:w-52 md:w-56 select-none transition-transform duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px'
      }}
    >
      {/* Top 10 Giant Rank Number */}
      {rank !== undefined && (
        <div className="absolute -left-3 bottom-3 z-10 select-none pointer-events-none">
          <span 
            className="text-7xl sm:text-8xl font-black font-display text-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
            style={{
              WebkitTextStroke: '2px #D4AF37',
              textShadow: '0 0 25px rgba(212,175,55,0.4)'
            }}
          >
            {rank}
          </span>
        </div>
      )}

      {/* Main Poster Container with 3D Tilt */}
      <div 
        style={{
          transform: isHovered 
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.04, 1.04, 1.04)` 
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease'
        }}
        className={`relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0e111a] border border-white/10 group-hover:border-[#D4AF37]/80 shadow-lg group-hover:shadow-[0_10px_35px_rgba(212,175,55,0.25)] ${
          rank ? 'ml-6' : ''
        }`}
      >
        {/* Poster Image */}
        <img
          src={movie.posterUrl || movie.posterPath || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80'}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Hover Trailer / Video Preview */}
        {isHovered && movie.demoVideoUrl && (
          <div className="absolute inset-0 z-10 bg-black animate-fadeIn">
            <video
              src={movie.demoVideoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onLoadedData={() => setVideoLoaded(true)}
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:text-[#D4AF37] transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm uppercase tracking-wider">
            {movie.quality || '4K HDR'}
          </span>
          {movie.hasDolbyAtmos && (
            <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-zinc-300 border border-white/10 uppercase">
              ATMOS
            </span>
          )}
        </div>

        {/* Rating Badge */}
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-amber-400/40 text-amber-400 text-xs font-bold shadow">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{movie.rating || '8.8'}</span>
          </div>
        </div>

        {/* Watch Progress Bar */}
        {watchProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/80 z-20">
            <div 
              className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-500 rounded-r"
              style={{ width: `${watchProgress.percentage}%` }}
            />
          </div>
        )}

        {/* Cinematic Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity pointer-events-none" />

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent z-20 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <h4 className="text-xs font-bold text-white truncate drop-shadow">{movie.title}</h4>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
            <span>{movie.releaseYear || '2025'}</span>
            <span className="text-[#D4AF37] font-semibold">{movie.genres?.[0] || 'Feature'}</span>
          </div>

          <div className="flex items-center gap-2 mt-2.5">
            <Link
              to={targetWatchUrl}
              onClick={(e) => {
                if (onPlayMovie) {
                  e.preventDefault();
                  onPlayMovie(movie);
                }
              }}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Watch</span>
            </Link>

            {onToggleWatchlist && (
              <button
                data-subaction="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist(movie);
                }}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  inWatchlist
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                }`}
                title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            )}

            {onOpenDetails && (
              <button
                data-subaction="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(movie);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors cursor-pointer"
                title="View Full Details"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Title Below Card for Static Viewing */}
      <div className="pt-2 px-1">
        <h3 className="text-xs font-bold text-slate-200 group-hover:text-[#D4AF37] truncate transition-colors">
          {movie.title}
        </h3>
        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
          {movie.releaseYear || '2025'} · {movie.genres?.slice(0, 2).join(', ') || 'Cinema'}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
