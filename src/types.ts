export type MediaType = 'movie' | 'tv' | 'anime' | 'documentary' | 'all';
export type QualityBadge = '4K Ultra HD' | 'IMAX Enhanced' | 'Dolby Vision' | '1080p FHD' | 'HDR10+' | '720p HD' | 'Auto';
export type QualityTier = QualityBadge;
export type ContentRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'TV-MA' | 'TV-14' | 'TV-PG' | 'All Ages';
export type ContentStatus = 'published' | 'draft' | 'archived' | 'private';
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
  contentId?: string;
  episodeId?: string;
  title: string;
  name?: string;
  url: string;
  type: 'hls' | 'mp4' | 'dash' | 'iframe' | 'embed' | 'cdn' | 'youtube';
  quality: QualityBadge | string;
  priority?: number;
  isDefault?: boolean;
  enabled?: boolean;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerEmbeds {
  streamhg?: string;
  ernvids?: string;
  filemoon?: string;
  custom1?: string;
  custom2?: string;
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
  format?: 'Dolby Atmos' | 'DTS 5.1' | 'Dolby 5.1' | 'Stereo' | 'Director Commentary';
  isDefault?: boolean;
}

export interface EpisodeItem {
  id: string;
  seriesId?: string;
  seasonNumber?: number;
  season?: number;
  episodeNumber: number;
  title: string;
  overview?: string;
  stillPath?: string | null;
  thumbnailUrl?: string;
  runtime?: number | string;
  airDate?: string;
  videoUrl?: string;
  sources?: VideoSource[];
  servers?: ServerEmbeds;
  subtitles?: SubtitleTrack[];
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeasonItem {
  id: string;
  seriesId: string;
  seasonNumber: number;
  name?: string;
  title?: string;
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

export interface MovieItem {
  id: string;
  slug?: string;
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
  logoUrl?: string;
  releaseDate?: string;
  releaseYear: number;
  runtime?: number | string; // minutes or formatted
  duration?: string;
  rottenTomatoesScore?: number;
  genres: string[];
  genreIds?: number[];
  rating: number; // 0 to 10
  voteCount?: number;
  votesCount?: string;
  contentRating: ContentRating;
  quality: QualityBadge | string;
  languages?: string[];
  originalLanguage?: string;
  countries?: string[];
  status?: ContentStatus | string;
  isPublished?: boolean;
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
  galleryImages?: string[];
  tags?: string[];
  sources?: VideoSource[];
  servers?: ServerEmbeds;
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  seasons?: SeasonItem[];
  episodes?: EpisodeItem[];
  techSpecs?: TechSpecsData;
  trivia?: string[];
  soundtracks?: { title: string; artist: string; duration?: string; album?: string; year?: number }[];
  reviews?: UserReview[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SeriesItem extends MovieItem {
  mediaType: 'tv' | 'anime';
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasonsCount?: number;
  episodesCount?: number;
  episodeRuntime?: number[];
}

export interface HeroSlide {
  id: string;
  contentId: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  overview: string;
  backdropPath: string;
  posterPath?: string;
  logoUrl?: string;
  mediaType: 'movie' | 'tv' | 'anime';
  rating?: number;
  releaseYear?: number;
  runtime?: string;
  genres?: string[];
  qualityBadge?: string;
  enabled: boolean;
  order: number;
}

export interface HomepageSectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  type: 'trending' | 'popular_movies' | 'popular_tv' | 'top_rated' | 'new_releases' | 'genre' | 'regional' | 'custom' | 'continue_watching' | 'curated_row' | 'genre_row';
  genreId?: number;
  genreName?: string;
  regionCode?: string;
  enabled: boolean;
  order: number;
  itemLimit?: number;
  limit?: number;
  contentSource?: 'trending' | 'latest' | 'top_rated' | 'genre' | 'featured' | 'custom';
  badge?: string;
  filterGenre?: string;
  filterQuality?: string;
  contentIds?: string[];
  items?: MovieItem[];
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
  date?: string;
  rating: number;
  comment: string;
  status?: 'pending' | 'approved' | 'rejected';
  verifiedWatch?: boolean;
  createdAt?: string;
}

export interface WatchPartyMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  isHost?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
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
  contentId: string;
  episodeId?: string;
  seriesId?: string;
  contentType?: 'movie' | 'tv';
  title: string;
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
  mediaType: 'all' | 'movie' | 'tv' | 'anime';
  genre: string;
  year?: number | 'all';
  minYear?: number;
  maxYear?: number;
  minRating: number;
  quality: string;
  sortBy: string;
  page?: number;
}

export interface ThemeConfig {
  id?: string;
  name?: string;
  primaryAccent: string;
  secondaryAccent: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textMutedColor: string;
  borderRadius: 'sm' | 'md' | 'lg' | 'full';
  motionIntensity: 'subtle' | 'standard' | 'reduced';
  mode: 'dark' | 'light';
  fontDisplay?: string;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  logoUrl?: string;
  faviconUrl?: string;
  badgeUrl?: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  watermarkPosition: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  watermarkMoving?: boolean;
  maintenanceMode: boolean;
  defaultQuality: string;
  allowUserRegistrations: boolean;
  providers?: VideoProvider[];
  theme?: ThemeConfig;
}

export interface VideoProvider {
  id: string;
  name: string;
  domain: string;
  enabled: boolean;
  notes?: string;
}

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  size: number;
  contentType: string;
  category: 'poster' | 'backdrop' | 'video' | 'subtitle' | 'logo' | 'other';
  createdAt: string;
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

export interface AdminStats {
  totalMovies: number;
  totalSeries?: number;
  totalTVSeries?: number;
  totalEpisodes: number;
  totalUsers: number;
  totalViews?: number;
  totalWatchHours?: number;
  activeStreams?: number;
  activeStreamsNow?: number;
  systemStatus?: 'Optimal' | 'Degraded' | 'Maintenance';
  storageUsedGB: number;
  storageMaxGB?: number;
  bandwidthTodayGB?: number;
  viewsToday?: number;
  publishedTitles?: number;
  draftTitles?: number;
  totalReviews?: number;
  tmdbApiStatus?: 'Connected' | 'Error';
  recentRegistrations?: { date: string; count: number }[];
  viewsOverTime?: { date: string; views: number }[];
}

export interface VideoEmbed {
  id: string;
  contentId: string;
  episodeId?: string;
  src: string;
  originalWidth?: number;
  originalHeight?: number;
  aspectRatio: number;
  allowFullscreen: boolean;
  allow?: string;
  providerName?: string;
  providerDomain?: string;
  quality?: string;
  status: 'active' | 'inactive' | 'error';
  createdAt?: string;
  updatedAt?: string;
}
