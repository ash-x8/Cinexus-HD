import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Bookmark, Star } from 'lucide-react';
import { MovieItem } from '../../types';
import { usePlayer } from '../../context/PlayerContext';

interface ContentCardProps {
  content: MovieItem;
  rank?: number;
  onPlayDirect?: (movie: MovieItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ content, rank, onPlayDirect }) => {
  const navigate = useNavigate();
  const { toggleWatchlist, isInWatchlist, playContent } = usePlayer();
  const isSaved = isInWatchlist(content.id);

  const slug = content.slug || content.id;
  const detailUrl = content.mediaType === 'movie' ? `/movie/${slug}` : `/tv/${slug}`;

  const handleCardClick = () => {
    navigate(detailUrl);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayDirect) {
      onPlayDirect(content);
    } else {
      playContent(content);
    }
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(content);
  };

  const posterImage = content.posterPath || content.backdropPath || '';

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer select-none transition-transform duration-300 hover:-translate-y-1.5 focus-visible:outline-none"
    >
      {/* Poster Media Box */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-white/30 shadow-md group-hover:shadow-2xl transition-all duration-300">
        {posterImage ? (
          <img
            src={posterImage}
            alt={content.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-900 text-center text-zinc-500">
            <span className="text-xs font-semibold">{content.title}</span>
          </div>
        )}

        {/* Gradient Scrim for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
          <button
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            title="Stream Now"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        {/* Watchlist Quick Action */}
        <button
          onClick={handleWatchlistClick}
          className={`absolute top-2.5 right-2.5 p-2 rounded-lg backdrop-blur-md transition-all ${
            isSaved
              ? 'bg-red-600 text-white'
              : 'bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100'
          }`}
          title={isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}
        >
          <Bookmark className="w-4 h-4 fill-current" />
        </button>

        {/* Optional Rank Badge for Top 10 */}
        {rank && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-xs font-black text-amber-400 border border-amber-400/30">
            #{rank}
          </div>
        )}
      </div>

      {/* Unboxed Metadata (Zero-Pill Discipline) */}
      <div className="mt-2.5 space-y-1">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
          {content.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
          <span>{content.releaseYear}</span>
          <span aria-hidden="true">·</span>
          <span>{content.quality || 'HD'}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-0.5 text-amber-400">
            <Star className="w-3 h-3 fill-current" />
            <span className="font-mono tabular-nums">{content.rating?.toFixed(1) || '8.0'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
