import React, { useState, useEffect } from 'react';
import { subscribeMovies, subscribeSeries, subscribeHomepageSections } from '../services/firestore';
import { MovieItem, SeriesItem, HomepageSectionConfig } from '../types';
import { HeroCarousel } from '../components/catalog/HeroCarousel';
import { ContentRow } from '../components/catalog/ContentRow';
import { usePlayer } from '../context/PlayerContext';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const { watchProgressMap } = usePlayer();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [sections, setSections] = useState<HomepageSectionConfig[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Curated Fallback Rails if admin homepage sections are empty
  const trendingItems = allContent.filter((c) => c.isTrending || c.isTrendingToday).slice(0, 14);
  const latestMovies = movies.slice(0, 14);
  const latestSeries = series.slice(0, 14);
  const top10Items = [...allContent].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
  const animeItems = series.filter((s) => s.mediaType === 'anime' || s.genres?.includes('Animation')).slice(0, 14);

  return (
    <div className="w-full pb-16 space-y-4">
      {/* 1. Cinematic Hero Carousel */}
      <HeroCarousel items={activeHeroItems} />

      {/* 2. Continue Watching (if history exists) */}
      {continueWatchingItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <h2 className="text-lg font-bold text-white font-display mb-3">Continue Watching</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {continueWatchingItems.map((prog) => {
              const watchUrl = prog.episodeId
                ? `/watch/${prog.contentId}/season/${prog.seasonNumber || 1}/episode/${prog.episodeNumber || 1}`
                : `/watch/${prog.contentId}`;

              return (
                <Link
                  key={prog.contentId + (prog.episodeId || '')}
                  to={watchUrl}
                  className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-red-500/50 transition-all"
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
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-white/20">
                    <div className="h-full bg-red-600" style={{ width: `${prog.percentage}%` }} />
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

      {/* 3. Dynamic Homepage Rails configured by Admin in Firestore */}
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

          <ContentRow
            title="Latest 4K Feature Films"
            subtitle="Recently added movies with lossless audio feeds"
            items={latestMovies}
          />

          <ContentRow
            title="Binge-Worthy TV Series"
            subtitle="Full seasons streaming in high-bitrate master formats"
            items={latestSeries}
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
    </div>
  );
};
