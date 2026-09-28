import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || '8265bd1679663a7ea12ac168da84d2e8';
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to make authenticated TMDB requests securely server-side
async function fetchFromTMDB(endpoint: string, queryParams: Record<string, any> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  
  if (TMDB_API_KEY) {
    url.searchParams.set('api_key', TMDB_API_KEY);
  }
  url.searchParams.set('language', 'en-US');

  Object.entries(queryParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, String(val));
    }
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json;charset=utf-8'
  };

  if (TMDB_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${TMDB_ACCESS_TOKEN}`;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TMDB API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ==========================================
// TMDB PROXY API ROUTES (SECURE & PROTECTED)
// ==========================================

// Trending Content
app.get('/api/tmdb/trending/:mediaType/:timeWindow', async (req: Request, res: Response) => {
  try {
    const { mediaType = 'all', timeWindow = 'week' } = req.params;
    const page = req.query.page || 1;
    const data = await fetchFromTMDB(`/trending/${mediaType}/${timeWindow}`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch trending titles' });
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
    res.status(500).json({ error: err.message || 'Failed to fetch popular titles' });
  }
});

// Search TMDB Multi (Movies & TV Series)
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  try {
    const { q, type = 'multi', page = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query parameter (q) is required' });
    }

    const endpoint = type === 'movie' ? '/search/movie' : type === 'tv' ? '/search/tv' : '/search/multi';
    const data = await fetchFromTMDB(endpoint, { query: q, page, include_adult: false });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search execution failed' });
  }
});

// Movie Details with Credits, Videos & Similar
app.get('/api/tmdb/movie/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}`, {
      append_to_response: 'credits,videos,similar,recommendations,release_dates'
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch movie details' });
  }
});

// TV Series Details with Credits, Videos, Seasons
app.get('/api/tmdb/tv/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}`, {
      append_to_response: 'credits,videos,similar,recommendations,content_ratings'
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch TV details' });
  }
});

// TV Season Details with Episodes
app.get('/api/tmdb/tv/:id/season/:seasonNumber', async (req: Request, res: Response) => {
  try {
    const { id, seasonNumber } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch season details' });
  }
});

// Genres
app.get('/api/tmdb/genres/:mediaType', async (req: Request, res: Response) => {
  try {
    const { mediaType = 'movie' } = req.params;
    const data = await fetchFromTMDB(`/genre/${mediaType}/list`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch genre taxonomy' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    platform: 'CINEXUS',
    engine: 'Firestore-Native',
    time: new Date().toISOString()
  });
});

// ==========================================
// VITE MIDDLEWARE & STATIC APP SERVING
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

startServer();
