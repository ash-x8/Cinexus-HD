import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  MovieItem, 
  UserProfile, 
  WatchProgress, 
  UserReview, 
  HomepageSectionConfig, 
  AuditLog, 
  AdminStats 
} from './src/types';

const PORT = 3000;
const app = express();

// TMDB credentials provided by user
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'abdcc6777a98f6195e7adc6b7d50ed8b';
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhYmRjYzY3NzdhOThmNjE5NWU3YWRjNmI3ZDUwZWQ4YiIsIm5iZiI6MTc4Njg1ODgxMy4wNTUsInN1YiI6IjZhODE0ZDNkOTI4MTYxNTM3NjJiMTIyNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.bnuVpWeDRRerLPOyGYF8BTV5helM2u1SR9C_WTHQbg0';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to make authenticated TMDB requests
async function fetchFromTMDB(endpoint: string, queryParams: Record<string, any> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');

  Object.entries(queryParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, String(val));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json;charset=utf-8'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TMDB API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// In-Memory Database for State & Admin Management
interface DatabaseState {
  users: UserProfile[];
  passwords: Record<string, string>; // email -> password
  watchlist: Record<string, string[]>; // userId -> contentId[]
  watchHistory: Record<string, Record<string, WatchProgress>>; // userId -> (contentId -> WatchProgress)
  customContent: MovieItem[];
  reviews: UserReview[];
  auditLogs: AuditLog[];
  homepageSections: HomepageSectionConfig[];
  settings: {
    siteName: string;
    siteTagline: string;
    maintenanceMode: boolean;
    defaultQuality: string;
    allowUserRegistrations: boolean;
  };
  analytics: {
    viewsCount: number;
    watchHours: number;
    dailyViews: Record<string, number>;
  };
}

const db: DatabaseState = {
  users: [
    {
      id: 'usr_admin_01',
      email: 'kushanashvika216@gmail.com',
      name: 'Kushan Ashvika',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'SUPER_ADMIN',
      createdAt: '2026-01-01T00:00:00.000Z',
      preferences: {
        defaultQuality: '4K',
        defaultSubtitleLang: 'English [CC]',
        autoplayNext: true
      }
    },
    {
      id: 'usr_demo_02',
      email: 'viewer@cinexus.app',
      name: 'Cinema Enthusiast',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'USER',
      createdAt: '2026-02-10T12:00:00.000Z'
    }
  ],
  passwords: {
    'kushanashvika216@gmail.com': 'cinexus@07',
    'viewer@cinexus.app': 'cinexus123'
  },
  watchlist: {
    'usr_admin_01': [],
    'usr_demo_02': []
  },
  watchHistory: {
    'usr_admin_01': {},
    'usr_demo_02': {}
  },
  customContent: [],
  reviews: [
    {
      id: 'rev_01',
      contentId: '693134', // Dune: Part Two
      contentType: 'movie',
      userId: 'usr_demo_02',
      userName: 'Cinema Enthusiast',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      rating: 10,
      comment: 'An absolute cinematic triumph. The sound design in Dolby Atmos and Hans Zimmers score shake the room!',
      createdAt: '2026-03-01T15:30:00.000Z',
      isApproved: true
    }
  ],
  auditLogs: [
    {
      id: 'log_01',
      adminEmail: 'kushanashvika216@gmail.com',
      action: 'SYSTEM_BOOTSTRAP',
      entity: 'Platform',
      entityId: 'CINEXUS-V1',
      timestamp: new Date().toISOString(),
      details: 'CINEXUS Entertainment platform online with TMDB API v3 active'
    }
  ],
  homepageSections: [
    { id: 'sec-trending', title: 'Trending Now', subtitle: 'Most watched blockbusters and trending releases this week', type: 'trending', enabled: true, order: 1, itemLimit: 20 },
    { id: 'sec-popular-movies', title: 'Popular Movies', subtitle: 'Top box office and critical hits streaming in 4K', type: 'popular_movies', enabled: true, order: 2, itemLimit: 20 },
    { id: 'sec-popular-tv', title: 'Popular TV Series', subtitle: 'Binge-worthy prestige series and ongoing seasons', type: 'popular_tv', enabled: true, order: 3, itemLimit: 20 },
    { id: 'sec-top-rated', title: 'Top Rated of All Time', subtitle: 'Masterpiece cinema with highest IMDb and TMDB scores', type: 'top_rated', enabled: true, order: 4, itemLimit: 20 },
    { id: 'sec-action', title: 'Action & Adrenaline', subtitle: 'High-octane stunt choreography, chases, and blockbusters', type: 'genre', genreId: 28, genreName: 'Action', enabled: true, order: 5, itemLimit: 20 },
    { id: 'sec-scifi', title: 'Sci-Fi & Cyberpunk', subtitle: 'Mind-bending speculative realities and space odysseys', type: 'genre', genreId: 878, genreName: 'Sci-Fi', enabled: true, order: 6, itemLimit: 20 },
    { id: 'sec-animation', title: 'Animation & Anime', subtitle: 'Stunning animated features and top-tier series', type: 'genre', genreId: 16, genreName: 'Animation', enabled: true, order: 7, itemLimit: 20 },
    { id: 'sec-korean', title: 'Korean Cinema & K-Dramas', subtitle: 'Award-winning Korean thrillers, dramas, and series', type: 'regional', regionCode: 'ko', enabled: true, order: 8, itemLimit: 20 },
    { id: 'sec-indian', title: 'Indian Cinema & Blockbusters', subtitle: 'Epic action, high drama, and multi-language releases', type: 'regional', regionCode: 'hi', enabled: true, order: 9, itemLimit: 20 },
    { id: 'sec-sinhala', title: 'Sinhala Subtitled Releases', subtitle: 'Curated international cinema with high quality Sinhala subtitles', type: 'custom', enabled: true, order: 10, itemLimit: 20 }
  ],
  settings: {
    siteName: 'CINEXUS',
    siteTagline: 'Ultra Cinema Streaming & Discovery',
    maintenanceMode: false,
    defaultQuality: '4K Ultra HD',
    allowUserRegistrations: true
  },
  analytics: {
    viewsCount: 14820,
    watchHours: 36400,
    dailyViews: {
      '2026-08-16': 1890,
      '2026-08-17': 2140,
      '2026-08-18': 2390,
      '2026-08-19': 2820,
      '2026-08-20': 3110,
      '2026-08-21': 3650,
      '2026-08-22': 4120
    }
  }
};

// ==========================================
// 1. TMDB PROXY API ROUTES
// ==========================================

// Trending Content
app.get('/api/tmdb/trending/:mediaType/:timeWindow', async (req: Request, res: Response) => {
  try {
    const { mediaType = 'all', timeWindow = 'week' } = req.params;
    const page = req.query.page || 1;
    const data = await fetchFromTMDB(`/trending/${mediaType}/${timeWindow}`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Popular Movies & TV
app.get('/api/tmdb/popular/:mediaType', async (req: Request, res: Response) => {
  try {
    const { mediaType = 'movie' } = req.params;
    const page = req.query.page || 1;
    const data = await fetchFromTMDB(`/${mediaType}/popular`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Top Rated
app.get('/api/tmdb/top-rated/:mediaType', async (req: Request, res: Response) => {
  try {
    const { mediaType = 'movie' } = req.params;
    const page = req.query.page || 1;
    const data = await fetchFromTMDB(`/${mediaType}/top_rated`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Now Playing / Airing Today
app.get('/api/tmdb/now-playing/:mediaType', async (req: Request, res: Response) => {
  try {
    const { mediaType = 'movie' } = req.params;
    const endpoint = mediaType === 'tv' ? '/tv/on_the_air' : '/movie/now_playing';
    const page = req.query.page || 1;
    const data = await fetchFromTMDB(endpoint, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Discover with rich filters
app.get('/api/tmdb/discover/:mediaType', async (req: Request, res: Response) => {
  try {
    const { mediaType = 'movie' } = req.params;
    const { 
      page = 1, 
      sort_by = 'popularity.desc', 
      with_genres, 
      primary_release_year, 
      first_air_date_year,
      with_original_language, 
      'vote_average.gte': vote_average_gte,
      'vote_count.gte': vote_count_gte = 50 
    } = req.query;

    const params: Record<string, any> = {
      page,
      sort_by,
      'vote_count.gte': vote_count_gte
    };

    if (with_genres) params.with_genres = with_genres;
    if (primary_release_year) params.primary_release_year = primary_release_year;
    if (first_air_date_year) params.first_air_date_year = first_air_date_year;
    if (with_original_language) params.with_original_language = with_original_language;
    if (vote_average_gte) params['vote_average.gte'] = vote_average_gte;

    const data = await fetchFromTMDB(`/discover/${mediaType}`, params);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Instant Search
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  try {
    const { query, type = 'multi', page = 1 } = req.query;
    if (!query) {
      return res.json({ results: [], total_results: 0, total_pages: 0 });
    }
    const endpoint = type === 'movie' ? '/search/movie' : type === 'tv' ? '/search/tv' : type === 'person' ? '/search/person' : '/search/multi';
    const data = await fetchFromTMDB(endpoint, { query, page, include_adult: false });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Detailed Movie
app.get('/api/tmdb/movie/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}`, {
      append_to_response: 'credits,videos,images,similar,recommendations,release_dates,keywords'
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Detailed TV Series
app.get('/api/tmdb/tv/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}`, {
      append_to_response: 'credits,videos,images,similar,recommendations,aggregate_credits,keywords'
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// TV Season Episodes
app.get('/api/tmdb/tv/:id/season/:seasonNumber', async (req: Request, res: Response) => {
  try {
    const { id, seasonNumber } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`, {
      append_to_response: 'videos,images'
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Collection
app.get('/api/tmdb/collection/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/collection/${id}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Person Credits
app.get('/api/tmdb/person/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/person/${id}`, {
      append_to_response: 'combined_credits,images'
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Genres list
app.get('/api/tmdb/genres', async (req: Request, res: Response) => {
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      fetchFromTMDB('/genre/movie/list'),
      fetchFromTMDB('/genre/tv/list')
    ]);
    res.json({ movieGenres: movieGenres.genres || [], tvGenres: tvGenres.genres || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. AUTHENTICATION & USERS
// ==========================================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  const storedPassword = db.passwords[email.toLowerCase()];

  if (!user || storedPassword !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Record audit log
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: user.email,
    action: 'USER_LOGIN',
    entity: 'User',
    entityId: user.id,
    timestamp: new Date().toISOString(),
    details: `User ${user.name} (${user.role}) logged in`
  });

  res.json({
    user,
    token: `cinexus_token_${user.id}_${Date.now()}`
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const newUser: UserProfile = {
    id: `usr_${Date.now()}`,
    email: email.toLowerCase(),
    name,
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    role: 'USER',
    createdAt: new Date().toISOString(),
    preferences: {
      defaultQuality: '4K',
      defaultSubtitleLang: 'English [CC]',
      autoplayNext: true
    }
  };

  db.users.push(newUser);
  db.passwords[email.toLowerCase()] = password;
  db.watchlist[newUser.id] = [];
  db.watchHistory[newUser.id] = {};

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: 'SYSTEM',
    action: 'USER_REGISTERED',
    entity: 'User',
    entityId: newUser.id,
    timestamp: new Date().toISOString(),
    details: `New account created for ${name} (${email})`
  });

  res.status(201).json({
    user: newUser,
    token: `cinexus_token_${newUser.id}_${Date.now()}`
  });
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const { userId, name, avatarUrl, preferences } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name) user.name = name;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  res.json({ user });
});

// ==========================================
// 3. WATCHLIST & CONTINUE WATCHING HISTORY
// ==========================================

app.get('/api/user/watchlist/:userId', (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const list = db.watchlist[userId] || [];
  res.json({ watchlist: list });
});

app.post('/api/user/watchlist', (req: Request, res: Response) => {
  const { userId, contentId } = req.body;
  if (!userId || !contentId) return res.status(400).json({ error: 'Missing parameters' });

  if (!db.watchlist[userId]) db.watchlist[userId] = [];
  if (!db.watchlist[userId].includes(contentId)) {
    db.watchlist[userId].unshift(contentId);
  }
  res.json({ watchlist: db.watchlist[userId] });
});

app.delete('/api/user/watchlist', (req: Request, res: Response) => {
  const { userId, contentId } = req.body;
  if (db.watchlist[userId]) {
    db.watchlist[userId] = db.watchlist[userId].filter(id => id !== contentId);
  }
  res.json({ watchlist: db.watchlist[userId] || [] });
});

app.get('/api/user/history/:userId', (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const historyMap = db.watchHistory[userId] || {};
  const historyList = (Object.values(historyMap) as WatchProgress[]).sort((a, b) => 
    new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
  );
  res.json({ history: historyList });
});

app.post('/api/user/history', (req: Request, res: Response) => {
  const { userId, progress } = req.body;
  if (!userId || !progress?.contentId) return res.status(400).json({ error: 'Missing parameters' });

  if (!db.watchHistory[userId]) db.watchHistory[userId] = {};
  db.watchHistory[userId][progress.contentId] = {
    ...progress,
    lastWatchedAt: new Date().toISOString()
  };

  // Update global metrics
  db.analytics.viewsCount += 1;
  db.analytics.watchHours += Math.round((progress.currentTime || 0) / 3600);

  res.json({ success: true, progress: db.watchHistory[userId][progress.contentId] });
});

// ==========================================
// 4. REVIEWS & RATINGS
// ==========================================

app.get('/api/reviews/:contentId', (req: Request, res: Response) => {
  const { contentId } = req.params;
  const contentReviews = db.reviews.filter(r => r.contentId === contentId);
  res.json({ reviews: contentReviews });
});

app.post('/api/reviews', (req: Request, res: Response) => {
  const { contentId, contentType, userId, userName, userAvatar, rating, comment } = req.body;
  if (!contentId || !userId || !comment) return res.status(400).json({ error: 'Missing parameters' });

  const newReview: UserReview = {
    id: `rev_${Date.now()}`,
    contentId,
    contentType: contentType || 'movie',
    userId,
    userName: userName || 'Anonymous',
    userAvatar,
    rating: Number(rating) || 10,
    comment,
    createdAt: new Date().toISOString(),
    isApproved: true
  };

  db.reviews.unshift(newReview);
  res.status(201).json({ review: newReview });
});

// ==========================================
// 5. ADMIN STUDIO & MANAGEMENT
// ==========================================

// Admin Statistics & Overview
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const stats: AdminStats = {
    totalMovies: 1240 + db.customContent.filter(c => c.mediaType === 'movie').length,
    totalTVSeries: 480 + db.customContent.filter(c => c.mediaType === 'tv').length,
    totalEpisodes: 3850,
    totalUsers: db.users.length,
    totalViews: db.analytics.viewsCount,
    totalWatchHours: db.analytics.watchHours,
    activeStreamsNow: 42,
    systemStatus: db.settings.maintenanceMode ? 'Maintenance' : 'Optimal',
    storageUsedGB: 184.2,
    storageMaxGB: 1024,
    tmdbApiStatus: 'Connected',
    recentRegistrations: [
      { date: 'Mon', count: 14 },
      { date: 'Tue', count: 22 },
      { date: 'Wed', count: 18 },
      { date: 'Thu', count: 35 },
      { date: 'Fri', count: 48 },
      { date: 'Sat', count: 65 },
      { date: 'Sun', count: 52 }
    ],
    viewsOverTime: Object.entries(db.analytics.dailyViews).map(([date, views]) => ({ date, views }))
  };

  res.json({ stats, settings: db.settings, homepageSections: db.homepageSections });
});

// Admin Users List & Roles
app.get('/api/admin/users', (req: Request, res: Response) => {
  res.json({ users: db.users });
});

app.put('/api/admin/users/:userId/role', (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const { role, adminEmail } = req.body;
  const targetUser = db.users.find(u => u.id === userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const oldRole = targetUser.role;
  targetUser.role = role;

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: adminEmail || 'kushanashvika216@gmail.com',
    action: 'USER_ROLE_UPDATED',
    entity: 'User',
    entityId: userId,
    timestamp: new Date().toISOString(),
    details: `Changed role of ${targetUser.name} from ${oldRole} to ${role}`
  });

  res.json({ user: targetUser });
});

// 1-Click TMDB Importer & Custom Content Creator
app.post('/api/admin/tmdb/import', async (req: Request, res: Response) => {
  try {
    const { tmdbId, mediaType, authorizedSourceUrl, adminEmail } = req.body;
    if (!tmdbId || !mediaType) {
      return res.status(400).json({ error: 'TMDB ID and MediaType are required' });
    }

    const endpoint = mediaType === 'tv' 
      ? `/tv/${tmdbId}?append_to_response=credits,videos,images,keywords`
      : `/movie/${tmdbId}?append_to_response=credits,videos,images,keywords`;

    const tmdbData = await fetchFromTMDB(endpoint);

    const isMovie = mediaType === 'movie';
    const title = isMovie ? tmdbData.title : tmdbData.name;
    const releaseDate = isMovie ? tmdbData.release_date : tmdbData.first_air_date;
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 2024;

    // Find official trailer
    const trailer = tmdbData.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || tmdbData.videos?.results?.[0];

    // Build standard MovieItem
    const importedItem: MovieItem = {
      id: `cx_${tmdbId}`,
      tmdbId: Number(tmdbId),
      title,
      originalTitle: isMovie ? tmdbData.original_title : tmdbData.original_name,
      tagline: tmdbData.tagline || 'Experience in Ultra High Definition Cinema',
      overview: tmdbData.overview || 'Exclusive premium cinematic presentation.',
      mediaType: isMovie ? 'movie' : 'tv',
      posterPath: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}` : null,
      backdropPath: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : null,
      releaseDate: releaseDate || '2024-01-01',
      releaseYear,
      runtime: isMovie ? tmdbData.runtime : undefined,
      numberOfSeasons: !isMovie ? tmdbData.number_of_seasons : undefined,
      numberOfEpisodes: !isMovie ? tmdbData.number_of_episodes : undefined,
      genres: (tmdbData.genres || []).map((g: any) => g.name),
      rating: tmdbData.vote_average ? Number(tmdbData.vote_average.toFixed(1)) : 8.5,
      voteCount: tmdbData.vote_count || 120,
      contentRating: 'PG-13',
      quality: '4K Ultra HD',
      languages: (tmdbData.spoken_languages || []).map((l: any) => l.english_name || l.name),
      countries: (tmdbData.production_countries || []).map((c: any) => c.name),
      status: tmdbData.status || 'Released',
      isFeatured: true,
      isTrending: true,
      hasDolbyAtmos: true,
      hasDolbyVision: true,
      hasHDR10Plus: true,
      trailerYoutubeId: trailer?.key || 'Way9Dexny3w',
      director: tmdbData.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'Studio Production',
      cast: (tmdbData.credits?.cast || []).slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
      })),
      sources: [
        {
          id: `src_${Date.now()}_4k`,
          title: 'Authorized 4K Master Stream (HEVC)',
          url: authorizedSourceUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          type: 'mp4',
          quality: '4K',
          isDefault: true
        },
        {
          id: `src_${Date.now()}_hls`,
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
        { id: 'sub_ja', label: 'Japanese (日本語)', language: 'ja', src: '' }
      ],
      createdAt: new Date().toISOString()
    };

    // Store in custom content
    db.customContent = db.customContent.filter(c => c.id !== importedItem.id);
    db.customContent.unshift(importedItem);

    // Audit log
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminEmail: adminEmail || 'kushanashvika216@gmail.com',
      action: 'TMDB_CONTENT_IMPORTED',
      entity: mediaType.toUpperCase(),
      entityId: importedItem.id,
      timestamp: new Date().toISOString(),
      details: `Imported "${title}" (TMDB ID: ${tmdbId}) with 4K stream and metadata`
    });

    res.status(201).json({ success: true, item: importedItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Custom Content CRUD
app.get('/api/admin/content', (req: Request, res: Response) => {
  res.json({ content: db.customContent });
});

app.post('/api/admin/content', (req: Request, res: Response) => {
  const item: MovieItem = req.body;
  if (!item.title) return res.status(400).json({ error: 'Title is required' });

  item.id = item.id || `cx_${Date.now()}`;
  item.createdAt = new Date().toISOString();

  db.customContent.unshift(item);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.body.adminEmail || 'kushanashvika216@gmail.com',
    action: 'CONTENT_CREATED',
    entity: item.mediaType.toUpperCase(),
    entityId: item.id,
    timestamp: new Date().toISOString(),
    details: `Created title "${item.title}"`
  });

  res.status(201).json({ item });
});

app.delete('/api/admin/content/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const removed = db.customContent.find(c => c.id === id);
  db.customContent = db.customContent.filter(c => c.id !== id);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: 'kushanashvika216@gmail.com',
    action: 'CONTENT_DELETED',
    entity: 'Content',
    entityId: id,
    timestamp: new Date().toISOString(),
    details: `Deleted "${removed?.title || id}"`
  });

  res.json({ success: true });
});

// Homepage Sections CMS
app.get('/api/admin/cms/sections', (req: Request, res: Response) => {
  res.json({ sections: db.homepageSections });
});

app.put('/api/admin/cms/sections', (req: Request, res: Response) => {
  const { sections, adminEmail } = req.body;
  if (Array.isArray(sections)) {
    db.homepageSections = sections;
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminEmail: adminEmail || 'kushanashvika216@gmail.com',
      action: 'HOMEPAGE_SECTIONS_REORDERED',
      entity: 'HomepageCMS',
      entityId: 'ALL',
      timestamp: new Date().toISOString(),
      details: `Updated ${sections.length} homepage sections configuration`
    });
  }
  res.json({ sections: db.homepageSections });
});

// Audit Logs
app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  res.json({ logs: db.auditLogs.slice(0, 100) });
});

// Settings
app.get('/api/admin/settings', (req: Request, res: Response) => {
  res.json({ settings: db.settings });
});

app.put('/api/admin/settings', (req: Request, res: Response) => {
  const { settings, adminEmail } = req.body;
  db.settings = { ...db.settings, ...settings };

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: adminEmail || 'kushanashvika216@gmail.com',
    action: 'SETTINGS_UPDATED',
    entity: 'SiteSettings',
    entityId: 'SYSTEM',
    timestamp: new Date().toISOString(),
    details: `Updated global site settings`
  });

  res.json({ settings: db.settings });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', platform: 'CINEXUS', time: new Date().toISOString() });
});

// ==========================================
// 6. VITE MIDDLEWARE & STATIC APP SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CINEXUS Streaming Server online on port ${PORT}`);
  });
}

export default app;

if (process.env.VERCEL !== '1') {
  startServer();
}
