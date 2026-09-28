import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Bookmark,
  Star,
  Clock,
  Calendar,
  Film,
  Award,
  Share2,
  Tv,
  Check,
  ChevronDown
} from 'lucide-react';
import { getMovieBySlugOrId, getSeriesBySlugOrId, getEpisodesBySeries, getMovies } from '../services/firestore';
import { tmdbService } from '../services/tmdb';
import { MovieItem, SeriesItem, EpisodeItem } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { ContentRow } from '../components/catalog/ContentRow';

export const ContentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toggleWatchlist, isInWatchlist, playContent } = usePlayer();

  const [content, setContent] = useState<MovieItem | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [relatedContent, setRelatedContent] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const loadContent = async () => {
      // 1. Check if Movie in Firestore
      let found: MovieItem | null = await getMovieBySlugOrId(slug);

      // 2. Check if Series in Firestore
      if (!found) {
        found = await getSeriesBySlugOrId(slug);
      }

      // 3. Fallback: If tmdb_ id, fetch from TMDB service
      if (!found && slug.startsWith('tmdb_')) {
        const rawId = slug.replace(/^tmdb_(tv_)?/, '');
        if (slug.includes('tv_')) {
          found = await tmdbService.getSeriesDetails(rawId);
        } else {
          found = await tmdbService.getMovieDetails(rawId);
        }
      }

      if (found) {
        setContent(found);

        // If Series, load episodes
        if (found.mediaType !== 'movie') {
          const eps = await getEpisodesBySeries(found.id);
          if (eps.length === 0 && found.tmdbId) {
            // Load live TMDB episodes for season 1
            const tmdbEps = await tmdbService.getSeasonEpisodes(found.tmdbId, 1);
            setEpisodes(tmdbEps);
          } else {
            setEpisodes(eps);
          }
        }

        // Load related titles from Firestore
        const all = await getMovies();
        const firstGenre = found.genres?.[0];
        const related = all.filter((m) => m.id !== found!.id && m.genres?.includes(firstGenre || 'Action')).slice(0, 10);
        setRelatedContent(related);
      }
      setLoading(false);
    };

    loadContent();
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-red-600/30 border-t-red-600 animate-spin" />
        <p className="text-xs text-zinc-400">Loading cinema details...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Title Not Found</h2>
        <p className="text-sm text-zinc-400">The requested film or television series could not be located.</p>
        <Link to="/" className="inline-block px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs">
          Return to Cinema Home
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(content.id);
  const backdropUrl = content.backdropPath || content.posterPath || '';
  const watchUrl = content.mediaType === 'movie'
    ? `/watch/${content.slug || content.id}`
    : `/watch/${content.slug || content.id}/season/1/episode/1`;

  const seasonEpisodes = episodes.filter((ep) => ep.seasonNumber === selectedSeason);

  return (
    <div className="w-full pb-20">
      
      {/* 1. Backdrop Showcase with Gradient Scrims */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] lg:h-[72vh] overflow-hidden bg-black">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={content.title}
            className="w-full h-full object-cover object-top opacity-50 filter brightness-90"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080c] via-[#06080c]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080c] via-[#06080c]/40 to-transparent" />
      </div>

      {/* 2. Main Content Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 sm:-mt-52 relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-8">
          
          {/* Poster Box */}
          <div className="w-48 sm:w-64 shrink-0 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-900 mx-auto md:mx-0">
            {content.posterPath ? (
              <img src={content.posterPath} alt={content.title} className="w-full h-auto object-cover" />
            ) : (
              <div className="aspect-[2/3] w-full flex items-center justify-center p-4 text-center text-zinc-500">
                {content.title}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-5">
            
            {/* Metadata (Zero-Pill discipline) */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-300 font-medium">
              <span className="text-red-500 font-bold tracking-wider">{content.quality || '4K UHD'}</span>
              <span aria-hidden="true">·</span>
              <span>{content.releaseYear}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-mono tabular-nums">{content.rating?.toFixed(1) || '8.5'}</span>
              </span>
              {content.runtime && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{content.runtime}</span>
                </>
              )}
              {content.contentRating && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{content.contentRating}</span>
                </>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
                {content.title}
              </h1>
              {content.tagline && (
                <p className="text-sm sm:text-base text-zinc-400 italic mt-1 font-light">
                  "{content.tagline}"
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate(watchUrl)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-transform hover:scale-105 shadow-xl shadow-red-950/60"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Stream Cinema</span>
              </button>

              <button
                onClick={() => toggleWatchlist(content)}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-xl backdrop-blur-md border text-sm font-medium transition-colors ${
                  isSaved
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span>{isSaved ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>

              {content.trailerYoutubeId && (
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-medium transition-colors"
                >
                  <Film className="w-4 h-4" />
                  <span>Official Trailer</span>
                </button>
              )}
            </div>

            {/* Overview */}
            <div className="pt-2 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Synopsis</h3>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
                {content.overview}
              </p>
            </div>

            {/* Key Personnel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
              {content.director && (
                <div>
                  <span className="text-zinc-500 block">Director</span>
                  <span className="text-white font-medium">{content.director}</span>
                </div>
              )}
              {content.genres && content.genres.length > 0 && (
                <div>
                  <span className="text-zinc-500 block">Genres</span>
                  <span className="text-white font-medium">{content.genres.join(', ')}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500 block">Audio & Visuals</span>
                <span className="text-white font-medium">Dolby Atmos · Dolby Vision</span>
              </div>
            </div>

          </div>
        </div>

        {/* 3. Cast Showcase */}
        {content.cast && content.cast.length > 0 && (
          <div className="mt-16 space-y-4">
            <h2 className="text-lg font-bold text-white font-display">Cast & Performers</h2>
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-none pb-2">
              {content.cast.slice(0, 10).map((c) => (
                <div key={c.id} className="w-24 shrink-0 text-center space-y-1.5">
                  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                    {c.profilePath ? (
                      <img src={c.profilePath} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold">
                        {c.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium text-white truncate">{c.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{c.character || c.role || 'Cast'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Episodic Selector (For TV & Anime Series) */}
        {content.mediaType !== 'movie' && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Tv className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-white font-display">Episodes & Seasons</h2>
              </div>
              <span className="text-xs text-zinc-400">
                {seasonEpisodes.length} episodes in Season {selectedSeason}
              </span>
            </div>

            {/* Season Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeason(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    selectedSeason === s
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10'
                  }`}
                >
                  Season {s}
                </button>
              ))}
            </div>

            {/* Episodes List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seasonEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() =>
                    navigate(`/watch/${content.slug || content.id}/season/${ep.seasonNumber}/episode/${ep.episodeNumber}`)
                  }
                  className="group relative flex gap-3 p-3 rounded-xl bg-zinc-950/60 hover:bg-zinc-900 border border-white/10 hover:border-red-500/50 cursor-pointer transition-all"
                >
                  <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                    {ep.stillPath || content.backdropPath ? (
                      <img
                        src={ep.stillPath || content.backdropPath || ''}
                        alt={ep.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                        EP {ep.episodeNumber}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Ep. {ep.episodeNumber}</span>
                      {ep.runtime && <span>{ep.runtime}</span>}
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-400">
                      {ep.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                      {ep.overview || 'Episode synopsis streaming on CINEXUS.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Related Titles Row */}
        {relatedContent.length > 0 && (
          <div className="mt-16">
            <ContentRow title="Recommended Similar Cinema" items={relatedContent} />
          </div>
        )}

      </div>

      {/* Official Trailer Modal */}
      {showTrailerModal && content.trailerYoutubeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black border border-white/20 shadow-2xl">
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white"
            >
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${content.trailerYoutubeId}?autoplay=1&rel=0`}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title="Official Trailer"
            />
          </div>
        </div>
      )}

    </div>
  );
};
