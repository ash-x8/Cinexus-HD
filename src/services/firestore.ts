import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  MovieItem, 
  EpisodeItem, 
  HomepageSectionConfig, 
  SiteSettings, 
  AuditLog, 
  WatchProgress,
  UserProfile 
} from '../types';
import { MOVIES_DATABASE } from '../data/moviesData';

const COLLECTIONS = {
  MOVIES: 'movies',
  SERIES: 'series',
  EPISODES: 'episodes',
  HOMEPAGE: 'homepageSections',
  SETTINGS: 'settings',
  AUDIT: 'auditLogs',
  USERS: 'users',
  WATCHLISTS: 'watchlists',
  HISTORY: 'watchHistory'
};

// Default dynamic homepage rails configuration
export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  {
    id: 'trending-today',
    title: 'Trending Today Across CINEXUS',
    subtitle: 'Highest stream density & 4K viewership in real-time',
    type: 'curated_row',
    contentSource: 'featured',
    badge: 'HOT',
    limit: 12,
    order: 1,
    enabled: true,
    filterGenre: 'all',
    filterQuality: 'all'
  },
  {
    id: 'sinhala-subtitles',
    title: 'Sinhala Subtitled 4K Blockbusters (සිංහල උපසිරැසි)',
    subtitle: 'Synchronized master Sinhala translation tracks',
    type: 'curated_row',
    contentSource: 'latest',
    badge: 'SINHALA SUB',
    limit: 12,
    order: 2,
    enabled: true,
    filterGenre: 'all',
    filterQuality: 'all'
  },
  {
    id: 'four-k-masters',
    title: '4K Ultra HD & IMAX Enhanced Cinema',
    subtitle: 'Master visual tracks with Dolby Vision HDR & Atmos',
    type: 'curated_row',
    contentSource: 'top_rated',
    badge: '4K MASTER',
    limit: 12,
    order: 3,
    enabled: true,
    filterGenre: 'all',
    filterQuality: '4K Ultra HD'
  },
  {
    id: 'cyberpunk-scifi',
    title: 'Cyberpunk & Sci-Fi Dimensions',
    subtitle: 'Futuristic thrillers, artificial intelligence & space exploration',
    type: 'genre_row',
    contentSource: 'genre',
    limit: 12,
    order: 4,
    enabled: true,
    filterGenre: 'Sci-Fi',
    filterQuality: 'all'
  },
  {
    id: 'imax-wildlife',
    title: 'IMAX Wildlife & Earth Expeditions',
    subtitle: 'Stunning planetary visuals captured in native 8K sensors',
    type: 'genre_row',
    contentSource: 'genre',
    limit: 12,
    order: 5,
    enabled: true,
    filterGenre: 'Documentary',
    filterQuality: 'all'
  }
];

// Default site settings
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'CINEXUS',
  siteTagline: 'STREAM. WATCH. EXPERIENCE.',
  siteDescription: 'Ultra 4K Cinema Discovery & Streaming Platform with master quality feeds.',
  watermarkEnabled: true,
  watermarkOpacity: 0.75,
  watermarkPosition: 'top-right',
  maintenanceMode: false,
  defaultQuality: '4K',
  allowUserRegistrations: true,
  providers: [
    { id: 'p1', name: 'CINEXUS Dedicated HLS Stream', domain: 'cdn.cinexus.app', enabled: true },
    { id: 'p2', name: 'Cloud Storage Direct Media', domain: 'commondatastorage.googleapis.com', enabled: true },
    { id: 'p3', name: 'YouTube Official 4K Embed', domain: 'youtube.com', enabled: true },
    { id: 'p4', name: 'Mux Video Engine', domain: 'stream.mux.com', enabled: true }
  ]
};

// ==========================================
// 1. SEEDING & INITIALIZATION
// ==========================================

