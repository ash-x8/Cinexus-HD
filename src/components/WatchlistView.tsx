import React, { useState } from 'react';
import { 
  Bookmark, 
  Play, 
  Trash2, 
  Clock, 
  Star, 
  Sparkles, 
  FolderPlus, 
  Film, 
  CheckCircle2, 
  Tv 
} from 'lucide-react';
import { MovieItem, WatchProgress } from '../types';

interface WatchlistViewProps {
  watchlist: MovieItem[];
  watchProgressMap: Record<string, WatchProgress>;
  onPlayMovie: (movie: MovieItem) => void;
  onOpenDetails: (movie: MovieItem) => void;
  onRemoveFromWatchlist: (movieId: string) => void;
  onBrowseCatalog: () => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  watchProgressMap,
  onPlayMovie,
  onOpenDetails,
  onRemoveFromWatchlist,
  onBrowseCatalog
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'continue' | 'favorites'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [customFolders, setCustomFolders] = useState<string[]>(['Weekend Binge', 'Sci-Fi Gold', 'Award Winners']);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  // In-progress movies
  const continueWatchingList = watchlist.filter(m => watchProgressMap[m.id] && watchProgressMap[m.id].percentage > 0 && watchProgressMap[m.id].percentage < 95);

  const displayedList = activeTab === 'continue' 
    ? continueWatchingList 
    : watchlist;

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCustomFolders([...customFolders, newFolderName.trim()]);
    setNewFolderName('');
    setShowFolderInput(false);
  };

  return (
    <div id="watchlist-view-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
            <Bookmark className="w-4 h-4" />
            <span>Personal Cinema Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-cinema text-white">
            My Watchlist & Collections
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {watchlist.length} titles saved • Stream instantly in 4K HDR
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'all' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Saved ({watchlist.length})
          </button>
          <button
            onClick={() => setActiveTab('continue')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'continue' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Continue Watching ({continueWatchingList.length})
          </button>
        </div>
      </div>

      {/* Custom Collection Folder Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setSelectedFolder('All')}
          className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
            selectedFolder === 'All'
              ? 'bg-slate-200 text-slate-950 font-bold shadow'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Collections
        </button>
        {customFolders.map(folder => (
          <button
            key={folder}
            onClick={() => setSelectedFolder(folder)}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              selectedFolder === folder
                ? 'bg-red-600 text-white font-bold shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📁 {folder}
          </button>
        ))}

        {showFolderInput ? (
          <form onSubmit={handleAddFolder} className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-full px-3 py-0.5 text-xs text-white focus:outline-none focus:border-red-500"
              autoFocus
            />
            <button type="submit" className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">
              Save
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowFolderInput(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/60 border border-dashed border-slate-700 text-slate-400 hover:text-white text-xs font-medium"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>
        )}
      </div>

      {/* Grid of Saved Movies */}
      {displayedList.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Your Watchlist is Empty</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
              Discover blockbusters, prestige dramas, anime, and 4K HDR documentaries and save them to watch anytime.
            </p>
          </div>
          <button
            onClick={onBrowseCatalog}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-900/40 transition-colors"
          >
            Explore Cinema Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {displayedList.map((movie) => {
            const progress = watchProgressMap[movie.id];
            return (
              <div
                key={movie.id}
                id={`watchlist-card-${movie.id}`}
                className="group relative bg-[#0c1017] border border-slate-800/80 hover:border-red-500/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                {/* Poster */}
                <div 
                  onClick={() => onOpenDetails(movie)}
                  className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950 cursor-pointer"
                >
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Quality Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                    {movie.quality}
                  </div>

                  {/* Rating */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{movie.rating}</span>
                  </div>

                  {/* Progress bar if ongoing */}
                  {progress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-950">
                      <div 
                        className="h-full bg-red-600" 
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Info & Action Controls */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 
                      onClick={() => onOpenDetails(movie)}
                      className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {movie.title}
                    </h4>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>{movie.releaseYear}</span>
                      <span>{movie.duration}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => onPlayMovie(movie)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>{progress ? 'Resume' : 'Play'}</span>
                    </button>
                    <button
                      onClick={() => onRemoveFromWatchlist(movie.id)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-red-950/50 hover:text-red-400 text-slate-400 border border-slate-800 transition-colors"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
