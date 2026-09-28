import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  MovieItem,
  SeriesItem,
  EpisodeItem,
  HomepageSectionConfig,
  SiteSettings,
  ThemeConfig,
  WatchProgress,
  AuditLog,
  UserReview,
  UserProfile
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const COLLECTIONS = {
  MOVIES: 'movies',
  SERIES: 'series',
  EPISODES: 'episodes',
  HOMEPAGE: 'homepageSections',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'auditLogs',
  USERS: 'users',
  WATCH_HISTORY: 'watchHistory',
  REVIEWS: 'reviews',
  ADMINS: 'admins',
  SYSTEM: 'system',
  THEMES: 'themes',
  SUBTITLES: 'subtitles'
};

export const DEFAULT_THEME: ThemeConfig = {
  id: 'theme-default',
  name: 'Cinexus Obsidian Red',
  primaryAccent: '#e50914',
  secondaryAccent: '#ff2a3b',
  backgroundColor: '#07090e',
  surfaceColor: '#0f141f',
  textColor: '#f8fafc',
  textMutedColor: '#94a3b8',
  borderRadius: 'lg',
  motionIntensity: 'standard',
  mode: 'dark'
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'CINEXUS',
  siteTagline: 'STREAM. WATCH. EXPERIENCE.',
  siteDescription: 'Next-generation ultra cinema platform with master 4K streaming feeds.',
  logoUrl: 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/file_00000000a72882119fa9566af8cf7b28.png',
  faviconUrl: 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/file_00000000a72882119fa9566af8cf7b28.png',
  watermarkEnabled: true,
  watermarkOpacity: 0.7,
  watermarkPosition: 'top-right',
  watermarkMoving: false,
  maintenanceMode: false,
  defaultQuality: '4K',
  allowUserRegistrations: true,
  theme: DEFAULT_THEME
};

// ==========================================
// 1. MOVIES (REALTIME & CRUD)
// ==========================================

export function subscribeMovies(callback: (movies: MovieItem[]) => void) {
  const colRef = collection(db, COLLECTIONS.MOVIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MovieItem));
      callback(items);
    },
    (err) => {
      console.warn('[Firestore] subscribeMovies error:', err);
    }
  );
}

export async function getMovies(): Promise<MovieItem[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.MOVIES));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MovieItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.MOVIES);
    return [];
  }
}

export async function getMovieBySlugOrId(identifier: string): Promise<MovieItem | null> {
  try {
    // 1. Check direct doc ID
    const docRef = doc(db, COLLECTIONS.MOVIES, identifier);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as MovieItem;
    }
    // 2. Query by slug
    const q = query(collection(db, COLLECTIONS.MOVIES), where('slug', '==', identifier), limit(1));
    const slugSnap = await getDocs(q);
    if (!slugSnap.empty) {
      const d = slugSnap.docs[0];
      return { id: d.id, ...d.data() } as MovieItem;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.MOVIES}/${identifier}`);
    return null;
  }
}

export async function saveMovie(movie: MovieItem): Promise<void> {
  const id = movie.id || `mov_${Date.now()}`;
  const slug = movie.slug || movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const data: MovieItem = {
    ...movie,
    id,
    slug,
    isPublished: movie.isPublished !== undefined ? movie.isPublished : true,
    updatedAt: new Date().toISOString(),
    createdAt: movie.createdAt || new Date().toISOString()
  };

  try {
    await setDoc(doc(db, COLLECTIONS.MOVIES, id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.MOVIES}/${id}`);
  }
}

export async function deleteMovie(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.MOVIES, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.MOVIES}/${id}`);
  }
}

export async function bulkDeleteMovies(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.MOVIES, id));
  });
  await batch.commit();
}

export async function bulkSaveMovies(
  movies: MovieItem[],
  onProgress?: (processed: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const CHUNK_SIZE = 400; // Respect Firestore 500 operations batch limit
  let success = 0;
  let failed = 0;

  for (let i = 0; i < movies.length; i += CHUNK_SIZE) {
    const chunk = movies.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((movie) => {
      const id = movie.id || `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const slug = movie.slug || (movie.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const ref = doc(db, COLLECTIONS.MOVIES, id);
      batch.set(
        ref,
        {
          ...movie,
          id,
          slug,
          mediaType: 'movie',
          isPublished: movie.isPublished !== undefined ? movie.isPublished : true,
          updatedAt: new Date().toISOString(),
          createdAt: movie.createdAt || new Date().toISOString()
        },
        { merge: true }
      );
    });

    try {
      await batch.commit();
      success += chunk.length;
    } catch (err) {
      console.error('[bulkSaveMovies] Batch commit error:', err);
      failed += chunk.length;
    }

    if (onProgress) {
      onProgress(Math.min(i + chunk.length, movies.length), movies.length);
    }
  }

  return { success, failed };
}

