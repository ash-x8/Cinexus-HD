import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  Check, 
  Info, 
  Star, 
  Sparkles, 
  Volume2, 
  Eye 
} from 'lucide-react';
import { MovieItem, WatchProgress } from '../types';

interface MovieCardProps {
  movie: MovieItem;
  rank?: number;
  onPlayMovie: (movie: MovieItem) => void;
  onOpenDetails: (movie: MovieItem) => void;
  isInWatchlist: (movieId: string) => boolean;
  onToggleWatchlist: (movie: MovieItem) => void;
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
  const [isHovered, setIsHovered] = useState(false);
  const inWatchlist = isInWatchlist(movie.id);

  return (
    <div
      id={`movie-card-${movie.id}`}
      className="relative flex-shrink-0 group cursor-pointer transition-all duration-300 w-44 sm:w-52 md:w-56"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top 10 Giant Rank Number */}
      {rank !== undefined && (
        <div className="absolute -left-3 bottom-4 z-10 select-none pointer-events-none">
          <span 
            className="text-7xl sm:text-8xl font-black font-cinema text-[#07090e] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] stroke-cyan"
            style={{
              WebkitTextStroke: '2px #33445f',
              textShadow: '0 0 20px rgba(0,0,0,0.8)'
            }}
          >
            {rank}
          </span>
        </div>
      )}

      {/* Main Poster Container */}
      <div 
        onClick={() => onOpenDetails(movie)}
          className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900/80 border border-white/10 group-hover:border-red-500/60 shadow-lg group-hover:shadow-2xl group-hover:shadow-red-950/40 group-hover:-translate-y-1.5 transition-all duration-300 ${
          rank ? 'ml-6' : ''
        }`}
      >
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Quality Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-cyan-500/40 shadow">
            {movie.quality}
          </span>
          {movie.hasDolbyAtmos && (
            <span className="px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-[9px] font-medium text-slate-300 border border-slate-700">
              ATMOS
            </span>
          )}
        </div>

        {/* Rating Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-amber-400/40 text-amber-400 text-xs font-bold shadow">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{movie.rating}</span>
          </div>
        </div>

        {/* Watch Progress Bar (if user watched before) */}
        {watchProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-950/90 z-20">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-r"
              style={{ width: `${watchProgress.percentage}%` }}
            />
          </div>
        )}

        {/* Dark Hover Overlay with Quick Action Buttons */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/75 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 z-20">
          
          <div className="space-y-2">
            
            {/* Title on Hover */}
            <div className="text-sm font-bold text-white leading-tight line-clamp-1">
              {movie.title}
            </div>

            {/* Micro Tags */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <span className="text-emerald-400 font-semibold">{movie.rottenTomatoesScore}%</span>
              <span>•</span>
              <span>{movie.releaseYear}</span>
              <span>•</span>
              <span className="truncate">{movie.duration}</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1 text-[10px] text-slate-400">
              {movie.genres.slice(0, 2).map((g) => (
                <span key={g} className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">
                  {g}
                </span>
              ))}
            </div>

            {/* Quick Action Button Bar */}
            <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <button
                id={`card-play-btn-${movie.id}`}
                onClick={() => onPlayMovie(movie)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-900/50 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play</span>
              </button>

              <button
                id={`card-watchlist-btn-${movie.id}`}
                onClick={() => onToggleWatchlist(movie)}
                className={`p-2 rounded-xl border transition-all ${
                  inWatchlist
                    ? 'bg-red-600/30 border-red-500 text-red-400'
                    : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
                title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>

              <button
                id={`card-info-btn-${movie.id}`}
                onClick={() => onOpenDetails(movie)}
                className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-all"
                title="Movie Details"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Card Footer Text under Poster */}
      <div className={`mt-2 px-1 ${rank ? 'ml-6' : ''}`}>
        <div className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-red-400 transition-colors line-clamp-1">
          {movie.title}
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
          <span>{movie.genres[0]}</span>
          <span className="text-slate-500">{movie.releaseYear}</span>
        </div>
      </div>

    </div>
  );
};
