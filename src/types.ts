export type MediaType = 'movie' | 'tv' | 'collection' | 'person' | 'anime' | 'documentary' | 'all';
export type QualityBadge = '4K Ultra HD' | 'IMAX Enhanced' | 'Dolby Vision' | '1080p FHD' | 'HDR10+';
export type QualityTier = 'all' | '4K Ultra HD' | 'IMAX Enhanced' | 'Dolby Vision' | '1080p FHD' | 'HDR10+';
export type ContentRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'TV-MA' | 'TV-14' | 'TV-PG' | 'All Ages';
export type UserRole = 'USER' | 'EDITOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface CastMember {
  id: number | string;
  name: string;
  character?: string;
  role?: string;
  profilePath?: string | null;
  avatarUrl?: string;
  order?: number | string;
}

export interface CrewMember {
  id: number | string;
  name: string;
  job: string;
  department: string;
  profilePath?: string | null;
}

export interface VideoSource {
  id: string;
  title: string;
  url: string;
  type: 'hls' | 'mp4' | 'cdn' | 'youtube';
  quality: '4K' | '1080p' | '720p' | '480p' | 'Auto';
  isDefault?: boolean;
}

export interface ServerEmbeds {
  streamhg?: string;
  ernvids?: string;
  filemoon?: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;
  isDefault?: boolean;
}

export interface AudioTrack {
  id: string;
  label: string;
  language: string;
  format: 'Dolby Atmos' | 'DTS 5.1' | 'Dolby 5.1' | 'Stereo' | 'Director Commentary';
  isDefault?: boolean;
}

export interface EpisodeItem {
  id: string;
  episodeNumber: number;
  seasonNumber?: number;
  season?: number;
  title: string;
  overview?: string;
  airDate?: string;
  runtime?: number | string; // in minutes
  duration?: string;
  stillPath?: string | null;
  thumbnailUrl?: string;
  videoUrl?: string;
  voteAverage?: number;
  sources?: VideoSource[];
  subtitles?: SubtitleTrack[];
}

export interface SeasonItem {
  id: string;
  seasonNumber: number;
  name: string;
  overview?: string;
  posterPath?: string | null;
  airDate?: string;
  episodeCount?: number;
  episodes: EpisodeItem[];
}

export interface TechSpecsData {
  resolution?: string;
  aspectRatio?: string;
  audioFormat?: string;
  colorSpace?: string;
  bitrate?: string;
  videoCodec?: string;
  director?: string;
  cinematographer?: string;
  studio?: string;
  budget?: string;
  boxOffice?: string;
}

export interface SoundtrackItem {
  title: string;
  artist: string;
  duration: string;
}