export async function initializeFirestoreDatabase(): Promise<void> {
  try {
    const moviesRef = collection(db, COLLECTIONS.MOVIES);
    const snap = await getDocs(query(moviesRef, limit(1)));

    if (snap.empty) {
      console.log('[CINEXUS Firestore] Initializing Firestore master catalog...');
      const batch = writeBatch(db);

      // Seed curated titles into Firestore
      MOVIES_DATABASE.forEach((movie) => {
        // Strip any mock demo links
        const cleanMovie: MovieItem = {
          ...movie,
          // If demoVideoUrl was BigBuckBunny, clear it out or leave real sources
          demoVideoUrl: movie.demoVideoUrl?.includes('BigBuckBunny') ? '' : movie.demoVideoUrl,
          sources: movie.sources && movie.sources.length > 0 
            ? movie.sources.filter(s => !s.url.includes('BigBuckBunny'))
            : (movie.trailerYoutubeId ? [
                {
                  id: `src-yt-${movie.id}`,
                  title: 'Official 4K Trailer Stream',
                  url: `https://www.youtube.com/embed/${movie.trailerYoutubeId}?autoplay=1`,
                  type: 'youtube',
                  quality: '4K',
                  isDefault: true,
                  enabled: true
                }
              ] : []),
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const docRef = doc(db, COLLECTIONS.MOVIES, movie.id);
        batch.set(docRef, cleanMovie);
      });

      // Seed Homepage rails
      DEFAULT_HOMEPAGE_SECTIONS.forEach((sec) => {
        const secRef = doc(db, COLLECTIONS.HOMEPAGE, sec.id);
        batch.set(secRef, sec);
      });

      // Seed Global Settings
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'global_config');
      batch.set(settingsRef, DEFAULT_SITE_SETTINGS);

      await batch.commit();
      console.log('[CINEXUS Firestore] Master catalog initialized successfully.');
    }
  } catch (error) {
    console.warn('[CINEXUS Firestore] Initialization note (rules or offline):', error);
  }
}

// ==========================================
// 2. MOVIES CRUD
// ==========================================

export async function getMoviesFromFirestore(): Promise<MovieItem[]> {
  try {
    const moviesRef = collection(db, COLLECTIONS.MOVIES);
    const snap = await getDocs(moviesRef);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MovieItem));
    }
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error fetching movies:', e);
  }
  return MOVIES_DATABASE;
}

export async function getMovieByIdFromFirestore(id: string): Promise<MovieItem | null> {
  try {
    const docRef = doc(db, COLLECTIONS.MOVIES, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as MovieItem;
    }
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error fetching movie by ID:', e);
  }
  return MOVIES_DATABASE.find(m => m.id === id || m.slug === id) || null;
}

export async function saveMovieToFirestore(movie: MovieItem): Promise<void> {
  const docRef = doc(db, COLLECTIONS.MOVIES, movie.id);
  const data = {
    ...movie,
    updatedAt: new Date().toISOString(),
    createdAt: movie.createdAt || new Date().toISOString()
  };
  await setDoc(docRef, data, { merge: true });
}

export async function deleteMovieFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.MOVIES, id);
  await deleteDoc(docRef);
}

// ==========================================
// 3. TV SERIES & EPISODES CRUD
// ==========================================

export async function getSeriesFromFirestore(): Promise<MovieItem[]> {
  try {
    const seriesRef = collection(db, COLLECTIONS.SERIES);
    const snap = await getDocs(seriesRef);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MovieItem));
    }
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error fetching series:', e);
  }
  return MOVIES_DATABASE.filter(m => m.mediaType === 'tv' || m.mediaType === 'anime');
}

export async function saveSeriesToFirestore(series: MovieItem): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SERIES, series.id);
  const data = {
    ...series,
    mediaType: series.mediaType || 'tv',
    updatedAt: new Date().toISOString(),
    createdAt: series.createdAt || new Date().toISOString()
  };
  await setDoc(docRef, data, { merge: true });
}

export async function deleteSeriesFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SERIES, id);
  await deleteDoc(docRef);
}

export async function getEpisodesForSeries(seriesId: string): Promise<EpisodeItem[]> {
  try {
    const epRef = collection(db, COLLECTIONS.EPISODES);
    const q = query(epRef, where('seriesId', '==', seriesId), orderBy('seasonNumber', 'asc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as EpisodeItem));
    }
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error fetching episodes:', e);
  }
  return [];
}

export async function saveEpisodeToFirestore(seriesId: string, episode: EpisodeItem): Promise<void> {
  const epId = episode.id || `ep-${seriesId}-s${episode.seasonNumber || 1}-e${episode.episodeNumber || 1}`;
  const docRef = doc(db, COLLECTIONS.EPISODES, epId);
  const data = {
    ...episode,
    id: epId,
    seriesId,
    updatedAt: new Date().toISOString(),
    createdAt: episode.airDate || new Date().toISOString()
  };
  await setDoc(docRef, data, { merge: true });
}

export async function deleteEpisodeFromFirestore(episodeId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.EPISODES, episodeId);
  await deleteDoc(docRef);
}

// ==========================================
// 4. HOMEPAGE CMS
// ==========================================

