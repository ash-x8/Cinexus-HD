import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { getMovies, getSeries } from '../services/firestore';
import { MovieItem } from '../types';
import { ContentGrid } from '../components/catalog/ContentGrid';
import { Bookmark } from 'lucide-react';

export const WatchlistPage: React.FC = () => {
  const { watchlist } = usePlayer();
  const [savedItems, setSavedItems] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMovies(), getSeries()]).then(([movs, sers]) => {
      const all = [...movs, ...sers];
      const filtered = all.filter((item) => watchlist.includes(item.id));
      setSavedItems(filtered);
      setLoading(false);
    });
  }, [watchlist]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500">
          <Bookmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
            Personal Watchlist
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            {savedItems.length} titles saved to your library for instant streaming.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <ContentGrid
          items={savedItems}
          emptyMessage="Your watchlist is currently empty. Bookmark any film or series to access it here anytime."
        />
      </div>
    </div>
  );
};
