import { MovieItem, SeriesItem, EpisodeItem } from '../types';

const API_BASE = '/api';
const DIRECT_TMDB_BASE = 'https://api.themoviedb.org/3';
const FALLBACK_TMDB_KEY = '8265bd1679663a7ea12ac168da84d2e8';

function getApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_TMDB_API_KEY || (import.meta as any).env?.NEXT_PUBLIC_TMDB_API_KEY;
  return envKey || FALLBACK_TMDB_KEY;
}

/**
 * Universal fetch that routes to /api/tmdb/* proxy first,
 * and falls back directly to TMDb v3 API if proxy is unavailable.
 */
async function fetchTMDbData(apiPath: string, directEndpoint: string, queryParams: Record<string, any> = {}): Promise<any> {
  // 1. Try local proxy
  try {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}${apiPath}${queryString}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fall back to direct TMDb request
  }

  // 2. Direct fallback to official TMDb API
  const directUrl = new URL(`${DIRECT_TMDB_BASE}${directEndpoint}`);
  directUrl.searchParams.set('api_key', getApiKey());
  directUrl.searchParams.set('language', 'en-US');
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') directUrl.searchParams.set(k, String(v));
  });

  const directRes = await fetch(directUrl.toString());
  if (!directRes.ok) {
    const errText = await directRes.text();
    throw new Error(`TMDb Request Failed (${directRes.status}): ${errText}`);
  }
  return await directRes.json();
}