export interface MovieItem {
  id: string;
  tmdbId?: number;
  title: string;
  originalTitle?: string;
  tagline?: string;
  overview: string;
  mediaType: 'movie' | 'tv' | 'anime' | 'documentary';
  posterPath?: string | null;
  posterUrl?: string;
  backdropPath?: string | null;
  backdropUrl?: string;
  releaseDate?: string;
  releaseYear: number;
  runtime?: number; // minutes for movie
  duration?: string;
  episodeRuntime?: number[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  genres: string[];
  genreIds?: number[];
  rating: number; // 0 to 10
  voteCount?: number;
  votesCount?: string;
  rottenTomatoesScore?: number;
  popularity?: number;
  contentRating: ContentRating;
  quality: QualityBadge | string;
  languages?: string[];
  originalLanguage?: string;
  countries?: string[];
  status?: string; // 'Released' | 'In Production' | 'Returning Series' | 'Ended'
  isFeatured?: boolean;
  isFeaturedHero?: boolean;
  isTrending?: boolean;
  isTrendingToday?: boolean;
  isTop10?: number;
  isExclusive?: boolean;
  isEditorPick?: boolean;
  isAwardWinner?: boolean;
  isSinhalaSubtitled?: boolean;
  hasDolbyAtmos?: boolean;
  hasDolbyVision?: boolean;
  hasHDR10Plus?: boolean;
  trailerYoutubeId?: string;
  demoVideoUrl?: string;
  director?: string;
  writers?: string[];
  productionCompanies?: string[];
  cast?: CastMember[];
  crew?: CrewMember[];
  keywords?: string[];
  officialWebsite?: string;
  galleryImages?: string[];
  sources?: VideoSource[];
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  /** Authorized, admin-configured provider embeds. Never inferred from a TMDB id. */
  servers?: ServerEmbeds;
  seasons?: SeasonItem[];
  episodes?: EpisodeItem[];
  techSpecs?: TechSpecsData;
  trivia?: string[];
  soundtracks?: SoundtrackItem[];
  reviews?: UserReview[];
  collectionId?: string;
  collectionName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollectionItem {
  id: string;
  tmdbId?: number;
  name: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  parts: MovieItem[];
  genre?: string;
}

export interface UserReview {
  id: string;
  contentId?: string;
  contentType?: 'movie' | 'tv';
  userId?: string;
  userName?: string;
  userAvatar?: string;
  author?: string;
  avatar?: string;
  rating: number;
  comment: string;
  createdAt?: string;
  date?: string;
  verifiedWatch?: boolean;
  isFlagged?: boolean;
  isApproved?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
  preferences?: {
    defaultQuality: '4K' | '1080p' | 'Auto';
    defaultSubtitleLang: string;
    autoplayNext: boolean;
  };
}

export interface WatchProgress {
  movieId?: string;
  contentId?: string;
  contentType?: 'movie' | 'tv';
  title?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  currentTime: number;
  duration: number;
  percentage: number;
  lastWatchedAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  mediaType: 'all' | 'movie' | 'tv';
  genre: string;
  year?: number | 'all';
  minYear?: number;
  maxYear?: number;
  minRating: number;
  language?: string;
  country?: string;
  quality: string;
  sortBy: string;
  page?: number;
}

export interface WatchPartyMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time?: string;
  timestamp?: string;
  isHost?: boolean;
}

export interface HomepageSectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  type: 'trending' | 'popular_movies' | 'popular_tv' | 'top_rated' | 'new_releases' | 'genre' | 'regional' | 'custom' | 'continue_watching';
  genreId?: number;
  genreName?: string;
  regionCode?: string;
  enabled: boolean;
  order: number;
  itemLimit: number;
  items?: MovieItem[];
}

export interface AdminStats {
  totalMovies: number;
  totalTVSeries: number;
  totalEpisodes: number;
  totalUsers: number;
  totalViews: number;
  totalWatchHours: number;
  activeStreamsNow: number;
  systemStatus: 'Optimal' | 'Degraded' | 'Maintenance';
  storageUsedGB: number;
  storageMaxGB: number;
  tmdbApiStatus: 'Connected' | 'Error';
  recentRegistrations: { date: string; count: number }[];
  viewsOverTime: { date: string; views: number }[];
}

export interface VideoEmbed {
  id: string;
  contentId: string;
  episodeId?: string;
  src: string;
  originalWidth?: number;
  originalHeight?: number;
  aspectRatio: number; // e.g. 1.777 (16:9) or width/height
  allowFullscreen: boolean;
  allow?: string;
  providerName?: string;
  providerDomain?: string;
  quality?: string;
  status: 'active' | 'inactive' | 'error';
  createdAt?: string;
  updatedAt?: string;
}

export interface VideoProvider {
  id: string;
  name: string;
  domain: string;
  enabled: boolean;
  notes?: string;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  logoUrl?: string;
  badgeUrl?: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  watermarkPosition: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  maintenanceMode: boolean;
  defaultQuality: string;
  allowUserRegistrations: boolean;
  providers: VideoProvider[];
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  ip?: string;
  details?: string;
}