// ==========================================
// 2. TV & ANIME SERIES (REALTIME & CRUD)
// ==========================================

export function subscribeSeries(callback: (series: SeriesItem[]) => void) {
  const colRef = collection(db, COLLECTIONS.SERIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SeriesItem));
      callback(items);
    },
    (err) => {
      console.warn('[Firestore] subscribeSeries error:', err);
    }
  );
}

export async function getSeries(): Promise<SeriesItem[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.SERIES));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SeriesItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.SERIES);
    return [];
  }
}

export async function getSeriesBySlugOrId(identifier: string): Promise<SeriesItem | null> {
  try {
    const docRef = doc(db, COLLECTIONS.SERIES, identifier);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as SeriesItem;
    }
    const q = query(collection(db, COLLECTIONS.SERIES), where('slug', '==', identifier), limit(1));
    const slugSnap = await getDocs(q);
    if (!slugSnap.empty) {
      const d = slugSnap.docs[0];
      return { id: d.id, ...d.data() } as SeriesItem;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.SERIES}/${identifier}`);
    return null;
  }
}

export async function saveSeries(series: SeriesItem): Promise<void> {
  const id = series.id || `tv_${Date.now()}`;
  const slug = series.slug || series.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const data: SeriesItem = {
    ...series,
    id,
    slug,
    mediaType: series.mediaType || 'tv',
    isPublished: series.isPublished !== undefined ? series.isPublished : true,
    updatedAt: new Date().toISOString(),
    createdAt: series.createdAt || new Date().toISOString()
  };

  try {
    await setDoc(doc(db, COLLECTIONS.SERIES, id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SERIES}/${id}`);
  }
}

export async function deleteSeries(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SERIES, id));
    // Also delete any associated episodes
    const epsQuery = query(collection(db, COLLECTIONS.EPISODES), where('seriesId', '==', id));
    const epsSnap = await getDocs(epsQuery);
    const batch = writeBatch(db);
    epsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.SERIES}/${id}`);
  }
}

// ==========================================
// 3. EPISODES (CRUD)
// ==========================================

export async function getEpisodesBySeries(seriesId: string, seasonNumber?: number): Promise<EpisodeItem[]> {
  try {
    let q = query(collection(db, COLLECTIONS.EPISODES), where('seriesId', '==', seriesId));
    if (seasonNumber !== undefined) {
      q = query(collection(db, COLLECTIONS.EPISODES), where('seriesId', '==', seriesId), where('seasonNumber', '==', seasonNumber));
    }
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EpisodeItem));
    return items.sort((a, b) => a.episodeNumber - b.episodeNumber);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${COLLECTIONS.EPISODES}?seriesId=${seriesId}`);
    return [];
  }
}

export async function saveEpisode(episode: EpisodeItem): Promise<void> {
  const id = episode.id || `ep_${Date.now()}`;
  const data: EpisodeItem = {
    ...episode,
    id,
    isPublished: episode.isPublished !== undefined ? episode.isPublished : true,
    updatedAt: new Date().toISOString(),
    createdAt: episode.createdAt || new Date().toISOString()
  };

  try {
    await setDoc(doc(db, COLLECTIONS.EPISODES, id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.EPISODES}/${id}`);
  }
}

export async function deleteEpisode(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.EPISODES, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.EPISODES}/${id}`);
  }
}

// ==========================================
// 4. HOMEPAGE RAILS CMS
// ==========================================

export function subscribeHomepageSections(callback: (sections: HomepageSectionConfig[]) => void) {
  const colRef = collection(db, COLLECTIONS.HOMEPAGE);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as HomepageSectionConfig));
      callback(items.sort((a, b) => a.order - b.order));
    },
    (err) => {
      console.warn('[Firestore] subscribeHomepageSections error:', err);
    }
  );
}

export async function getHomepageSections(): Promise<HomepageSectionConfig[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.HOMEPAGE));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as HomepageSectionConfig));
    return items.sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.HOMEPAGE);
    return [];
  }
}

export async function saveHomepageSection(section: HomepageSectionConfig): Promise<void> {
  const id = section.id || `sec_${Date.now()}`;
  try {
    await setDoc(doc(db, COLLECTIONS.HOMEPAGE, id), { ...section, id }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.HOMEPAGE}/${id}`);
  }
}

export async function deleteHomepageSection(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.HOMEPAGE, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.HOMEPAGE}/${id}`);
  }
}

