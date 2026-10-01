import { MovieItem, EpisodeItem, SeasonItem, VideoSource } from '../types';

const API_BASE = '/api';

// Format TMDB API response into a typed MovieItem
export function formatTMDBItem(tmdb: any, defaultMediaType: 'movie' | 'tv' = 'movie'): MovieItem {
  const isMovie = (tmdb.media_type || defaultMediaType) === 'movie';
  const title = isMovie ? (tmdb.title || tmdb.original_title) : (tmdb.name || tmdb.original_name);
  const releaseDate = isMovie ? tmdb.release_date : tmdb.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
  
  // Find official trailer if available
  const trailer = tmdb.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') 
    || tmdb.videos?.results?.find((v: any) => v.site === 'YouTube');

  const sources: VideoSource[] = [];
  if (trailer?.key) {
    sources.push({
      id: `src-yt-${tmdb.id}`,
      title: 'Official 4K Trailer Feed',
      url: `https://www.youtube.com/embed/${trailer.key}?autoplay=1`,
      type: 'youtube',
      quality: '4K',
      isDefault: true,
      enabled: true
    });
  }

  return {
    id: String(tmdb.id),
    tmdbId: Number(tmdb.id),
    title: title || 'Untitled Cinema',
    originalTitle: isMovie ? tmdb.original_title : tmdb.original_name,
    tagline: tmdb.tagline || (isMovie ? 'Ultra 4K Master Cinema' : 'Stream all episodes in High Definition'),
    overview: tmdb.overview || 'Detailed synopsis and streaming available on CINEXUS.',
    mediaType: isMovie ? 'movie' : 'tv',
    posterPath: tmdb.poster_path ? `https://image.tmdb.org/t/p/w780${tmdb.poster_path}` : null,
    backdropPath: tmdb.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdb.backdrop_path}` : (tmdb.poster_path ? `https://image.tmdb.org/t/p/original${tmdb.poster_path}` : null),
    releaseDate: releaseDate || '2024-01-01',
    releaseYear,
    runtime: isMovie ? (typeof tmdb.runtime === 'number' ? `${Math.floor(tmdb.runtime / 60)}h ${tmdb.runtime % 60}m` : tmdb.runtime) : undefined,
    genres: tmdb.genres ? tmdb.genres.map((g: any) => g.name) : (tmdb.genre_ids ? [] : ['Cinema']),
    rating: tmdb.vote_average ? Number(tmdb.vote_average.toFixed(1)) : 8.0,
    votesCount: tmdb.vote_count ? `${tmdb.vote_count}` : undefined,
    contentRating: tmdb.adult ? 'NC-17' : (isMovie ? 'PG-13' : 'TV-MA'),
    quality: (tmdb.vote_average || 8.0) > 8.0 ? '4K Ultra HD' : '1080p FHD',
    hasDolbyAtmos: true,
    hasDolbyVision: true,
    hasHDR10Plus: true,
    trailerYoutubeId: trailer?.key || '',
    director: tmdb.credits?.crew?.find((c: any) => c.job === 'Director')?.name || tmdb.created_by?.[0]?.name || 'Studio Productions',
    writers: tmdb.credits?.crew?.filter((c: any) => ['Writer', 'Screenplay', 'Novel'].includes(c.job)).map((c: any) => c.name),
    productionCompanies: tmdb.production_companies ? tmdb.production_companies.map((c: any) => c.name) : undefined,
    cast: tmdb.credits?.cast ? tmdb.credits.cast.slice(0, 12).map((c: any) => ({
      id: c.id,
      name: c.name,
      role: c.character,
      character: c.character,
      profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      avatarUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined,
      order: c.order
    })) : [],
    sources,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const api = {
  // Generic search returning items and total
  async search(query: string, type: 'multi' | 'movie' | 'tv' = 'multi', page: number = 1): Promise<{ items: MovieItem[]; total: number }> {
    const items = await this.searchTMDB(query, type, page);
    return { items, total: items.length };
  },

  // Search TMDB titles through secure backend proxy
  async searchTMDB(query: string, type: 'multi' | 'movie' | 'tv' = 'multi', page: number = 1): Promise<MovieItem[]> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      return (data.results || [])
        .filter((item: any) => item.poster_path || item.backdrop_path)
        .map((item: any) => formatTMDBItem(item, type === 'tv' ? 'tv' : 'movie'));
    } catch (e) {
      console.warn('[CINEXUS TMDB] Search error:', e);
      return [];
    }
  },

  // Get full movie details from TMDB
  async getTMDBMovie(id: string | number): Promise<MovieItem | null> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/movie/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return formatTMDBItem(data, 'movie');
    } catch (e) {
      console.warn('[CINEXUS TMDB] Movie fetch error:', e);
      return null;
    }
  },

  // Get full TV series details from TMDB
  async getTMDBSeries(id: string | number): Promise<MovieItem | null> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/tv/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return formatTMDBItem(data, 'tv');
    } catch (e) {
      console.warn('[CINEXUS TMDB] TV fetch error:', e);
      return null;
    }
  },

  // Get TV Season with episodes from TMDB
  async getTMDBSeason(tvId: string | number, seasonNumber: number): Promise<EpisodeItem[]> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/tv/${tvId}/season/${seasonNumber}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.episodes || []).map((ep: any) => ({
        id: `ep-${tvId}-s${seasonNumber}-e${ep.episode_number}`,
        episodeNumber: ep.episode_number,
        seasonNumber,
        title: ep.name || `Episode ${ep.episode_number}`,
        overview: ep.overview,
        stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
        thumbnailUrl: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : undefined,
        runtime: ep.runtime ? `${ep.runtime}m` : '45m',
        airDate: ep.air_date,
        sources: []
      }));
    } catch (e) {
      console.warn('[CINEXUS TMDB] Season fetch error:', e);
      return [];
    }
  },

  // Trending
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<MovieItem[]> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/trending/${mediaType}/${timeWindow}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map((item: any) => formatTMDBItem(item, item.media_type || 'movie'));
    } catch (e) {
      console.warn('[CINEXUS TMDB] Trending fetch error:', e);
      return [];
    }
  },

  // Popular
  async getPopular(mediaType: 'movie' | 'tv' = 'movie'): Promise<MovieItem[]> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/popular/${mediaType}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map((item: any) => formatTMDBItem(item, mediaType));
    } catch (e) {
      console.warn('[CINEXUS TMDB] Popular fetch error:', e);
      return [];
    }
  }
};
