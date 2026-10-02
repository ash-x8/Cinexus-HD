import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMovieBySlugOrId, getSeriesBySlugOrId, getEpisodesBySeries } from '../services/firestore';
import { tmdbService } from '../services/tmdb';
import { MovieItem, EpisodeItem } from '../types';
import { CinexusPlayer } from '../components/CinexusPlayer';
import { ArrowLeft, Bookmark, Star, Tv, Play, Check } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const WatchPage: React.FC = () => {
  const { slug, season, episode } = useParams<{ slug: string; season?: string; episode?: string }>();
  const navigate = useNavigate();
  const { toggleWatchlist, isInWatchlist } = usePlayer();

  const [content, setContent] = useState<MovieItem | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeItem | null>(null);
  const [loading, setLoading] = useState(true);

  const seasonNum = season ? parseInt(season, 10) : 1;
  const episodeNum = episode ? parseInt(episode, 10) : 1;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const loadStream = async () => {
      let found: MovieItem | null = await getMovieBySlugOrId(slug);
      if (!found) {
        found = await getSeriesBySlugOrId(slug);
      }
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

        if (found.mediaType !== 'movie') {
          let eps = await getEpisodesBySeries(found.id, seasonNum);
          if (eps.length === 0 && found.tmdbId) {
            eps = await tmdbService.getSeasonEpisodes(found.tmdbId, seasonNum);
          }
          setEpisodes(eps);

          const matchedEp = eps.find((e) => e.episodeNumber === episodeNum) || eps[0] || null;
          setCurrentEpisode(matchedEp);
        }
      }
      setLoading(false);
    };

    loadStream();
  }, [slug, seasonNum, episodeNum]);

  if (loading) {
    return (
      <div className="w-full h-[75vh] flex flex-col items-center justify-center space-y-3 bg-black">
        <div className="w-10 h-10 rounded-full border-2 border-red-600/30 border-t-red-600 animate-spin" />
        <p className="text-xs text-zinc-400">Opening master stream pipeline...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Playback Target Unavailable</h2>
        <p className="text-xs text-zinc-400">The requested stream could not be loaded.</p>
        <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs">
          Return Home
        </Link>
      </div>
    );
  }

  const isSaved = isInWatchlist(content.id);
  const currentEpIndex = episodes.findIndex((e) => e.episodeNumber === episodeNum);
  const hasNextEpisode = currentEpIndex >= 0 && currentEpIndex < episodes.length - 1;
  const hasPrevEpisode = currentEpIndex > 0;

  const handleNextEpisode = () => {
    if (hasNextEpisode) {
      const next = episodes[currentEpIndex + 1];
      navigate(`/watch/${content.slug || content.id}/season/${next.seasonNumber}/episode/${next.episodeNumber}`);
    }
  };

  const handlePrevEpisode = () => {
    if (hasPrevEpisode) {
      const prev = episodes[currentEpIndex - 1];
      navigate(`/watch/${content.slug || content.id}/season/${prev.seasonNumber}/episode/${prev.episodeNumber}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      
      {/* Theater View Container */}
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-8 pt-4">
        
        {/* Back Link */}
        <div className="flex items-center justify-between pb-3 text-xs text-zinc-400">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-red-500 uppercase">{content.quality}</span>
            <span>·</span>
            <span>Dolby Vision / Atmos</span>
          </div>
        </div>

        {/* Video Player */}
        <div className="w-full">
          <CinexusPlayer
            content={content}
            episode={currentEpisode}
            onClose={() => navigate(`/movie/${content.slug || content.id}`)}
            onNextEpisode={handleNextEpisode}
            onPrevEpisode={handlePrevEpisode}
            hasNextEpisode={hasNextEpisode}
            hasPrevEpisode={hasPrevEpisode}
          />
        </div>

        {/* Under-player Meta & TV Series Episode Navigator */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Title info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                  {content.title}
                </h1>
                {currentEpisode && (
                  <p className="text-sm text-red-400 font-medium mt-0.5">
                    Season {currentEpisode.seasonNumber}, Episode {currentEpisode.episodeNumber}: {currentEpisode.title}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                  <span>{content.releaseYear}</span>
                  <span>·</span>
                  <span>{content.contentRating}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{content.rating}</span>
                  </span>
                  {content.genres?.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{content.genres.join(', ')}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => toggleWatchlist(content)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isSaved
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/15'
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span>{isSaved ? 'In Watchlist' : 'Save Title'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
              {currentEpisode?.overview || content.overview}
            </p>
          </div>

          {/* Right Column: Episode Playlist (if series) */}
          {content.mediaType !== 'movie' && episodes.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-white pb-2 border-b border-white/10">
                <span className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-red-500" /> Season {seasonNum} Episodes
                </span>
                <span className="text-zinc-500">{episodes.length} episodes</span>
              </div>

              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                {episodes.map((ep) => {
                  const isCurrent = ep.episodeNumber === episodeNum;

                  return (
                    <div
                      key={ep.id}
                      onClick={() =>
                        navigate(`/watch/${content.slug || content.id}/season/${ep.seasonNumber}/episode/${ep.episodeNumber}`)
                      }
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-red-600/15 border border-red-500/40 text-white font-medium'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-8 text-center text-xs font-bold text-zinc-500 shrink-0">
                        {isCurrent ? <Play className="w-4 h-4 text-red-500 fill-current mx-auto" /> : ep.episodeNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{ep.title}</div>
                        {ep.runtime && <div className="text-[10px] text-zinc-500">{ep.runtime}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