// ==========================================
// 5. SITE SETTINGS
// ==========================================

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'global_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SITE_SETTINGS, ...snap.data() } as SiteSettings;
    }
    return DEFAULT_SITE_SETTINGS;
  } catch (error) {
    console.warn('[Firestore] getSiteSettings default fallback:', error);
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'global_config'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SETTINGS}/global_config`);
  }
}

export function subscribeSiteSettings(callback: (settings: SiteSettings) => void) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'global_config');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_SITE_SETTINGS, ...snap.data() } as SiteSettings);
      } else {
        callback(DEFAULT_SITE_SETTINGS);
      }
    },
    (err) => {
      console.warn('[Firestore] subscribeSiteSettings warning:', err);
    }
  );
}

// ==========================================
// 6. WATCHLIST & WATCH PROGRESS
// ==========================================

export async function getUserWatchlist(userId: string): Promise<string[]> {
  try {
    const colRef = collection(db, `${COLLECTIONS.USERS}/${userId}/watchlist`);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.id);
  } catch (error) {
    return [];
  }
}

export async function addToWatchlist(userId: string, movie: MovieItem): Promise<void> {
  try {
    const docRef = doc(db, `${COLLECTIONS.USERS}/${userId}/watchlist`, movie.id);
    await setDoc(docRef, {
      id: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      mediaType: movie.mediaType,
      addedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/watchlist/${movie.id}`);
  }
}

export async function removeFromWatchlist(userId: string, movieId: string): Promise<void> {
  try {
    const docRef = doc(db, `${COLLECTIONS.USERS}/${userId}/watchlist`, movieId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/watchlist/${movieId}`);
  }
}

export async function saveWatchProgress(userId: string, progress: WatchProgress): Promise<void> {
  const contentKey = progress.episodeId ? `${progress.contentId}_${progress.episodeId}` : progress.contentId;
  try {
    const docRef = doc(db, `${COLLECTIONS.USERS}/${userId}/history`, contentKey);
    await setDoc(docRef, {
      ...progress,
      userId,
      lastWatchedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Watch progress save warning:', error);
  }
}

export async function getUserWatchProgress(userId: string): Promise<Record<string, WatchProgress>> {
  try {
    const colRef = collection(db, `${COLLECTIONS.USERS}/${userId}/history`);
    const snap = await getDocs(colRef);
    const map: Record<string, WatchProgress> = {};
    snap.docs.forEach((d) => {
      map[d.id] = d.data() as WatchProgress;
    });
    return map;
  } catch (error) {
    return {};
  }
}

// ==========================================
// 7. AUDIT LOGGING
// ==========================================

export async function logAdminAction(
  adminEmail: string,
  action: string,
  entity: string,
  entityId: string,
  details?: string
): Promise<void> {
  try {
    const logDoc: Omit<AuditLog, 'id'> = {
      adminEmail,
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
      details: details || ''
    };
    await setDoc(doc(collection(db, COLLECTIONS.AUDIT_LOGS)), logDoc);
  } catch (err) {
    console.warn('[Audit Log] Failed to write audit record:', err);
  }
}

export async function getAuditLogs(max: number = 50): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, COLLECTIONS.AUDIT_LOGS), orderBy('timestamp', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
  } catch (error) {
    return [];
  }
}

// ==========================================
// 8. REVIEWS
// ==========================================

export async function getReviews(contentId: string): Promise<UserReview[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('contentId', '==', contentId),
      where('status', '==', 'approved')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserReview));
  } catch (error) {
    return [];
  }
}

export async function addReview(review: Omit<UserReview, 'id' | 'createdAt'>): Promise<void> {
  const id = `rev_${Date.now()}`;
  try {
    await setDoc(doc(db, COLLECTIONS.REVIEWS, id), {
      ...review,
      id,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.REVIEWS}/${id}`);
  }
}

// ==========================================
// 9. ADMIN INITIALIZATION & ROLE CHECK
// ==========================================

export async function checkIsAdmin(uid: string, email: string): Promise<boolean> {
  if (email === 'kushanashvika216@gmail.com') {
    // Ensure admin document exists in admins collection
    try {
      await setDoc(doc(db, COLLECTIONS.ADMINS, uid), {
        email,
        role: 'SUPER_ADMIN',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch {}
    return true;
  }
  try {
    const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}
