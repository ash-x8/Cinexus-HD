import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, Tv, User, Star, ArrowRight, Loader2, Sparkles, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { MovieItem } from '../../types';
import { usePlayer } from '../../context/PlayerContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: MovieItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectMovie }) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'multi' | 'movie' | 'tv'>('multi');
  const [results, setResults] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playContent } = usePlayer();

  const popularSearches = [
    'Dune: Part Two', 'Oppenheimer', 'Interstellar', 'The Dark Knight', 
    'Breaking Bad', 'Stranger Things', 'Arcane', 'Shogun', 'Game of Thrones'
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query, type);
        setResults(res.items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Header Bar */}
        <div className="relative flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <Search className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            id="input-global-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search thousands of 4K movies, TV series, actors, directors..."
            className="w-full bg-transparent text-base sm:text-lg text-white placeholder-zinc-500 focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-red-500 animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="ml-2 text-xs font-semibold text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-zinc-950/60 border-b border-zinc-900 text-xs overflow-x-auto no-scrollbar">
          <span className="text-zinc-500 font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            id="btn-search-type-all"
            onClick={() => setType('multi')}
            className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
              type === 'multi' ? 'bg-red-600 text-white font-semibold shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Categories
          </button>
          <button
            id="btn-search-type-movies"
            onClick={() => setType('movie')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
              type === 'movie' ? 'bg-red-600 text-white font-semibold shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-3 h-3" /> Movies
          </button>
          <button
            id="btn-search-type-tv"
            onClick={() => setType('tv')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
              type === 'tv' ? 'bg-red-600 text-white font-semibold shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tv className="w-3 h-3" /> TV Series
          </button>
        </div>

        {/* Results / Default State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {query.trim() === '' ? (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="py-1.5 px-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-12 text-center text-zinc-500">
              <Film className="w-10 h-10 mx-auto mb-2 opacity-40 text-zinc-600" />
              <p className="text-sm">No cinema titles found matching "{query}"</p>
              <p className="text-xs text-zinc-600 mt-1">Try searching by original title, character, or director</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-zinc-400 font-semibold mb-2">
                Found {results.length} result{results.length === 1 ? '' : 's'}
              </div>
              {results.map((item) => (
                <div
                  key={item.id}
                  id={`search-result-${item.id}`}
                  onClick={() => {
                    onSelectMovie(item);
                    onClose();
                  }}
                  className="flex items-center gap-3.5 p-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/40 hover:border-zinc-700/80 transition-all cursor-pointer group"
                >
                  <img
                    src={item.posterPath || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200'}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded-lg shrink-0 shadow-md group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                        {item.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {item.mediaType === 'tv' ? 'TV Series' : 'Movie'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-1">
                      <span>{item.releaseYear || 'Cinema'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {item.rating.toFixed(1)}
                      </span>
                      <span>•</span>
                      <span className="text-zinc-500 truncate max-w-[180px]">
                        {item.genres?.slice(0, 2).join(', ') || 'Feature'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playContent(item);
                        onClose();
                      }}
                      className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                      title="Quick Play"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
