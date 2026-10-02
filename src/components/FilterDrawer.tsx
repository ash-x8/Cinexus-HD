import React from 'react';
import { X, SlidersHorizontal, RotateCcw, Check, Sparkles, Star } from 'lucide-react';
import { FilterOptions } from '../types';

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onReset: () => void;
  totalResults?: number;
}

const GENRE_LIST = [
  'All',
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Sinhala Subtitled'
];

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
  totalResults
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md h-full bg-[#0d1017] border-l border-[#D4AF37]/30 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slideLeft">
        
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-display">
                Cinema Filters
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['all', 'movie', 'tv', 'anime'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onFilterChange({ ...filters, mediaType: type })}
                  className={`py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                    filters.mediaType === type
                      ? 'bg-[#D4AF37] text-black shadow-md shadow-amber-950/40'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  {type === 'tv' ? 'TV' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Genre
            </label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {GENRE_LIST.map((genre) => (
                <button
                  key={genre}
                  onClick={() => onFilterChange({ ...filters, genre })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    filters.genre === genre
                      ? 'bg-[#D4AF37] text-black font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rating Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-zinc-400 uppercase tracking-wider">
                Minimum Rating
              </label>
              <div className="flex items-center gap-1 font-bold text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{filters.minRating || 0}★</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={filters.minRating || 0}
              onChange={(e) => onFilterChange({ ...filters, minRating: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-white/20 accent-[#D4AF37] rounded-lg cursor-pointer"
            />
          </div>

          {/* Quality Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Quality
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['All', '4K UHD', '1080p'].map((q) => (
                <button
                  key={q}
                  onClick={() => onFilterChange({ ...filters, quality: q })}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    (filters.quality || 'All') === q
                      ? 'bg-[#D4AF37] text-black shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Sort By
            </label>
            <select
              value={filters.sortBy || 'trending'}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none focus:border-[#D4AF37]"
            >
              <option value="trending">Trending Today</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Release</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/10 flex items-center gap-3">
          <button
            onClick={onReset}
            className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/40 cursor-pointer"
          >
            Apply Filters {totalResults !== undefined ? `(${totalResults})` : ''}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FilterDrawer;
