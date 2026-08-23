import { MovieItem, UserProfile, WatchProgress, UserReview, HomepageSectionConfig, AdminStats, AuditLog } from '../types';

const API_BASE = '/api';

export async function readApiResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const body = await res.text();
  let data: unknown;

  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    const isHtml = /<html|<!doctype/i.test(body);
    throw new Error(isHtml
      ? `API route unavailable (${res.status}). Check the deployment server configuration.`
      : `API returned invalid JSON (${res.status}).`);
  }

  if (!res.ok) {
    const message = typeof data === 'object' && data !== null && 'error' in data
      ? String((data as { error: unknown }).error)
      : `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`API returned an unexpected content type (${contentType || 'unknown'}).`);
  }

  return data as T;
}

// Map TMDB raw item to our rich MovieItem
export function formatTMDBItem(tmdb: any, defaultMediaType: 'movie' | 'tv' = 'movie'): MovieItem {
  const isMovie = (tmdb.media_type || defaultMediaType) === 'movie';
  const title = isMovie ? (tmdb.title || tmdb.original_title) : (tmdb.name || tmdb.original_name);
  const releaseDate = isMovie ? tmdb.release_date : tmdb.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 2024;
  
  // Find official trailer if available
  const trailer = tmdb.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') 
    || tmdb.videos?.results?.find((v: any) => v.site === 'YouTube');

  // Fallback demo video for authorized video player
  const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  ];
  const sampleIndex = Math.abs(Number(tmdb.id) || 0) % sampleVideos.length;

  return {
    id: String(tmdb.id),
    tmdbId: Number(tmdb.id),
    title: title || 'Untitled Cinema',
    originalTitle: isMovie ? tmdb.original_title : tmdb.original_name,
    tagline: tmdb.tagline || (isMovie ? 'Experience in 4K Master Audio & Visuals' : 'Stream all episodes in Ultra HD'),
    overview: tmdb.overview || 'Detailed synopsis and streaming available in 4K Dolby Atmos.',
    mediaType: isMovie ? 'movie' : 'tv',
    posterPath: tmdb.poster_path ? `https://image.tmdb.org/t/p/w780${tmdb.poster_path}` : null,
    backdropPath: tmdb.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdb.backdrop_path}` : (tmdb.poster_path ? `https://image.tmdb.org/t/p/original${tmdb.poster_path}` : null),
    releaseDate: releaseDate || '2024-01-01',
    releaseYear,
    runtime: isMovie ? tmdb.runtime : undefined,
    episodeRuntime: tmdb.episode_run_time,
    numberOfSeasons: !isMovie ? tmdb.number_of_seasons : undefined,
    numberOfEpisodes: !isMovie ? tmdb.number_of_episodes : undefined,
    genres: tmdb.genres ? tmdb.genres.map((g: any) => g.name) : (tmdb.genre_ids ? [] : ['Cinema']),
    genreIds: tmdb.genre_ids,
    rating: tmdb.vote_average ? Number(tmdb.vote_average.toFixed(1)) : 8.2,
    voteCount: tmdb.vote_count || 150,
    popularity: tmdb.popularity,
    contentRating: tmdb.adult ? 'NC-17' : (isMovie ? 'PG-13' : 'TV-MA'),
    quality: tmdb.vote_average > 8.0 ? '4K Ultra HD' : (tmdb.vote_average > 7.4 ? 'IMAX Enhanced' : 'Dolby Vision'),
    languages: tmdb.spoken_languages ? tmdb.spoken_languages.map((l: any) => l.english_name || l.name) : ['English'],
    originalLanguage: tmdb.original_language,
    countries: tmdb.production_countries ? tmdb.production_countries.map((c: any) => c.name) : ['International'],
    status: tmdb.status || 'Released',
    isFeatured: tmdb.vote_average >= 8.2,
    isTrending: true,
    hasDolbyAtmos: true,
    hasDolbyVision: true,
    hasHDR10Plus: true,
    trailerYoutubeId: trailer?.key || (isMovie ? 'Way9Dexny3w' : 'uLtkt8BonwM'),
    director: tmdb.credits?.crew?.find((c: any) => c.job === 'Director')?.name || tmdb.created_by?.[0]?.name || 'Studio Productions',
    writers: tmdb.credits?.crew?.filter((c: any) => ['Writer', 'Screenplay', 'Novel'].includes(c.job)).map((c: any) => c.name),
    productionCompanies: tmdb.production_companies ? tmdb.production_companies.map((c: any) => c.name) : undefined,
    cast: tmdb.credits?.cast ? tmdb.credits.cast.slice(0, 14).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      order: c.order
    })) : undefined,
    crew: tmdb.credits?.crew ? tmdb.credits.crew.slice(0, 8).map((c: any) => ({
      id: c.id,
      name: c.name,
      job: c.job,
      department: c.department,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
    })) : undefined,
    keywords: tmdb.keywords?.keywords?.map((k: any) => k.name) || tmdb.keywords?.results?.map((k: any) => k.name),
    officialWebsite: tmdb.homepage,
    galleryImages: tmdb.images?.backdrops ? tmdb.images.backdrops.slice(0, 6).map((b: any) => `https://image.tmdb.org/t/p/original${b.file_path}`) : undefined,
    sources: [
      {
        id: `src_${tmdb.id}_4k`,
        title: '4K Ultra HD Master Stream',
        url: sampleVideos[sampleIndex],
        type: 'mp4',
        quality: '4K',
        isDefault: true
      },
      {
        id: `src_${tmdb.id}_hls`,
        title: 'Adaptive Multi-Bitrate HLS CDN',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        type: 'hls',
        quality: 'Auto'
      }
    ],
    subtitles: [
      { id: 'sub_en', label: 'English [CC]', language: 'en', src: '', isDefault: true },
      { id: 'sub_si', label: 'Sinhala (සිංහල උපසිරැසි)', language: 'si', src: '' },
      { id: 'sub_es', label: 'Español Latino', language: 'es', src: '' },
      { id: 'sub_fr', label: 'Français', language: 'fr', src: '' },
      { id: 'sub_ja', label: 'Japanese (日本語)', language: 'ja', src: '' }
    ],
    audioTracks: [
      { id: 'aud_atmos', label: 'English - Dolby Atmos 7.1.4', language: 'en', format: 'Dolby Atmos', isDefault: true },
      { id: 'aud_dts', label: 'English - DTS-HD Master 5.1', language: 'en', format: 'DTS 5.1' },
      { id: 'aud_director', label: 'Director & Cast Commentary Track', language: 'en', format: 'Director Commentary' }
    ]
  };
}

