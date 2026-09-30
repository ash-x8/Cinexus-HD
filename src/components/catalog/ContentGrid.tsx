import React from 'react';
import { MovieItem } from '../../types';
import { ContentCard } from './ContentCard';

interface ContentGridProps {
  items: MovieItem[];
  emptyMessage?: string;
  loading?: boolean;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
  items,
  emptyMessage = 'No titles found matching your criteria.',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 mb-4">
          🎬
        </div>
        <h3 className="text-base font-semibold text-white">Catalog Empty</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {items.map((item) => (
        <ContentCard key={item.id} content={item} />
      ))}
    </div>
  );
};