export function formatTMDBMovie(item: any): MovieItem {
  const releaseDate = item.release_date || '';
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
  const runtime = typeof item.runtime === 'number' ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : undefined;
  
  const trailer = item.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') 
    || item.videos?.results?.find((v: any) => v.site === 'YouTube');

  const genres = Array.isArray(item.genres) 
    ? item.genres.map((g: any) => (typeof g === 'string' ? g : g.name)) 
    : [];

  const director = item.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'Studio Production';
  const writers = item.credits?.crew?.filter((c: any) => ['Writer', 'Screenplay', 'Story'].includes(c.job)).map((c: any) => c.name);

  return {
    id: `tmdb_${item.id}`,
    slug: (item.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    tmdbId: item.id,
    imdbId: item.imdb_id || undefined,
    title: item.title || item.original_title || 'Untitled',
    originalTitle: item.original_title,
    tagline: item.tagline || '',
    overview: item.overview || 'Detailed synopsis available on CINEXUS.',
    mediaType: 'movie',
    posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
    backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
    releaseDate,
    releaseYear,
    runtime,
    duration: runtime,
    genres: genres.length > 0 ? genres : ['Action', 'Drama'],
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 8.0,
    voteCount: item.vote_count,
    contentRating: item.adult ? 'NC-17' : 'PG-13',
    quality: (item.vote_average || 8.0) >= 8.0 ? '4K Ultra HD' : '1080p FHD',
    hasDolbyAtmos: true,
    hasDolbyVision: true,
    hasHDR10Plus: true,
    trailerYoutubeId: trailer?.key || '',
    director: director || '',
    writers: writers || '',
    cast: item.credits?.cast?.slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      role: c.character,
      character: c.character,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      order: c.order
    })) || [],
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function formatTMDBSeries(item: any): SeriesItem {
  const releaseDate = item.first_air_date || '';
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
  const trailer = item.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') 
    || item.videos?.results?.find((v: any) => v.site === 'YouTube');

  const genres = Array.isArray(item.genres) 
    ? item.genres.map((g: any) => (typeof g === 'string' ? g : g.name)) 
    : [];

  return {
    id: `tmdb_tv_${item.id}`,
    slug: (item.name || 'untitled-series').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    tmdbId: item.id,
    title: item.name || item.original_name || 'Untitled Series',
    originalTitle: item.original_name,
    tagline: item.tagline || '',
    overview: item.overview || 'Detailed episodic information available on CINEXUS.',
    mediaType: item.genres?.some((g: any) => g.name === 'Animation') ? 'anime' : 'tv',
    posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
    backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
    releaseDate,
    releaseYear,
    genres: genres.length > 0 ? genres : ['Drama'],
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 8.2,
    voteCount: item.vote_count,
    contentRating: 'TV-MA',
    quality: '4K Ultra HD',
    seasonsCount: item.number_of_seasons || 1,
    episodesCount: item.number_of_episodes || 0,
    hasDolbyAtmos: true,
    hasDolbyVision: true,
    trailerYoutubeId: trailer?.key || '',
    cast: item.credits?.cast?.slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      role: c.character,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
    })) || [],
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const tmdbService = {
  /**
   * Search multi or movies
   */
  async search(query: string, type: 'multi' | 'movie' | 'tv' = 'multi', page: number = 1): Promise<MovieItem[]> {
    try {
      const endpoint = type === 'movie' ? '/search/movie' : type === 'tv' ? '/search/tv' : '/search/multi';
      const data = await fetchTMDbData('/tmdb/search', endpoint, {
        q: query,
        query,
        type,
        page
      });
      return (data.results || [])
        .filter((item: any) => item.poster_path || item.backdrop_path)
        .map((item: any) => {
          const isMovie = (item.media_type || type) === 'movie';
          return isMovie ? formatTMDBMovie(item) : (formatTMDBSeries(item) as any);
        });
    } catch (e) {
      console.warn('[TMDB Service] Search error:', e);
      return [];
    }
  },

  /**
   * Fetch single movie details with credits & videos
   */
  async getMovieDetails(id: string | number): Promise<MovieItem | null> {
    try {
      const data = await fetchTMDbData(
        `/tmdb/movie/${id}`,
        `/movie/${id}`,
        { append_to_response: 'credits,videos,similar,recommendations,release_dates' }
      );
      return formatTMDBMovie(data);
    } catch (e) {
      console.warn('[TMDB Service] Movie details fetch error:', e);
      return null;
    }
  },

  /**
   * Fetch single TV series details
   */
  async getSeriesDetails(id: string | number): Promise<SeriesItem | null> {
    try {
      const data = await fetchTMDbData(
        `/tmdb/tv/${id}`,
        `/tv/${id}`,
        { append_to_response: 'credits,videos,similar,recommendations,content_ratings' }
      );
      return formatTMDBSeries(data);
    } catch (e) {
      console.warn('[TMDB Service] Series details fetch error:', e);
      return null;
    }
  },

  /**
   * Auto-detect input:
   * 1. If numeric string (e.g. "550" or "27205"): fetch movie by TMDb ID.
   * 2. If IMDb ID (starts with "tt"): fetch via TMDb find external source.
   * 3. If string title: search movies and fetch full details of best match.
   */
  async autoDetectAndFetch(input: string): Promise<MovieItem | null> {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Case 1: Pure numeric TMDb ID
    if (/^\d+$/.test(trimmed)) {
      return await this.getMovieDetails(trimmed);
    }

    // Case 2: IMDb ID (tt followed by numbers)
    if (/^tt\d+$/i.test(trimmed)) {
      try {
        const findData = await fetchTMDbData(
          `/tmdb/find/${trimmed}`,
          `/find/${trimmed}`,
          { external_source: 'imdb_id' }
        );
        const match = findData.movie_results?.[0];
        if (match?.id) {
          return await this.getMovieDetails(match.id);
        }
      } catch (err) {
        console.warn('[TMDB AutoDetect] IMDb lookup failed, trying text search:', err);
      }
    }

    // Case 3: Title string search
    const results = await this.search(trimmed, 'movie', 1);
    if (results.length > 0 && results[0].tmdbId) {
      return await this.getMovieDetails(results[0].tmdbId);
    }
    return results[0] || null;
  },

  /**
   * Fetch multiple batches from TMDb for bulk import
   */
  async fetchBatchMovies(
    category: 'popular' | 'top_rated' | 'trending' | 'now_playing' = 'popular',
    targetCount: number = 20,
    onProgress?: (fetched: number, total: number) => void
  ): Promise<MovieItem[]> {
    const movies: MovieItem[] = [];
    const itemsPerPage = 20;
    const pagesNeeded = Math.ceil(targetCount / itemsPerPage);

    for (let page = 1; page <= pagesNeeded; page++) {
      try {
        let endpoint = `/movie/${category}`;
        if (category === 'trending') {
          endpoint = '/trending/movie/week';
        }
        const data = await fetchTMDbData(
          `/tmdb/${category === 'trending' ? 'trending/movie/week' : `popular/movie`}`,
          endpoint,
          { page }
        );

        const results = (data.results || [])
          .filter((item: any) => item.poster_path || item.backdrop_path)
          .map(formatTMDBMovie);

        for (const movie of results) {
          if (movies.length >= targetCount) break;
          movies.push(movie);
        }

        if (onProgress) {
          onProgress(movies.length, targetCount);
        }

        if (movies.length >= targetCount || !data.results?.length) break;
      } catch (err) {
        console.error(`[TMDB Batch] Failed on page ${page}:`, err);
        break;
      }
    }

    return movies;
  },

  /**
   * Parse CSV or JSON text for bulk import
   */
  parseBulkText(content: string): MovieItem[] {
    const trimmed = content.trim();
    if (!trimmed) return [];

    // Try parsing as JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        return list.map((item: any, idx: number) => ({
          id: item.id || `bulk_${Date.now()}_${idx}`,
          title: item.title || item.name || 'Untitled',
          slug: (item.title || item.name || `movie-${idx}`).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          overview: item.overview || item.description || '',
          releaseYear: Number(item.releaseYear || item.year) || new Date().getFullYear(),
          genres: Array.isArray(item.genres) 
            ? item.genres 
            : typeof item.genres === 'string' 
              ? item.genres.split(',').map((g: string) => g.trim()) 
              : ['Action'],
          rating: Number(item.rating) || 8.0,
          quality: item.quality || '4K Ultra HD',
          contentRating: item.contentRating || 'PG-13',
          posterPath: item.posterPath || item.poster || null,
          backdropPath: item.backdropPath || item.backdrop || null,
          runtime: item.runtime || item.duration || '2h',
          duration: item.duration || item.runtime || '2h',
          director: item.director || '',
          mediaType: 'movie' as const,
          isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : true,
          sources: Array.isArray(item.sources) ? item.sources : (item.videoUrl ? [{
            id: `src_${Date.now()}_${idx}`,
            title: 'Master Direct Stream',
            url: item.videoUrl,
            type: 'mp4',
            quality: '4K Ultra HD',
            enabled: true
          }] : [])
        }));
      } catch (err) {
        console.warn('[parseBulkText] JSON parse error, falling back to CSV parser:', err);
      }
    }

    // CSV Parse
    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const movies: MovieItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Split with quotes handling
      const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const item: any = {};
      headers.forEach((h, idx) => {
        item[h] = row[idx]?.replace(/^["']|["']$/g, '').trim();
      });

      if (item.title) {
        movies.push({
          id: `bulk_csv_${Date.now()}_${i}`,
          title: item.title,
          slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          overview: item.overview || item.description || '',
          releaseYear: parseInt(item.year || item.releaseyear, 10) || new Date().getFullYear(),
          genres: item.genres ? item.genres.split(';').map((g: string) => g.trim()) : ['Cinema'],
          rating: parseFloat(item.rating) || 8.0,
          quality: item.quality || '4K Ultra HD',
          contentRating: item.contentrating || 'PG-13',
          posterPath: item.poster || item.posterpath || null,
          backdropPath: item.backdrop || item.backdroppath || null,
          runtime: item.runtime || '2h',
          director: item.director || '',
          mediaType: 'movie',
          isPublished: true,
          sources: item.videourl || item.url ? [{
            id: `src_csv_${Date.now()}_${i}`,
            title: 'Primary Feed',
            url: item.videourl || item.url,
            type: (item.videourl || item.url).includes('.m3u8') ? 'hls' : 'mp4',
            quality: '4K Ultra HD',
            enabled: true
          }] : []
        });
      }
    }

    return movies;
  },

  async getSeasonEpisodes(tvId: string | number, seasonNumber: number): Promise<EpisodeItem[]> {
    try {
      const data = await fetchTMDbData(
        `/tmdb/tv/${tvId}/season/${seasonNumber}`,
        `/tv/${tvId}/season/${seasonNumber}`,
        {}
      );
      return (data.episodes || []).map((ep: any) => ({
        id: `ep_${tvId}_s${seasonNumber}_e${ep.episode_number}`,
        seriesId: String(tvId),
        seasonNumber: ep.season_number,
        episodeNumber: ep.episode_number,
        title: ep.name || `Episode ${ep.episode_number}`,
        overview: ep.overview || '',
        stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w780${ep.still_path}` : null,
        runtime: ep.runtime ? `${ep.runtime}m` : undefined,
        airDate: ep.air_date,
        isPublished: true
      }));
    } catch (e) {
      console.warn('[TMDB Service] Season episodes fetch error:', e);
      return [];
    }
  }
};
