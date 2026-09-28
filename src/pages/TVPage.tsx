import React, { useState, useEffect } from 'react';
import { subscribeSeries } from '../services/firestore';
import { SeriesItem } from '../types';
import { ContentGrid } from '../components/catalog/ContentGrid';

export const TVPage: React.FC = () => {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');

  useEffect(() => {
    const unsub = subscribeSeries((items) => {
      setSeries(items.filter((s) => s.isPublished !== false));
    });
    return () => unsub();
  }, []);

  const genres = ['all', 'Drama', 'Sci-Fi', 'Crime', 'Action', 'Mystery', 'Animation', 'Comedy'];

  const filteredSeries = series
    .filter((s) => {
      if (selectedGenre !== 'all' && !s.genres?.includes(selectedGenre)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'year') return (b.releaseYear || 0) - (a.releaseYear || 0);
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Television & Episodic Series
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Stream complete seasons and episodes in high-definition formats.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-white/10">
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

      <div className="pt-2">
        <div className="text-xs text-zinc-400 mb-4">
          Showing <span className="text-white font-semibold">{filteredSeries.length}</span> series
        </div>
        <ContentGrid items={filteredSeries} emptyMessage="No TV series found matching the selected filters." />
      </div>
    </div>
  );
};
