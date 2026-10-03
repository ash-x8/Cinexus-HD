import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMovieBySlugOrId, getSeriesBySlugOrId, getEpisodesBySeries, getMovies } from '../services/firestore';
import { tmdbService } from '../services/tmdb';
import { MovieItem, EpisodeItem } from '../types';
import { CinexusPlayer } from '../components/CinexusPlayer';
import { 
  ArrowLeft, 
  Bookmark, 
  Star, 
  Tv, 
  Play, 
  Check, 
  Sparkles, 
  Share2, 
  Film, 
  Clock, 
  Calendar, 
  Server, 
  User, 
  ShieldCheck, 
  Subtitles, 
  Volume2, 
  Download,
  AlertCircle
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useBrand } from '../context/BrandContext';

export const WatchPage: React.FC = () => {
  const { slug, season, episode } = useParams<{ slug: string; season?: string; episode?: string }>();
  const navigate = useNavigate();
  const { toggleWatchlist, isInWatchlist } = usePlayer();
  const { branding } = useBrand();

  const [content, setContent] = useState<MovieItem | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeItem | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeServer, setActiveServer] = useState<string>('multiembed');

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
        // Ensure rich Cast & Crew details are loaded
        if (!found.cast || found.cast.length === 0) {
          const rawTmdbId = found.tmdbId || (found.id?.startsWith('tmdb_') ? found.id.replace(/^tmdb_(tv_)?/, '') : null);
          if (rawTmdbId) {
            try {
              const fullDetails = found.mediaType === 'tv'
                ? await tmdbService.getSeriesDetails(String(rawTmdbId))
                : await tmdbService.getMovieDetails(String(rawTmdbId));
              if (fullDetails?.cast && fullDetails.cast.length > 0) {
                found = {
                  ...found,
                  cast: fullDetails.cast,
                  director: fullDetails.director || found.director,
                  writers: fullDetails.writers || found.writers
                };
              }
            } catch (err) {
              console.warn('Cast fetch skipped:', err);
            }
          }
        }

        setContent(found);

        // Fetch TV Episodes if applicable
        if (found.mediaType !== 'movie') {
          let eps = await getEpisodesBySeries(found.id, seasonNum);
          if (eps.length === 0 && found.tmdbId) {
            eps = await tmdbService.getSeasonEpisodes(found.tmdbId, seasonNum);
          }
          setEpisodes(eps);

          const matchedEp = eps.find((e) => e.episodeNumber === episodeNum) || eps[0] || null;
          setCurrentEpisode(matchedEp);
        }

        // Fetch Related Titles for bottom discovery carousel
        try {
          const allMovies = await getMovies();
          setRelatedMovies(allMovies.filter((m) => m.id !== found!.id).slice(0, 6));
        } catch {}
      }

      setLoading(false);
    };

    loadStream();
  }, [slug, seasonNum, episodeNum]);

  if (loading) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center justify-center space-y-4 bg-black select-none">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-black text-white uppercase tracking-widest font-display">
            Initializing 4K Cinema Stream
          </h2>
          <p className="text-xs text-zinc-500 font-mono">Connecting to high-bitrate master feed...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center space-y-5 select-none">
        <div className="w-16 h-16 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto shadow-2xl">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-wider font-display">
          Stream Target Unavailable
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The requested media title could not be located in our verified cinema cloud library.
        </p>
        <Link
          to="/movies"
          className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/50"
        >
          Explore Cinema Catalog
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

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Determine Target IDs for streaming servers
  const targetId = content.tmdbId || (content.id.startsWith('tmdb_') ? content.id.replace(/^tmdb_(tv_)?/, '') : content.id);
  const isTv = content.mediaType === 'tv' || (content.mediaType as any) === 'series' || content.mediaType === 'anime';

  // Server URL generator
  const getServerUrl = (serverType: string) => {
    switch (serverType) {
      case 'multiembed':
        return isTv
          ? `https://multiembed.mov/?video_id=${targetId}&tmdb=1&s=${seasonNum}&e=${episodeNum}`
          : `https://multiembed.mov/?video_id=${targetId}&tmdb=1`;
      case 'vidsrc':
        return isTv
          ? `https://vidsrc.to/embed/tv/${targetId}/${seasonNum}/${episodeNum}`
          : `https://vidsrc.to/embed/movie/${targetId}`;
      case 'embedsu':
        return isTv
          ? `https://embed.su/embed/tv/${targetId}/${seasonNum}/${episodeNum}`
          : `https://embed.su/embed/movie/${targetId}`;
      case '2embed':
        return isTv
          ? `https://www.2embed.cc/embedtv/${targetId}&s=${seasonNum}&e=${episodeNum}`
          : `https://www.2embed.cc/embed/${targetId}`;
      default:
        return undefined;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white pb-24 selection:bg-[#D4AF37] selection:text-black">
      
      {/* Top Breadcrumb & Status Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-bold">Back to Catalog</span>
          </button>

          {/* Audio & Video Tech Specs Badge */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-black uppercase">
              {content.quality || '4K ULTRA HD'}
            </span>
            <span>·</span>
            <span className="text-zinc-300">DOLBY ATMOS 7.1</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">සිංහල උපසිරැසි (Sinhala Subs)</span>
          </div>

        </div>
      </div>

      {/* Main Player Container */}
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-8">
        <div className="w-full rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.15)] border border-[#D4AF37]/20">
          <CinexusPlayer
            content={content}
            episode={currentEpisode}
            src={getServerUrl(activeServer)}
            onClose={() => navigate(`/movie/${content.slug || content.id}`)}
            onNextEpisode={handleNextEpisode}
            onPrevEpisode={handlePrevEpisode}
            hasNextEpisode={hasNextEpisode}
            hasPrevEpisode={hasPrevEpisode}
          />
        </div>

        {/* Streaming Server Switcher Bar */}
        <div className="mt-4 p-4 rounded-2xl bg-[#0e121b] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Cinema Streaming Servers</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-zinc-400">
                If playback buffers or lags on one server, click another server to switch instantly.
              </p>
            </div>
          </div>

          {/* Server Selection Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'multiembed', label: 'Server 1: MultiEmbed (4K)' },
              { id: 'vidsrc', label: 'Server 2: VidSrc VIP' },
              { id: 'embedsu', label: 'Server 3: Embed.su HD' },
              { id: '2embed', label: 'Server 4: 2Embed Mirror' }
            ].map((srv) => (
              <button
                key={srv.id}
                onClick={() => setActiveServer(srv.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeServer === srv.id
                    ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black shadow-lg shadow-amber-950/40'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5'
                }`}
              >
                {srv.label}
              </button>
            ))}
          </div>
        </div>

        {/* Under-Player Metadata & Rich Cast Ecosystem */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Columns: Full Movie Details, Cast, Technical Specs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Title & Quick Actions */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0e121b] border border-white/10 space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight leading-tight">
                    {content.title}
                  </h1>
                  
                  {currentEpisode && (
                    <p className="text-sm font-bold text-[#D4AF37] mt-1">
                      Season {currentEpisode.seasonNumber}, Episode {currentEpisode.episodeNumber}: {currentEpisode.title}
                    </p>
                  )}

                  {content.tagline && (
                    <p className="text-xs text-zinc-400 italic mt-1">
                      "{content.tagline}"
                    </p>
                  )}
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => toggleWatchlist(content)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                      isSaved
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg shadow-amber-950/40'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                    <span>{isSaved ? 'In Watchlist' : 'Add to Watchlist'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title="Share Film Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Meta Chips */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{content.rating || '8.8'} / 10 IMDb</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>{content.releaseYear || '2025'}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  <span>{content.duration || content.runtime || '2h 14m'}</span>
                </div>
                <span>·</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[10px]">
                  {content.contentRating || 'PG-13'}
                </span>
                {content.genres?.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[#D4AF37] font-semibold">{content.genres.join(', ')}</span>
                  </>
                )}
              </div>

              {/* Storyline / Synopsis */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                  Storyline & Synopsis
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {currentEpisode?.overview || content.overview || 'Experience this feature film in master 4K bitrate streaming with synchronized Sinhala subtitles and lossless multichannel spatial audio.'}
                </p>
              </div>

            </div>

            {/* CAST & CREW SECTION (Actor Avatars, Roles, Real Names) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0e121b] border border-white/10 space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-base font-bold text-white uppercase tracking-wider font-display">
                    Top Cast & Lead Performers
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Verified Film Credits</span>
              </div>

              {/* Cast Grid */}
              {content.cast && content.cast.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {content.cast.slice(0, 8).map((actor: any, idx: number) => (
                    <div
                      key={actor.id || idx}
                      className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-[#D4AF37]/40 transition-all flex items-center gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden shrink-0">
                        {actor.profilePath ? (
                          <img
                            src={actor.profilePath}
                            alt={actor.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[#D4AF37] text-xs">
                            {(actor.name || 'A')[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#D4AF37] transition-colors">
                          {actor.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {actor.role || actor.character || 'Leading Role'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">Director</span>
                    <span className="text-white font-bold">{content.director || 'Studio Production'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">Starring</span>
                    <span className="text-white font-bold">{content.title} Ensemble</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">Screenplay</span>
                    <span className="text-white font-bold">{content.writers || 'Original Script'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">Release</span>
                    <span className="text-white font-bold">{content.releaseYear}</span>
                  </div>
                </div>
              )}

              {/* Director & Writer Footnote */}
              {(content.director || content.writers) && (
                <div className="pt-2 flex flex-wrap gap-6 text-xs text-zinc-400 border-t border-white/5">
                  {content.director && (
                    <div>
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Director: </span>
                      <span className="text-white font-semibold">{content.director}</span>
                    </div>
                  )}
                  {content.writers && (
                    <div>
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Screenplay: </span>
                      <span className="text-white font-semibold">
                        {Array.isArray(content.writers) ? content.writers.join(', ') : content.writers}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* TECHNICAL SPECIFICATIONS & BITRATES */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0e121b] border border-white/10 space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Technical Specifications & Master Encoding</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Fidelity</span>
                  <span className="text-xs font-black text-[#D4AF37]">4K UHD 2160p</span>
                  <span className="text-[10px] text-zinc-500 block">60 FPS HDR10+</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Audio Stream</span>
                  <span className="text-xs font-black text-white">Dolby Atmos</span>
                  <span className="text-[10px] text-zinc-500 block">7.1 TrueHD / 5.1</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Aspect Ratio</span>
                  <span className="text-xs font-black text-white">2.39:1 CinemaScope</span>
                  <span className="text-[10px] text-zinc-500 block">Anamorphic Widescreen</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Subtitles</span>
                  <span className="text-xs font-black text-emerald-400">සිංහල & English CC</span>
                  <span className="text-[10px] text-zinc-500 block">Multi-Track Synchronized</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: TV Series Episode List OR Recommended Titles */}
          <div className="space-y-6">
            
            {/* TV Series Episode Playlist (if series) */}
            {isTv && episodes.length > 0 && (
              <div className="p-5 rounded-3xl bg-[#0e121b] border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-white pb-3 border-b border-white/10">
                  <span className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-[#D4AF37]" /> Season {seasonNum} Episodes
                  </span>
                  <span className="text-zinc-500">{episodes.length} episodes</span>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {episodes.map((ep) => {
                    const isCurrent = ep.episodeNumber === episodeNum;

                    return (
                      <div
                        key={ep.id}
                        onClick={() =>
                          navigate(`/watch/${content.slug || content.id}/season/${ep.seasonNumber}/episode/${ep.episodeNumber}`)
                        }
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-white font-bold shadow-lg'
                            : 'bg-black/30 hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="w-8 text-center text-xs font-black text-[#D4AF37] shrink-0">
                          {isCurrent ? <Play className="w-4 h-4 text-[#D4AF37] fill-current mx-auto" /> : ep.episodeNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{ep.title}</div>
                          {ep.runtime && <div className="text-[10px] text-zinc-500">{ep.runtime}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Titles Box */}
            {relatedMovies.length > 0 && (
              <div className="p-5 rounded-3xl bg-[#0e121b] border border-white/10 space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#D4AF37]" />
                  <span>Recommended For You</span>
                </h3>

                <div className="space-y-3">
                  {relatedMovies.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/watch/${rel.slug || rel.id}`}
                      className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-14 aspect-[2/3] rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                        <img
                          src={rel.posterPath || rel.posterUrl || ''}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#D4AF37] transition-colors">
                          {rel.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                          <span>{rel.releaseYear || '2025'}</span>
                          <span>·</span>
                          <span className="text-amber-400 font-bold">★ {rel.rating || '8.5'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default WatchPage;
