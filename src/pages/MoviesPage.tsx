import React, { useState, useEffect } from 'react';
import { subscribeMovies } from '../services/firestore';
import { MovieItem } from '../types';
import { ContentGrid } from '../components/catalog/ContentGrid';
import { Filter, SlidersHorizontal } from 'lucide-react';

export const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedQuality, setSelectedQuality] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeMovies((items) => {
      setMovies(items.filter((m) => m.mediaType === 'movie' && m.isPublished !== false));
    });
    return () => unsub();
  }, []);

  const genres = ['all', 'Action', 'Sci-Fi', 'Drama', 'Thriller', 'Adventure', 'Crime', 'Comedy', 'Horror', 'Animation', 'Documentary'];
  const qualities = ['all', '4K Ultra HD', '1080p FHD', 'IMAX Enhanced', 'Dolby Vision'];

  const filteredMovies = movies
    .filter((m) => {
      if (selectedGenre !== 'all' && !m.genres?.includes(selectedGenre)) return false;
      if (selectedQuality !== 'all' && m.quality !== selectedQuality) return false;
      if (selectedRating > 0 && (m.rating || 0) < selectedRating) return false;
      if (searchQuery.trim() && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'year') return (b.releaseYear || 0) - (a.releaseYear || 0);
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Feature Films Catalog
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Explore movies streaming in native 4K Ultra HD with lossless sound.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-white/10">
        
        {/* Genre Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedGenre === g
                  ? 'bg-red-600 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {g === 'all' ? 'All Genres' : g}
            </button>
          ))}
        </div>

        {/* Quality & Sort Selectors */}
        <div className="flex items-center gap-3">
          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-red-500"
          >
            <option value="all">All Qualities</option>
            {qualities.filter((q) => q !== 'all').map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-red-500"
          >
            <option value="latest">Recently Added</option>
            <option value="rating">Highest Rated</option>
            <option value="year">Release Year</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="pt-2">
        <div className="text-xs text-zinc-400 mb-4">
          Showing <span className="text-white font-semibold">{filteredMovies.length}</span> titles
        </div>
        <ContentGrid items={filteredMovies} emptyMessage="No movies found matching the selected filters." />
      </div>

    </div>
  );
};
