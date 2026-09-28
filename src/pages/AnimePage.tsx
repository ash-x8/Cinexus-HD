import React, { useState, useEffect } from 'react';
import { subscribeSeries } from '../services/firestore';
import { SeriesItem } from '../types';
import { ContentGrid } from '../components/catalog/ContentGrid';

export const AnimePage: React.FC = () => {
  const [animeList, setAnimeList] = useState<SeriesItem[]>([]);

  useEffect(() => {
    const unsub = subscribeSeries((items) => {
      setAnimeList(
        items.filter(
          (s) =>
            (s.mediaType === 'anime' || s.genres?.includes('Animation') || s.originalLanguage === 'ja') &&
            s.isPublished !== false
        )
      );
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Anime Universe
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Stream Japanese animation masterworks with dual Japanese/English audio & verified subtitles.
        </p>
      </div>

      <div className="pt-2">
        <div className="text-xs text-zinc-400 mb-4">
          Showing <span className="text-white font-semibold">{animeList.length}</span> titles
        </div>
        <ContentGrid items={animeList} emptyMessage="No anime titles currently listed in this category." />
      </div>
    </div>
  );
};
