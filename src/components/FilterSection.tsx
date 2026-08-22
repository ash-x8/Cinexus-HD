import React from 'react';
import { SlidersHorizontal, Star, Calendar, Sparkles, X, ArrowDownWideNarrow } from 'lucide-react';
import { FilterOptions, MediaType, QualityTier } from '../types';
import { GENRE_LIST } from '../data/moviesData';

interface FilterSectionProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
  isOpen: boolean;
  totalFilteredCount: number;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  setFilters,
  resetFilters,
  isOpen,
  totalFilteredCount
}) => {
  if (!isOpen) return null;

  return (
    <div id="filter-section-panel" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fade-in">
      <div className="bg-[#0c1017] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        
        {/* Header & Reset Button */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-red-500" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Smart Cinema Filter & Sort
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {totalFilteredCount} matching
            </span>
          </div>

          <button
            id="reset-filters-btn"
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* 1. Media Type Selector */}
          <div className="space-y-2">
            <label className="text-slate-400 font-bold uppercase tracking-wider block">Media Format</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'All Formats' },
                { id: 'movie', label: 'Feature Films' },
                { id: 'tv', label: 'TV Series' },
                { id: 'anime', label: 'Anime' },
                { id: 'documentary', label: 'Documentaries' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilters(prev => ({ ...prev, mediaType: item.id as any }))}
                  className={`px-2.5 py-1.5 rounded-xl border text-left font-medium transition-all ${
                    filters.mediaType === item.id
                      ? 'bg-red-600/20 border-red-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Quality Tier */}
          <div className="space-y-2">
            <label className="text-slate-400 font-bold uppercase tracking-wider block">Master Quality</label>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'all', label: 'All Resolutions' },
                { id: '4K Ultra HD', label: '4K Ultra HD Master' },
                { id: 'IMAX Enhanced', label: 'IMAX Enhanced 70mm' },
                { id: 'Dolby Vision', label: 'Dolby Vision HDR' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilters(prev => ({ ...prev, quality: item.id as any }))}
                  className={`px-2.5 py-1.5 rounded-xl border text-left font-medium transition-all ${
                    filters.quality === item.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Min IMDb Rating & Release Year */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-bold uppercase tracking-wider">
                <span>Min Rating</span>
                <span className="text-amber-400 font-mono">★ {filters.minRating}.0+</span>
              </div>
              <input
                type="range"
                min={5}
                max={9}
                step={0.5}
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-400 font-bold uppercase tracking-wider">
                <span>Release Year</span>
                <span className="text-slate-200 font-mono">{filters.minYear} - {filters.maxYear}</span>
              </div>
              <input
                type="range"
                min={2010}
                max={2026}
                value={filters.minYear}
                onChange={(e) => setFilters(prev => ({ ...prev, minYear: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          </div>

          {/* 4. Sort Order */}
          <div className="space-y-2">
            <label className="text-slate-400 font-bold uppercase tracking-wider block">Sort Results</label>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'trending', label: '🔥 Trending & Popular' },
                { id: 'rating', label: '★ Highest Rated (IMDb)' },
                { id: 'year', label: '📅 Newest Releases' },
                { id: 'title', label: '🔤 Alphabetical (A-Z)' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: item.id as any }))}
                  className={`px-2.5 py-1.5 rounded-xl border text-left font-medium transition-all ${
                    filters.sortBy === item.id
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Genre Badges Quick Selector */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <label className="text-slate-400 font-bold uppercase tracking-wider block text-xs">Filter by Genre</label>
          <div className="flex flex-wrap gap-1.5">
            {GENRE_LIST.map((genre) => (
              <button
                key={genre}
                id={`genre-filter-btn-${genre.toLowerCase()}`}
                onClick={() => setFilters(prev => ({ ...prev, genre: genre === 'All' ? 'all' : genre }))}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  (filters.genre === 'all' && genre === 'All') || filters.genre === genre
                    ? 'bg-red-600 text-white font-bold shadow-md shadow-red-900/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
