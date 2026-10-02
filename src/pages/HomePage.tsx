import React, { useState, useEffect } from 'react';
import { subscribeMovies, subscribeSeries, subscribeHomepageSections } from '../services/firestore';
import { MovieItem, SeriesItem, HomepageSectionConfig } from '../types';
import { HeroCarousel } from '../components/catalog/HeroCarousel';
import { ContentRow } from '../components/catalog/ContentRow';
import { ContentGrid } from '../components/catalog/ContentGrid';
import { usePlayer } from '../context/PlayerContext';
import { Play, Sparkles, Flame, Film, Tv, Globe2, Subtitles } from 'lucide-react';
import { Link } from 'react-router-dom';

export type CategoryFilter = 
  | 'all' 
  | 'trending' 
  | 'action' 
  | 'scifi' 
  | 'sri_lankan' 
  | 'tv_shows' 
  | 'sinhala_subtitles';

export const HomePage: React.FC = () => {
  const { watchProgressMap } = usePlayer();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [sections, setSections] = useState<HomepageSectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  // Subscribe in realtime to Firestore collections
  useEffect(() => {
    const unsubMovies = subscribeMovies((items) => {
      setMovies(items.filter((m) => m.isPublished !== false));
      setLoading(false);
    });

    const unsubSeries = subscribeSeries((items) => {
      setSeries(items.filter((s) => s.isPublished !== false));
    });

    const unsubSections = subscribeHomepageSections((secs) => {
      setSections(secs.filter((s) => s.enabled));
    });

    return () => {
      unsubMovies();
      unsubSeries();
      unsubSections();
    };
  }, []);

  const allContent = [...movies, ...series];

  // Featured slides for Hero
  const heroSlides = allContent.filter((c) => c.isFeatured || c.isFeaturedHero).slice(0, 5);
  const heroFallback = allContent.slice(0, 5);
  const activeHeroItems = heroSlides.length > 0 ? heroSlides : heroFallback;

  // Continue Watching items from progress map
  const continueWatchingItems = Object.values(watchProgressMap)
    .filter((p) => p.currentTime > 5 && p.percentage < 95)
    .sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime())
    .slice(0, 6);

  // Curated Fallback Rails
  const trendingItems = allContent.filter((c) => c.isTrending || c.isTrendingToday).slice(0, 14);
  const actionItems = allContent.filter((c) => c.genres?.some((g) => g.toLowerCase().includes('action'))).slice(0, 14);
  const scifiItems = allContent.filter((c) => c.genres?.some((g) => g.toLowerCase().includes('sci-fi') || g.toLowerCase().includes('scifi'))).slice(0, 14);
  const sriLankanItems = allContent.filter((c) => 
    c.isSriLankan || 
    c.countries?.includes('Sri Lanka') || 
    c.genres?.includes('Sri Lankan Movies') ||
    c.originalLanguage === 'si' ||
    c.languages?.includes('Sinhala')
  ).slice(0, 14);
  const sinhalaSubtitleItems = allContent.filter((c) => 
    c.isSinhalaSubtitled || 
    c.hasSinhalaSubtitles ||
    c.genres?.includes('Movies with Sinhala Subtitles') ||
    c.subtitles?.some((s) => s.language === 'si' || s.label.toLowerCase().includes('sinhala'))
  ).slice(0, 14);
  const tvShowsItems = series.slice(0, 14);
  const latestMovies = movies.slice(0, 14);
  const top10Items = [...allContent].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
  const animeItems = series.filter((s) => s.mediaType === 'anime' || s.genres?.includes('Animation')).slice(0, 14);

  // Dynamic filter items when a specific category is clicked
  const getFilteredItems = (): MovieItem[] => {
    switch (activeCategory) {
      case 'trending':
        return trendingItems;
      case 'action':
        return actionItems;
      case 'scifi':
        return scifiItems;
      case 'sri_lankan':
        return sriLankanItems;
      case 'tv_shows':
        return tvShowsItems;
      case 'sinhala_subtitles':
        return sinhalaSubtitleItems;
      default:
        return [];
    }
  };

  const categoryButtons: { id: CategoryFilter; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'all', label: 'All Cinema', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'trending', label: 'Trending', icon: <Flame className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'action', label: 'Action', icon: <Film className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'scifi', label: 'Sci-Fi', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'sri_lankan', label: 'Sri Lankan Movies', icon: <Globe2 className="w-3.5 h-3.5 text-emerald-400" />, badge: 'සිංහල සිනමාව' },
    { id: 'tv_shows', label: 'TV Shows', icon: <Tv className="w-3.5 h-3.5 text-amber-300" /> },
    { id: 'sinhala_subtitles', label: 'Sinhala Subtitles', icon: <Subtitles className="w-3.5 h-3.5 text-amber-400" />, badge: 'සිංහල උපසිරැසි' }
  ];

  return (
    <div className="w-full pb-16 space-y-6">
      {/* 1. Cinematic Hero Carousel */}
      <HeroCarousel items={activeHeroItems} />

      {/* 2. Interactive Category Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-b border-white/5">
          {categoryButtons.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 font-bold scale-[1.02]'
                    : 'bg-[#12151E] hover:bg-[#1a1f2c] border border-white/10 hover:border-amber-500/30 text-zinc-300 hover:text-white'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                {cat.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                    isSelected ? 'bg-black/20 text-black' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Continue Watching (if history exists and viewing All) */}
      {activeCategory === 'all' && continueWatchingItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <h2 className="text-lg font-bold text-white font-display mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Continue Watching</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {continueWatchingItems.map((prog) => {
              const watchUrl = prog.episodeId
                ? `/watch/${prog.contentId}/season/${prog.seasonNumber || 1}/episode/${prog.episodeNumber || 1}`
                : `/watch/${prog.contentId}`;

              return (
                <Link
                  key={prog.contentId + (prog.episodeId || '')}
                  to={watchUrl}
                  className="group relative rounded-2xl overflow-hidden bg-[#12151E] border border-white/10 hover:border-amber-500/50 transition-all shadow-lg"
                >
                  <div className="aspect-[16/9] w-full relative">
                    {prog.backdropPath || prog.posterPath ? (
                      <img
                        src={prog.backdropPath || prog.posterPath || ''}
                        alt={prog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800" />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  {/* Progress bar in amber */}
                  <div className="w-full h-1 bg-white/20">
                    <div className="h-full bg-amber-500" style={{ width: `${prog.percentage}%` }} />
                  </div>
                  <div className="p-2">
                    <h4 className="text-xs font-semibold text-white truncate">{prog.title}</h4>
                    {prog.episodeTitle && (
                      <p className="text-[10px] text-zinc-400 truncate">
                        S{prog.seasonNumber} E{prog.episodeNumber}: {prog.episodeTitle}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Filtered Category View (when specific filter is clicked) */}
      {activeCategory !== 'all' ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white capitalize">
                {categoryButtons.find((c) => c.id === activeCategory)?.label}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Curated cinema streams in ultra high-definition and lossless audio
              </p>
            </div>
            <button
              onClick={() => setActiveCategory('all')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Reset to All Rails →
            </button>
          </div>

          <ContentGrid
            items={getFilteredItems()}
            loading={loading}
          />
        </section>
      ) : (
        /* 5. Standard Curated Cinema Rails */
        <>
          {/* Dynamic Homepage Rails configured by Admin in Firestore */}
          {sections.length > 0 ? (
            sections.map((sec) => {
              let sectionItems: MovieItem[] = [];
              if (sec.filterGenre && sec.filterGenre !== 'all') {
                sectionItems = allContent.filter((c) => c.genres?.includes(sec.filterGenre!));
              } else if (sec.contentSource === 'trending') {
                sectionItems = trendingItems;
              } else if (sec.contentSource === 'top_rated') {
                sectionItems = top10Items;
              } else {
                sectionItems = allContent.slice(0, sec.itemLimit || sec.limit || 12);
              }

              return (
                <ContentRow
                  key={sec.id}
                  title={sec.title}
                  subtitle={sec.subtitle}
                  badge={sec.badge}
                  items={sectionItems}
                  isTop10={sec.badge === 'TOP 10'}
                />
              );
            })
          ) : (
            /* Fallback Default Cinema Rails */
            <>
              <ContentRow
                title="Trending Today Across CINEXUS"
                subtitle="Most watched titles streamed in 4K resolution"
                items={trendingItems.length > 0 ? trendingItems : allContent.slice(0, 10)}
              />

              <ContentRow
                title="Top 10 Master Cinema Selections"
                subtitle="Critically acclaimed productions with reference video grading"
                items={top10Items}
                isTop10
              />

              {sriLankanItems.length > 0 && (
                <ContentRow
                  title="Sri Lankan Cinema (ශ්‍රී ලාංකේය සිනමාව)"
                  subtitle="Celebrated local masterworks, historic epics, and classic cinema"
                  items={sriLankanItems}
                />
              )}

              {sinhalaSubtitleItems.length > 0 && (
                <ContentRow
                  title="Movies with Sinhala Subtitles (සිංහල උපසිරැසි සමඟ)"
                  subtitle="Global blockbuster movies and series with verified Sinhala subtitles"
                  items={sinhalaSubtitleItems}
                />
              )}

              <ContentRow
                title="Latest 4K Feature Films"
                subtitle="Recently added movies with lossless audio feeds"
                items={latestMovies}
              />

              <ContentRow
                title="Binge-Worthy TV Series"
                subtitle="Full seasons streaming in high-bitrate master formats"
                items={tvShowsItems}
              />

              {animeItems.length > 0 && (
                <ContentRow
                  title="Anime Universe"
                  subtitle="Master animated epics with Japanese & English audio tracks"
                  items={animeItems}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

