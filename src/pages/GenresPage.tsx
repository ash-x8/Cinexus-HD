import React, { useState, useEffect } from 'react';
import { subscribeMovies, subscribeSeries } from '../services/firestore';
import { MovieItem } from '../types';
import { ContentGrid } from '../components/catalog/ContentGrid';

export const GenresPage: React.FC = () => {
  const [allContent, setAllContent] = useState<MovieItem[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>('Sci-Fi');

  const genresList = [
    { name: 'Sci-Fi', count: 0 },
    { name: 'Action', count: 0 },
    { name: 'Drama', count: 0 },
    { name: 'Thriller', count: 0 },
    { name: 'Crime', count: 0 },
    { name: 'Adventure', count: 0 },
    { name: 'Animation', count: 0 },
    { name: 'Documentary', count: 0 },
    { name: 'Comedy', count: 0 },
    { name: 'Mystery', count: 0 },
    { name: 'Horror', count: 0 }
  ];

  useEffect(() => {
    let currentMovies: MovieItem[] = [];
    let currentSeries: MovieItem[] = [];

    const unsubMovies = subscribeMovies((movs) => {
      currentMovies = movs.filter((m) => m.isPublished !== false);
      setAllContent([...currentMovies, ...currentSeries]);
    });

    const unsubSeries = subscribeSeries((ser) => {
      currentSeries = ser.filter((s) => s.isPublished !== false);
      setAllContent([...currentMovies, ...currentSeries]);
    });

    return () => {
      unsubMovies();
      unsubSeries();
    };
  }, []);

  const genreCounts: Record<string, number> = {};
  allContent.forEach((item) => {
    item.genres?.forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });

  const matchingItems = allContent.filter((item) => item.genres?.includes(activeGenre));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Genre Taxonomy
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Explore curated cinematic collections categorized by narrative discipline.
        </p>
      </div>

      {/* Genre Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {genresList.map((g) => {
          const count = genreCounts[g.name] || 0;
          const isActive = activeGenre === g.name;

          return (
            <button
              key={g.name}
              onClick={() => setActiveGenre(g.name)}
              className={`p-4 rounded-xl text-left border transition-all ${
                isActive
                  ? 'bg-red-600/15 border-red-500 text-white shadow-lg shadow-red-950/30'
                  : 'bg-zinc-950/60 hover:bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="text-sm font-semibold text-white">{g.name}</div>
              <div className="text-[11px] text-zinc-400 mt-1">{count} titles</div>
            </button>
          );
        })}
      </div>

      {/* Matching Titles Grid */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h2 className="text-lg font-bold text-white font-display">
            {activeGenre} Collection
          </h2>
          <span className="text-xs text-zinc-400">{matchingItems.length} matching</span>
        </div>
        <ContentGrid items={matchingItems} emptyMessage={`No titles found under ${activeGenre}.`} />
      </div>
    </div>
  );
};
