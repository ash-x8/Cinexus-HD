import { MovieItem, SeriesItem, EpisodeItem } from '../types';

const API_BASE = '/api';

export function formatTMDBMovie(item: any): MovieItem {
  const releaseDate = item.release_date || '';
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
  const runtime = typeof item.runtime === 'number' ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : undefined;
  
  const trailer = item.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') 
    || item.videos?.results?.find((v: any) => v.site === 'YouTube');

  return {
    id: `tmdb_${item.id}`,
    slug: (item.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    tmdbId: item.id,
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
    genres: item.genres?.map((g: any) => g.name) || [],
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 8.0,
    voteCount: item.vote_count,
    contentRating: item.adult ? 'NC-17' : 'PG-13',
    quality: (item.vote_average || 8.0) >= 8.0 ? '4K Ultra HD' : '1080p FHD',
    hasDolbyAtmos: true,
    hasDolbyVision: true,
    hasHDR10Plus: true,
    trailerYoutubeId: trailer?.key,
    director: item.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'Studio Productions',
    writers: item.credits?.crew?.filter((c: any) => ['Writer', 'Screenplay'].includes(c.job)).map((c: any) => c.name),
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
    genres: item.genres?.map((g: any) => g.name) || [],
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 8.2,
    voteCount: item.vote_count,
    contentRating: 'TV-MA',
    quality: '4K Ultra HD',
    seasonsCount: item.number_of_seasons || 1,
    episodesCount: item.number_of_episodes || 0,
    hasDolbyAtmos: true,
    hasDolbyVision: true,
    trailerYoutubeId: trailer?.key,
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
  async search(query: string, type: 'multi' | 'movie' | 'tv' = 'multi', page: number = 1): Promise<MovieItem[]> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      return (data.results || [])
        .filter((item: any) => item.poster_path || item.backdrop_path)
        .map((item: any) => {
          const isMovie = (item.media_type || type) === 'movie';
          return isMovie ? formatTMDBMovie(item) : formatTMDBSeries(item);
        });
    } catch (e) {
      console.warn('[TMDB Service] Search error:', e);
      return [];
    }
  },

  async getMovieDetails(id: string | number): Promise<MovieItem | null> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/movie/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return formatTMDBMovie(data);
    } catch (e) {
      console.warn('[TMDB Service] Movie details fetch error:', e);
      return null;
    }
  },

  async getSeriesDetails(id: string | number): Promise<SeriesItem | null> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/tv/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return formatTMDBSeries(data);
    } catch (e) {
      console.warn('[TMDB Service] Series details fetch error:', e);
      return null;
    }
  },

  async getSeasonEpisodes(tvId: string | number, seasonNumber: number): Promise<EpisodeItem[]> {
    try {
      const res = await fetch(`${API_BASE}/tmdb/tv/${tvId}/season/${seasonNumber}`);
      if (!res.ok) return [];
      const data = await res.json();
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
