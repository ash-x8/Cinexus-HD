import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Plus, 
  Check, 
  Star, 
  Users, 
  HardDriveDownload, 
  Sparkles, 
  Clapperboard, 
  Info, 
  Film, 
  Music, 
  Tv, 
  MessageSquarePlus, 
  Award,
  Volume2
} from 'lucide-react';
import { MovieItem, UserReview } from '../types';

interface MovieDetailsModalProps {
  movie: MovieItem;
  onClose: () => void;
  onPlayMovie: (movie: MovieItem, episodeId?: string) => void;
  isInWatchlist: (movieId: string) => boolean;
  onToggleWatchlist: (movie: MovieItem) => void;
  onOpenWatchPartyWithMovie: (movie: MovieItem) => void;
  onOpenDownloadsWithMovie: (movie: MovieItem) => void;
  allMovies: MovieItem[];
  onSelectSimilarMovie: (movie: MovieItem) => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  onClose,
  onPlayMovie,
  isInWatchlist,
  onToggleWatchlist,
  onOpenWatchPartyWithMovie,
  onOpenDownloadsWithMovie,
  allMovies,
  onSelectSimilarMovie
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'specs' | 'reviews'>('overview');
  const [showTrailerEmbed, setShowTrailerEmbed] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);

  // Review submission state
  const [userRating, setUserRating] = useState(10);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [localReviews, setLocalReviews] = useState<UserReview[]>(movie.reviews || []);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const inWatchlist = isInWatchlist(movie.id);

  const similarMovies = allMovies
    .filter((m) => m.id !== movie.id && (
      m.genres.some((g) => movie.genres.includes(g)) || m.mediaType === movie.mediaType
    ))
    .slice(0, 4);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    const newRev: UserReview = {
      id: `rev-${Date.now()}`,
      author: reviewAuthor.trim() || 'Cinexus Viewer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      rating: userRating,
      date: 'Just now',
      comment: reviewComment.trim(),
      verifiedWatch: true
    };

    setLocalReviews([newRev, ...localReviews]);
    setReviewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  return (
    <div 
      id="movie-details-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="movie-details-modal-content"
        className="relative w-full max-w-4xl bg-[#0c1017] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-details-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header: Backdrop or Trailer Video */}
        <div className="relative aspect-video sm:aspect-[21/9] w-full bg-slate-950 overflow-hidden">
          {showTrailerEmbed && movie.trailerYoutubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerYoutubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={`${movie.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <img
              src={movie.backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover object-center"
            />
          )}

          {/* Gradient Overlay */}
          {!showTrailerEmbed && (
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-[#0c1017]/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
              <div className="max-w-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-red-600 font-bold text-[10px] text-white uppercase tracking-wider">
                    {movie.quality}
                  </span>
                  {movie.hasDolbyAtmos && (
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 text-[10px] text-cyan-300 border border-cyan-500/30">
                      Dolby Atmos
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-4xl font-black font-cinema tracking-wide text-white drop-shadow-lg">
                  {movie.title}
                </h2>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              id="details-play-btn"
              onClick={() => onPlayMovie(movie)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-900/40 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now</span>
            </button>

            {movie.trailerYoutubeId && (
              <button
                id="details-trailer-toggle-btn"
                onClick={() => setShowTrailerEmbed(!showTrailerEmbed)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  showTrailerEmbed 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Clapperboard className="w-4 h-4 text-cyan-400" />
                <span>{showTrailerEmbed ? 'Show Poster' : 'Watch Trailer'}</span>
              </button>
            )}

            <button
              id="details-watchlist-btn"
              onClick={() => onToggleWatchlist(movie)}
              className={`p-2.5 rounded-xl border transition-all ${
                inWatchlist 
                  ? 'bg-red-600/30 border-red-500 text-red-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="details-party-btn"
              onClick={() => onOpenWatchPartyWithMovie(movie)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 hover:text-white hover:border-indigo-400 text-xs font-semibold transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Watch Party</span>
            </button>

            <button
              id="details-download-btn"
              onClick={() => onOpenDownloadsWithMovie(movie)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              <span>Offline Download</span>
            </button>
          </div>
        </div>

        {/* Metadata Badges Bar */}
        <div className="px-6 py-3 border-b border-slate-800/60 flex flex-wrap items-center gap-3 text-xs text-slate-300 bg-slate-950/40">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{movie.rating} / 10</span>
          </div>
          <span className="text-emerald-400 font-semibold">🍅 {movie.rottenTomatoesScore}% Rotten Tomatoes</span>
          <span>•</span>
          <span>{movie.releaseYear}</span>
          <span>•</span>
          <span>{movie.duration}</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
            {movie.contentRating}
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            {movie.genres.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded bg-slate-800/80 text-[11px] text-slate-300">
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            id="tab-overview-btn"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'text-red-400 border-red-500 bg-slate-900/60'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Overview & Cast
          </button>

          {movie.episodes && movie.episodes.length > 0 && (
            <button
              id="tab-episodes-btn"
              onClick={() => setActiveTab('episodes')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'episodes'
                  ? 'text-red-400 border-red-500 bg-slate-900/60'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Episodes ({movie.episodes.length})</span>
            </button>
          )}

          <button
            id="tab-specs-btn"
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'specs'
                ? 'text-red-400 border-red-500 bg-slate-900/60'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>4K Tech Specs</span>
          </button>

          <button
            id="tab-reviews-btn"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'text-red-400 border-red-500 bg-slate-900/60'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Reviews ({localReviews.length})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-6">
          
          {/* TAB 1: OVERVIEW & CAST */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Synopsis */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Storyline
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {movie.overview}
                </p>
              </div>

              {/* Cast & Characters */}
              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Featured Cast</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {movie.cast.map((c) => (
                      <div 
                        key={c.id}
                        className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center text-center group hover:border-slate-700 transition-colors"
                      >
                        <img 
                          src={c.avatarUrl || (c.profilePath ? `https://image.tmdb.org/t/p/w185${c.profilePath}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100')} 
                          alt={c.name} 
                          className="w-14 h-14 rounded-full object-cover border-2 border-slate-700 group-hover:border-red-500 transition-colors mb-2 shadow"
                        />
                        <span className="text-xs font-bold text-white line-clamp-1">{c.name}</span>
                        <span className="text-[11px] text-slate-400 line-clamp-1">{c.role || c.character}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Director & Production Info */}
              {movie.techSpecs && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Director</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs.director || 'Master Director'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Cinematographer</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs.cinematographer || 'IMAX Master'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Studio / Network</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs.studio || 'Cinexus Premiere'}</span>
                  </div>
                </div>
              )}

              {/* Trivia Facts */}
              {movie.trivia && movie.trivia.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Behind-The-Scenes Trivia</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {movie.trivia.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Soundtracks */}
              {movie.soundtracks && movie.soundtracks.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4 text-red-400" />
                    <span>Official Motion Picture Soundtrack</span>
                  </h3>
                  <div className="space-y-2">
                    {movie.soundtracks.map((st, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-mono">0{idx + 1}</span>
                          <div>
                            <span className="font-semibold text-white block">{st.title}</span>
                            <span className="text-slate-400 text-[11px]">{st.artist}</span>
                          </div>
                        </div>
                        <span className="text-slate-400 font-mono">{st.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: EPISODES (FOR TV/ANIME) */}
          {activeTab === 'episodes' && movie.episodes && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Season {selectedSeason}</h3>
                <span className="text-xs text-slate-400">{movie.episodes.length} Episodes Available in 4K</span>
              </div>

              <div className="space-y-3">
                {movie.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-4 group transition-colors"
                  >
                    <div className="relative w-full sm:w-40 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0">
                      <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover" />
                      <button
                        id={`play-ep-${ep.id}`}
                        onClick={() => onPlayMovie(movie, ep.id)}
                        className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </button>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                          {ep.episodeNumber}. {ep.title}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">{ep.runtime}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {ep.overview}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TECHNICAL SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Master Broadcast Specifications</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block">Resolution & Transfer</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs?.resolution || '3840 x 2160 (4K UHD Master)'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block">Aspect Ratio</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs?.aspectRatio || '2.39:1 CinemaScope / IMAX'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block">Audio Channels</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs?.audioFormat || 'Dolby Atmos 7.1.4 Lossless'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block">Colorimetry & Dynamic Range</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs?.colorSpace || 'Dolby Vision / DCI-P3 12-bit'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block">Target Stream Bitrate</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs?.bitrate || '45 Mbps HEVC Constant Quality'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block">Encoding Standard</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs?.videoCodec || 'HEVC Main 10 Profile'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block">Production Budget</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs?.budget || 'Major Studio Production'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block">Global Box Office</span>
                    <span className="text-slate-100 font-bold">{movie.techSpecs?.boxOffice || 'Worldwide Premiere'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              
              {/* Add Review Form */}
              <form onSubmit={handleAddReview} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Leave Your Cinema Review
                </h4>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="Your Name / Handle"
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    className="w-full sm:w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-1/2 justify-between">
                    <span className="text-xs text-slate-400">Score:</span>
                    <div className="flex items-center gap-1">
                      {[6, 7, 8, 9, 10].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className={`p-1 rounded ${userRating >= star ? 'text-amber-400' : 'text-slate-600'}`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-1">{userRating}/10</span>
                    </div>
                  </div>
                </div>

                <textarea
                  placeholder="Share your thoughts on the cinematography, plot, or audio mix..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500 resize-none"
                  required
                />

                <div className="flex items-center justify-between">
                  {reviewSubmitted && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Review published!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                  >
                    Post Review
                  </button>
                </div>
              </form>

              {/* Review List */}
              <div className="space-y-3">
                {localReviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={rev.avatar || rev.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                          alt={rev.author || rev.userName || 'User'} 
                          className="w-7 h-7 rounded-full object-cover border border-slate-700" 
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{rev.author || rev.userName || 'Cinema Critic'}</span>
                          <span className="text-[10px] text-slate-400">{rev.date || 'Recent'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{rev.rating}/10</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Similar Recommendations Shelf */}
          {similarMovies.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                More Like This
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {similarMovies.map((sim) => (
                  <div
                    key={sim.id}
                    id={`similar-movie-${sim.id}`}
                    onClick={() => onSelectSimilarMovie(sim)}
                    className="cursor-pointer group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-red-500/60 transition-all p-1"
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden relative">
                      <img 
                        src={sim.posterUrl || (sim.posterPath ? `https://image.tmdb.org/t/p/w500${sim.posterPath}` : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400')} 
                        alt={sim.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-amber-400">
                        ★ {sim.rating}
                      </div>
                    </div>
                    <div className="p-1.5">
                      <div className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                        {sim.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{sim.releaseYear} • {sim.quality}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