export async function getHomepageSectionsFromFirestore(): Promise<HomepageSectionConfig[]> {
  try {
    const secRef = collection(db, COLLECTIONS.HOMEPAGE);
    const snap = await getDocs(secRef);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HomepageSectionConfig));
      return list.sort((a, b) => a.order - b.order);
    }
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error fetching sections:', e);
  }
  return DEFAULT_HOMEPAGE_SECTIONS;
}

export async function saveHomepageSectionsToFirestore(sections: HomepageSectionConfig[]): Promise<void> {
  const batch = writeBatch(db);
  sections.forEach((sec, idx) => {
    const docRef = doc(db, COLLECTIONS.HOMEPAGE, sec.id);
    batch.set(docRef, { ...sec, order: idx + 1 });
  });
  await batch.commit();
}

// ==========================================
// 5. SITE SETTINGS CMS
// ==========================================

export async function getSiteSettingsFromFirestore(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'global_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SiteSettings;
    }
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error fetching settings:', e);
  }
  return DEFAULT_SITE_SETTINGS;
}

export async function saveSiteSettingsToFirestore(settings: SiteSettings): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'global_config');
  await setDoc(docRef, settings, { merge: true });
}

// ==========================================
// 6. AUDIT LOGGING
// ==========================================

export async function logAdminAction(action: string, entity: string, entityId: string, details?: string, email?: string): Promise<void> {
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(db, COLLECTIONS.AUDIT, logId);
    const logData: AuditLog = {
      id: logId,
      adminEmail: email || 'kushanashvika216@gmail.com',
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
      details: details || ''
    };
    await setDoc(logRef, logData);
  } catch (e) {
    console.warn('[CINEXUS Firestore] Audit log error:', e);
  }
}

export async function getAuditLogsFromFirestore(): Promise<AuditLog[]> {
  try {
    const auditRef = collection(db, COLLECTIONS.AUDIT);
    const q = query(auditRef, orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as AuditLog);
    }
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error fetching audit logs:', e);
  }
  return [];
}

// ==========================================
// 7. USER WATCHLIST & HISTORY PERSISTENCE
// ==========================================

export async function getUserWatchlistFromFirestore(userId: string): Promise<string[]> {
  try {
    const docRef = doc(db, COLLECTIONS.WATCHLISTS, userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data()?.items || [];
    }
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error fetching watchlist:', e);
  }
  const local = localStorage.getItem(`cinexus_watchlist_${userId}`);
  return local ? JSON.parse(local) : [];
}

export async function toggleUserWatchlistInFirestore(userId: string, contentId: string): Promise<string[]> {
  const current = await getUserWatchlistFromFirestore(userId);
  const updated = current.includes(contentId)
    ? current.filter(id => id !== contentId)
    : [...current, contentId];

  try {
    const docRef = doc(db, COLLECTIONS.WATCHLISTS, userId);
    await setDoc(docRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error saving watchlist:', e);
  }

  localStorage.setItem(`cinexus_watchlist_${userId}`, JSON.stringify(updated));
  return updated;
}

export async function getUserWatchHistoryFromFirestore(userId: string): Promise<Record<string, WatchProgress>> {
  try {
    const docRef = doc(db, COLLECTIONS.HISTORY, userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data()?.progress || {};
    }
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error fetching history:', e);
  }
  const local = localStorage.getItem(`cinexus_history_${userId}`);
  return local ? JSON.parse(local) : {};
}

export async function saveUserWatchProgressToFirestore(userId: string, progress: WatchProgress): Promise<void> {
  const key = progress.movieId || progress.contentId || 'unknown';
  const history = await getUserWatchHistoryFromFirestore(userId);
  history[key] = {
    ...progress,
    lastWatchedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, COLLECTIONS.HISTORY, userId);
    await setDoc(docRef, { progress: history, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('[CINEXUS Firestore] Error saving history:', e);
  }

  localStorage.setItem(`cinexus_history_${userId}`, JSON.stringify(history));
}

// ==========================================
// 8. REALTIME SUBSCRIBERS
// ==========================================

export function subscribeToMovies(callback: (movies: MovieItem[]) => void): () => void {
  const moviesRef = collection(db, COLLECTIONS.MOVIES);
  return onSnapshot(moviesRef, (snap) => {
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MovieItem));
      callback(list);
    }
  }, (err) => {
    console.warn('[CINEXUS Firestore] Realtime movies error:', err);
  });
}

export function subscribeToSettings(callback: (settings: SiteSettings) => void): () => void {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'global_config');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SiteSettings);
    }
  }, (err) => {
    console.warn('[CINEXUS Firestore] Realtime settings error:', err);
  });
}
