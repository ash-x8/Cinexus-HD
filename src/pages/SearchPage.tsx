import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Star, Sparkles } from 'lucide-react';
import { getMovies, getSeries } from '../services/firestore';
import { tmdbService } from '../services/tmdb';
import { MovieItem } from '../types';
import { ContentGrid } from '../components/catalog/ContentGrid';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');
  const [results, setResults] = useState<MovieItem[]>([]);
  const [tmdbResults, setTmdbResults] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localCatalog, setLocalCatalog] = useState<MovieItem[]>([]);

  // Load local Firestore catalog
  useEffect(() => {
    Promise.all([getMovies(), getSeries()]).then(([movs, sers]) => {
      setLocalCatalog([...movs, ...sers]);
    });
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTmdbResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const qLower = query.toLowerCase().trim();

      // 1. Search local Firestore items
      const localMatches = localCatalog.filter((item) => {
        if (mediaType !== 'all' && item.mediaType !== mediaType) return false;
        const inTitle = item.title?.toLowerCase().includes(qLower);
        const inOverview = item.overview?.toLowerCase().includes(qLower);
        const inGenres = item.genres?.some((g) => g.toLowerCase().includes(qLower));
        const inDirector = item.director?.toLowerCase().includes(qLower);
        const inCast = item.cast?.some((c) => c.name?.toLowerCase().includes(qLower));
        return inTitle || inOverview || inGenres || inDirector || inCast;
      });
      setResults(localMatches);

      // 2. Discover live TMDB titles
      try {
        const tmdbType = mediaType === 'movie' ? 'movie' : mediaType === 'tv' ? 'tv' : 'multi';
        const tmdbMatches = await tmdbService.search(query, tmdbType);
        // Exclude items already present in local catalog
        const newTmdb = tmdbMatches.filter(
          (t) => !localMatches.some((l) => l.tmdbId === t.tmdbId || l.title.toLowerCase() === t.title.toLowerCase())
        );
        setTmdbResults(newTmdb);
      } catch (err) {
        console.warn('TMDB search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, mediaType, localCatalog]);

  const popularSearches = ['Dune', 'Oppenheimer', 'Interstellar', 'Batman', 'Breaking Bad', 'Arcane', 'Shogun', 'Cyberpunk'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Search Input Box */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, director, actor, or genre..."
            autoFocus
            className="w-full pl-12 pr-10 py-4 rounded-2xl bg-zinc-950/80 border border-white/15 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:border-red-500 shadow-xl transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Media Type Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-white/10">
            {(['all', 'movie', 'tv'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMediaType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  mediaType === t ? 'bg-red-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Formats' : t === 'movie' ? 'Movies Only' : 'TV Series'}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              <span>Scanning master catalog...</span>
            </div>
          )}
        </div>

        {/* Popular Tags */}
        {!query && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-zinc-500 mr-1">Trending Searches:</span>
            {popularSearches.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      {query && (
        <div className="space-y-10 pt-4">
          {/* 1. Local CINEXUS Master Catalog Matches */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-6">
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                CINEXUS Streamable Titles ({results.length})
              </h2>
              <span className="text-xs text-zinc-400">Master 4K / HD Feeds</span>
            </div>
            <ContentGrid items={results} emptyMessage="No streamable titles found in CINEXUS for this query." />
          </div>

          {/* 2. TMDB Global Cinema Discovery */}
          {tmdbResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-base sm:text-lg font-bold text-white font-display">
                    Global Cinema Catalog ({tmdbResults.length})
                  </h2>
                </div>
                <span className="text-xs text-zinc-400">TMDB Live Discovery</span>
              </div>
              <ContentGrid items={tmdbResults} />
            </div>
          )}
        </div>
      )}

    </div>
  );
};
