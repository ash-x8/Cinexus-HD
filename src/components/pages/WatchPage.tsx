import React, { useState } from 'react';
import { MovieItem, EpisodeItem } from '../../types';
import { CinexusPlayer } from '../player/CinexusPlayer';
import { ArrowLeft, Film, Tv, Star, Bookmark, Share2, Layers, Check } from 'lucide-react';

interface WatchPageProps {
  movie: MovieItem;
  initialEpisodeId?: string;
  onBack: () => void;
  onSelectMovie: (movie: MovieItem) => void;
  isInWatchlist: (id: string) => boolean;
  onToggleWatchlist: (movie: MovieItem) => void;
  onSaveProgress: (progress: any) => void;
  allMovies: MovieItem[];
}

export const WatchPage: React.FC<WatchPageProps> = ({
  movie,
  initialEpisodeId,
  onBack,
  onSelectMovie,
  isInWatchlist,
  onToggleWatchlist,
  onSaveProgress,
  allMovies
}) => {
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | undefined>(
    initialEpisodeId || movie.episodes?.[0]?.id
  );
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);

  const isTV = movie.mediaType === 'tv' || movie.mediaType === 'anime';
  const episodes = movie.episodes || [];
  
  const currentEpisode = episodes.find(e => e.id === currentEpisodeId) || episodes[0];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (duration > 0) {
      onSaveProgress({
        movieId: movie.id,
        contentId: currentEpisode?.id || movie.id,
        title: movie.title,
        posterPath: movie.posterPath || movie.posterUrl,
        currentTime,
        duration,
        percentage: (currentTime / duration) * 100,
        episodeTitle: currentEpisode?.title,
        seasonNumber: currentEpisode?.seasonNumber || 1,
        episodeNumber: currentEpisode?.episodeNumber || 1,
        lastWatchedAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="pt-20 pb-20 min-h-screen bg-[#07090e] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Feed'}</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(movie)}
              className={`p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                isInWatchlist(movie.id)
                  ? 'bg-red-600 border-red-500 text-white font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isInWatchlist(movie.id) ? 'Saved' : 'Watchlist'}</span>
            </button>
          </div>
        </div>

        {/* CUSTOM CINEXUS VIDEO PLAYER */}
        <div className="w-full">
          <CinexusPlayer
            movie={movie}
            currentEpisode={currentEpisode}
            allEpisodes={episodes}
            onTimeUpdate={handleTimeUpdate}
            onEpisodeChange={(ep: EpisodeItem) => setCurrentEpisodeId(ep.id)}
            onClose={onBack}
          />
        </div>

        {/* Stream Details & Metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
                  {movie.quality || '4K Ultra HD'}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {movie.releaseYear}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-400">
                  {movie.duration || movie.runtime || 'Feature Film'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.rating}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide">
                {movie.title}
              </h1>
              {currentEpisode && (
                <h3 className="text-sm font-semibold text-red-400 mt-1">
                  S{currentEpisode.seasonNumber || 1}:E{currentEpisode.episodeNumber || 1} — {currentEpisode.title}
                </h3>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentEpisode?.overview || movie.overview}
            </p>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 pt-2">
              {movie.genres?.map(g => (
                <span key={g} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  {g}
                </span>
              ))}
            </div>

            {/* Cast & Crew */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Starring Cast</h4>
                <div className="flex flex-wrap gap-3">
                  {movie.cast.slice(0, 8).map(c => (
                    <div key={c.id} className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800 pr-3">
                      {c.avatarUrl || c.profilePath ? (
                        <img src={c.avatarUrl || c.profilePath || ''} alt={c.name} className="w-7 h-7 rounded-lg object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px]">🎭</div>
                      )}
                      <div>
                        <span className="text-xs font-semibold text-white block leading-tight">{c.name}</span>
                        <span className="text-[10px] text-slate-400 block leading-tight">{c.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Rail: TV Episodes Selector or Recommended Titles */}
          <div className="space-y-6">
            {isTV && episodes.length > 0 ? (
              <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-red-500" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Episodes ({episodes.length})
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {episodes.map((ep) => {
                    const isSelected = ep.id === currentEpisode?.id;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => setCurrentEpisodeId(ep.id)}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-red-600/20 border-red-500 text-white'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="w-16 aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0 relative">
                          {ep.thumbnailUrl || ep.stillPath || movie.posterUrl ? (
                            <img
                              src={ep.thumbnailUrl || ep.stillPath || movie.posterUrl || ''}
                              alt={ep.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">EP</div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-bold text-white">
                            E{ep.episodeNumber}
                          </div>
                        </div>
                        <div className="overflow-hidden flex-1">
                          <span className="text-xs font-bold block truncate">{ep.title}</span>
                          <span className="text-[10px] text-slate-400 block">{ep.runtime || '45m'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Similar Titles */
              <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Film className="w-4 h-4 text-red-500" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recommended Cinema
                  </h3>
                </div>
                <div className="space-y-3">
                  {allMovies.filter(m => m.id !== movie.id).slice(0, 4).map(sim => (
                    <div
                      key={sim.id}
                      onClick={() => onSelectMovie(sim)}
                      className="flex items-center gap-3 p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-red-500/60 transition-all cursor-pointer"
                    >
                      <img
                        src={sim.posterPath || sim.posterUrl || ''}
                        alt={sim.title}
                        className="w-12 aspect-[2/3] rounded-xl object-cover shrink-0"
                      />
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-white truncate block">{sim.title}</span>
                        <span className="text-[10px] text-slate-400 block">{sim.releaseYear} • {sim.quality || '4K'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