export const api = {
  // TMDB Endpoints
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week', page = 1) {
    const res = await fetch(`${API_BASE}/tmdb/trending/${mediaType}/${timeWindow}?page=${page}`);
    const data = await readApiResponse<any>(res);
    return (data.results || []).map((item: any) => formatTMDBItem(item, mediaType === 'all' ? 'movie' : mediaType));
  },

  async getPopular(mediaType: 'movie' | 'tv' = 'movie', page = 1) {
    const res = await fetch(`${API_BASE}/tmdb/popular/${mediaType}?page=${page}`);
    const data = await readApiResponse<any>(res);
    return (data.results || []).map((item: any) => formatTMDBItem(item, mediaType));
  },

  async getTopRated(mediaType: 'movie' | 'tv' = 'movie', page = 1) {
    const res = await fetch(`${API_BASE}/tmdb/top-rated/${mediaType}?page=${page}`);
    const data = await readApiResponse<any>(res);
    return (data.results || []).map((item: any) => formatTMDBItem(item, mediaType));
  },

  async getNowPlaying(mediaType: 'movie' | 'tv' = 'movie', page = 1) {
    const res = await fetch(`${API_BASE}/tmdb/now-playing/${mediaType}?page=${page}`);
    const data = await readApiResponse<any>(res);
    return (data.results || []).map((item: any) => formatTMDBItem(item, mediaType));
  },

  async discover(mediaType: 'movie' | 'tv' = 'movie', params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const res = await fetch(`${API_BASE}/tmdb/discover/${mediaType}?${query.toString()}`);
    const data = await res.json();
    return {
      items: (data.results || []).map((item: any) => formatTMDBItem(item, mediaType)),
      totalResults: data.total_results || 0,
      totalPages: data.total_pages || 1,
      page: data.page || 1
    };
  },

  async search(query: string, type: 'multi' | 'movie' | 'tv' | 'person' = 'multi', page = 1) {
    const res = await fetch(`${API_BASE}/tmdb/search?query=${encodeURIComponent(query)}&type=${type}&page=${page}`);
    const data = await readApiResponse<any>(res);
    return {
      items: (data.results || []).map((item: any) => formatTMDBItem(item, type === 'tv' ? 'tv' : 'movie')),
      totalResults: data.total_results || 0,
      totalPages: data.total_pages || 1
    };
  },

  async getMovieDetails(id: string | number): Promise<MovieItem> {
    const res = await fetch(`${API_BASE}/tmdb/movie/${id}`);
    const data = await res.json();
    return formatTMDBItem(data, 'movie');
  },

  async getTVDetails(id: string | number): Promise<MovieItem> {
    const res = await fetch(`${API_BASE}/tmdb/tv/${id}`);
    const data = await res.json();
    return formatTMDBItem(data, 'tv');
  },

  async getTVSeason(tvId: string | number, seasonNumber: number) {
    const res = await fetch(`${API_BASE}/tmdb/tv/${tvId}/season/${seasonNumber}`);
    return res.json();
  },

  async getGenres() {
    const res = await fetch(`${API_BASE}/tmdb/genres`);
    return res.json();
  },

  // Auth & Profile
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(email: string, password: string, name: string): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data })
    });
    return res.json();
  },

  // Watchlist & History
  async getWatchlist(userId: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/user/watchlist/${userId}`);
    const data = await res.json();
    return data.watchlist || [];
  },

  async addToWatchlist(userId: string, contentId: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/user/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, contentId })
    });
    const data = await res.json();
    return data.watchlist;
  },

  async removeFromWatchlist(userId: string, contentId: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/user/watchlist`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, contentId })
    });
    const data = await res.json();
    return data.watchlist;
  },

  async getWatchHistory(userId: string): Promise<WatchProgress[]> {
    const res = await fetch(`${API_BASE}/user/history/${userId}`);
    const data = await res.json();
    return data.history || [];
  },

  async saveWatchProgress(userId: string, progress: WatchProgress) {
    const res = await fetch(`${API_BASE}/user/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, progress })
    });
    return res.json();
  },

  // Reviews
  async getReviews(contentId: string): Promise<UserReview[]> {
    const res = await fetch(`${API_BASE}/reviews/${contentId}`);
    const data = await res.json();
    return data.reviews || [];
  },

  async postReview(reviewData: Partial<UserReview>): Promise<UserReview> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    const data = await res.json();
    return data.review;
  },

  // Admin APIs
  async getAdminStats(): Promise<{ stats: AdminStats; settings: any; homepageSections: HomepageSectionConfig[] }> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    return readApiResponse(res);
  },

  async getAdminContent(): Promise<MovieItem[]> {
    const res = await fetch(`${API_BASE}/admin/content`);
    const data = await readApiResponse<{ content?: MovieItem[] }>(res);
    return data.content || [];
  },

  async getAdminUsers(): Promise<UserProfile[]> {
    const res = await fetch(`${API_BASE}/admin/users`);
    const data = await readApiResponse<{ users?: UserProfile[] }>(res);
    return data.users || [];
  },

  async updateUserRole(userId: string, role: string, adminEmail: string) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, adminEmail })
    });
    return res.json();
  },

  async importTMDB(tmdbId: number | string, mediaType: 'movie' | 'tv', authorizedSourceUrl?: string, adminEmail?: string) {
    const res = await fetch(`${API_BASE}/admin/tmdb/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId, mediaType, authorizedSourceUrl, adminEmail })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Import failed');
    }
    return res.json();
  },

  async getAdminAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    const data = await readApiResponse<{ logs?: AuditLog[] }>(res);
    return data.logs || [];
  },

  async updateHomepageSections(sections: HomepageSectionConfig[], adminEmail: string) {
    const res = await fetch(`${API_BASE}/admin/cms/sections`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections, adminEmail })
    });
    return res.json();
  },

  async updateSettings(settings: any, adminEmail: string) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, adminEmail })
    });
    return res.json();
  }
};
