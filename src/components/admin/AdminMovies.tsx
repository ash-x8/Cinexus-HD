import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  X,
  ExternalLink,
  Film,
  Sparkles,
  Save,
  RotateCw,
  UploadCloud,
  FileText,
  Layers,
  Download,
  Database,
  AlertTriangle,
  Loader2,
  Tv,
  Star,
  Calendar,
  Clock,
  User,
  Video
} from 'lucide-react';
import { getMovies, saveMovie, deleteMovie, bulkSaveMovies, logAdminAction } from '../../services/firestore';
import { tmdbService } from '../../services/tmdb';
import { MovieItem, VideoSource, ServerEmbeds } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminMovies: React.FC = () => {
  const { user } = useAuth();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Single Movie Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Partial<MovieItem> | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'basic' | 'media' | 'sources' | 'cast'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Auto-Detect / TMDb Search in Single Editor
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);
  const [tmdbFetchSuccess, setTmdbFetchSuccess] = useState<string | null>(null);
  const [tmdbFetchError, setTmdbFetchError] = useState<string | null>(null);

  // Bulk Import Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'tmdb' | 'file'>('tmdb');
  const [tmdbCategory, setTmdbCategory] = useState<'popular' | 'top_rated' | 'trending' | 'now_playing'>('popular');
  const [tmdbCount, setTmdbCount] = useState<number>(20);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; stage: string }>({
    current: 0,
    total: 0,
    stage: ''
  });
  const [bulkFileContent, setBulkFileContent] = useState('');
  const [parsedBulkItems, setParsedBulkItems] = useState<MovieItem[]>([]);
  const [bulkResultNotice, setBulkResultNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMoviesList = async () => {
    setLoading(true);
    try {
      const data = await getMovies();
      setMovies(data.filter((m) => m.mediaType === 'movie'));
    } catch (e) {
      console.warn('Error loading movies:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoviesList();
  }, []);

  const handleOpenCreate = () => {
    setEditingMovie({
      id: `mov_${Date.now()}`,
      title: '',
      overview: '',
      mediaType: 'movie',
      releaseYear: new Date().getFullYear(),
      genres: ['Action', 'Sci-Fi'],
      quality: '4K Ultra HD',
      contentRating: 'PG-13',
      rating: 8.0,
      isPublished: true,
      sources: [],
      servers: {}
    });
    setTmdbQuery('');
    setTmdbFetchSuccess(null);
    setTmdbFetchError(null);
    setActiveEditorTab('basic');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (movie: MovieItem) => {
    setEditingMovie({ ...movie });
    setTmdbQuery(movie.tmdbId ? String(movie.tmdbId) : movie.title);
    setTmdbFetchSuccess(null);
    setTmdbFetchError(null);
    setActiveEditorTab('basic');
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await deleteMovie(id);
      await logAdminAction(user?.email || 'admin', 'DELETE_MOVIE', 'movies', id, `Deleted movie "${title}"`);
      setMovies((prev) => prev.filter((m) => m.id !== id));
      setNotice(`"${title}" deleted successfully.`);
      setTimeout(() => setNotice(null), 3500);
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  // TMDb / IMDb Auto-Detect for Single Editor
  const handleAutoDetectTmdb = async () => {
    const query = (tmdbQuery || editingMovie?.title || '').trim();
    if (!query) {
      setTmdbFetchError('Please enter a Movie Title, TMDb ID, or IMDb ID (tt...)');
      return;
    }

    setIsFetchingTmdb(true);
    setTmdbFetchError(null);
    setTmdbFetchSuccess(null);

    try {
      const fetched = await tmdbService.autoDetectAndFetch(query);
      if (!fetched) {
        setTmdbFetchError(`No matching title found for "${query}". Try entering an exact TMDb ID (e.g. 550 for Fight Club).`);
        return;
      }

      setEditingMovie((prev) => ({
        ...prev,
        ...fetched,
        id: prev?.id || fetched.id,
        // Preserve any custom sources already added
        sources: prev?.sources?.length ? prev.sources : fetched.sources || [],
        servers: Object.keys(prev?.servers || {}).length ? prev?.servers : fetched.servers || {},
        isPublished: prev?.isPublished !== undefined ? prev.isPublished : true
      }));

      setTmdbFetchSuccess(`Successfully auto-detected metadata for "${fetched.title}" (${fetched.releaseYear})!`);
      setTimeout(() => setTmdbFetchSuccess(null), 4000);
    } catch (err: any) {
      setTmdbFetchError(err.message || 'Auto-detect request failed. Verify your internet connection or TMDb API key.');
    } finally {
      setIsFetchingTmdb(false);
    }
  };

  const handleSaveMovie = async () => {
    if (!editingMovie?.title?.trim()) {
      alert('Please enter a movie title.');
      return;
    }
    setIsSaving(true);
    try {
      const movieToSave = {
        ...editingMovie,
        mediaType: 'movie',
        isPublished: editingMovie.isPublished !== undefined ? editingMovie.isPublished : true,
        updatedAt: new Date().toISOString()
      } as MovieItem;

      await saveMovie(movieToSave);
      await logAdminAction(
        user?.email || 'admin',
        'SAVE_MOVIE',
        'movies',
        movieToSave.id,
        `Saved movie "${movieToSave.title}"`
      );

      setIsEditorOpen(false);
      setNotice(`"${movieToSave.title}" saved successfully to Cloud Firestore.`);
      setTimeout(() => setNotice(null), 3500);
      await loadMoviesList();
    } catch (e: any) {
      alert(`Save error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk Import Handlers
  const handleStartTmdbBatch = async () => {
    setIsBulkProcessing(true);
    setBulkResultNotice(null);
    setBulkProgress({ current: 0, total: tmdbCount, stage: 'Fetching metadata from TMDb...' });

    try {
      const fetchedMovies = await tmdbService.fetchBatchMovies(
        tmdbCategory,
        tmdbCount,
        (current, total) => {
          setBulkProgress({ current, total, stage: `Fetching TMDb metadata (${current}/${total})...` });
        }
      );

      if (fetchedMovies.length === 0) {
        throw new Error('No movies could be retrieved from TMDb. Please try another category or check your API key.');
      }

      setBulkProgress({ current: 0, total: fetchedMovies.length, stage: 'Writing batch to Firestore in chunks of 400...' });

      const { success, failed } = await bulkSaveMovies(fetchedMovies, (processed, total) => {
        setBulkProgress({ current: processed, total, stage: `Writing to Cloud Firestore (${processed}/${total})...` });
      });

      await logAdminAction(
        user?.email || 'admin',
        'BULK_IMPORT_TMDB',
        'movies',
        `batch_${Date.now()}`,
        `Batch imported ${success} movies from TMDb (${tmdbCategory})`
      );

      setBulkResultNotice(`Complete! ${success} movies successfully saved to Firestore.${failed > 0 ? ` (${failed} failed)` : ''}`);
      await loadMoviesList();
    } catch (err: any) {
      setBulkResultNotice(`Error: ${err.message || 'Batch import failed'}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkFileContent(text);
      const parsed = tmdbService.parseBulkText(text);
      setParsedBulkItems(parsed);
      setBulkResultNotice(`Parsed ${parsed.length} movie entries from "${file.name}". Click Import to save.`);
    };
    reader.readAsText(file);
  };

  const handleTextContentChange = (text: string) => {
    setBulkFileContent(text);
    const parsed = tmdbService.parseBulkText(text);
    setParsedBulkItems(parsed);
  };

  const handleStartFileBatch = async () => {
    if (parsedBulkItems.length === 0) {
      alert('Please upload a valid CSV/JSON file or paste movie data first.');
      return;
    }

    setIsBulkProcessing(true);
    setBulkResultNotice(null);
    setBulkProgress({ current: 0, total: parsedBulkItems.length, stage: 'Optimizing Firestore writeBatch...' });

    try {
      const { success, failed } = await bulkSaveMovies(parsedBulkItems, (processed, total) => {
        setBulkProgress({ current: processed, total, stage: `Committed ${processed} / ${total} documents...` });
      });

      await logAdminAction(
        user?.email || 'admin',
        'BULK_IMPORT_FILE',
        'movies',
        `batch_file_${Date.now()}`,
        `Batch imported ${success} movies from CSV/JSON`
      );

      setBulkResultNotice(`Import complete! ${success} movies saved to Firestore.${failed > 0 ? ` (${failed} failed)` : ''}`);
      await loadMoviesList();
    } catch (err: any) {
      setBulkResultNotice(`Import error: ${err.message || 'Batch write failed'}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const sampleCsv = `title,year,rating,genres,poster,backdrop,overview,videourl
Interstellar,2014,8.7,Adventure;Drama;Sci-Fi,https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg,https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg,When Earth becomes uninhabitable, a team of explorers undertakes the most important mission in human history.,https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
Inception,2010,8.4,Action;Sci-Fi,https://image.tmdb.org/t/p/w780/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg,https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg,A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.,https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4`;

  const filtered = movies.filter((m) => {
    if (filterStatus === 'published' && m.isPublished === false) return false;
    if (filterStatus === 'draft' && m.isPublished !== false) return false;
    if (search.trim() && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            Feature Films Catalog
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage movie metadata, auto-detect TMDb / IMDb records, authorized 4K streaming feeds, and batch uploads.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setBulkResultNotice(null);
              setIsBulkModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-white/10 transition-colors shadow-lg cursor-pointer"
          >
            <Layers className="w-4 h-4 text-red-500" />
            <span>Bulk Add Movies</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase tracking-wider transition-colors shadow-lg shadow-red-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Movie</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-950 border border-white/10">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies by title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 uppercase font-mono mr-1">
            {filtered.length} {filtered.length === 1 ? 'Movie' : 'Movies'}
          </span>
          {(['all', 'published', 'draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                filterStatus === st ? 'bg-white/15 text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Table */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090c13] text-zinc-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Year</th>
                <th className="px-4 py-3 font-semibold">Quality</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Sources</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      <span>Loading movies from Cloud Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No movies found in this view. Use "Add Single Movie" or "Bulk Add Movies" to populate.
                  </td>
                </tr>
              ) : (
                filtered.map((movie) => (
                  <tr key={movie.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-12 rounded bg-zinc-900 overflow-hidden shrink-0 border border-white/10">
                        {movie.posterPath ? (
                          <img src={movie.posterPath} alt={movie.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="truncate max-w-xs">
                        <div className="text-white font-semibold truncate">{movie.title}</div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {movie.genres?.join(', ') || 'No genre'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{movie.releaseYear || '—'}</td>
                    <td className="px-4 py-3 text-red-400 font-semibold">{movie.quality || '4K'}</td>
                    <td className="px-4 py-3 text-amber-400 font-mono">★ {movie.rating || '8.0'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          movie.isPublished !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {movie.isPublished !== false ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {movie.sources?.length || 0} feeds
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(movie)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                          title="Edit Movie"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(movie.id, movie.title)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                          title="Delete Movie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. SINGLE MOVIE EDITOR MODAL (WITH TMDB/IMDB AUTO-DETECT) */}
      {/* ============================================================ */}
      {isEditorOpen && editingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl rounded-2xl bg-[#0b0f17] border border-white/15 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#07090e]">
              <div className="flex items-center gap-2.5">
                <Film className="w-5 h-5 text-red-500" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  {editingMovie.title ? `Edit Movie: ${editingMovie.title}` : 'Create New Movie'}
                </h2>
              </div>
              <button 
                onClick={() => setIsEditorOpen(false)} 
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TMDb / IMDb Auto-Detect Bar */}
            <div className="p-4 bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-zinc-900/40 border-b border-red-500/20">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-400 shrink-0">
                  <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>Auto-Detect Metadata:</span>
                </div>
                
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={tmdbQuery}
                    onChange={(e) => setTmdbQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAutoDetectTmdb();
                      }
                    }}
                    placeholder="Enter Movie Title, TMDb ID (e.g. 550), or IMDb ID (tt0137523)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-red-500/30 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAutoDetectTmdb}
                  disabled={isFetchingTmdb}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isFetchingTmdb ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching TMDb...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Fetch Details</span>
                    </>
                  )}
                </button>
              </div>

              {tmdbFetchSuccess && (
                <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  <span>{tmdbFetchSuccess}</span>
                </div>
              )}

              {tmdbFetchError && (
                <div className="mt-2.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{tmdbFetchError}</span>
                </div>
              )}
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/10 bg-[#090c13] px-5 gap-4">
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'media', label: 'Posters & Media' },
                { id: 'cast', label: 'Cast & Crew' },
                { id: 'sources', label: 'Streaming Sources' }
              ].map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setActiveEditorTab(tb.id as any)}
                  className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                    activeEditorTab === tb.id
                      ? 'border-red-600 text-white font-bold'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {activeEditorTab === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Title *</label>
                    <input
                      type="text"
                      value={editingMovie.title || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Release Year</label>
                    <input
                      type="number"
                      value={editingMovie.releaseYear || 2024}
                      onChange={(e) => setEditingMovie({ ...editingMovie, releaseYear: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Runtime</label>
                    <input
                      type="text"
                      value={editingMovie.runtime || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, runtime: e.target.value, duration: e.target.value })}
                      placeholder="e.g. 2h 45m"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Rating (0-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingMovie.rating || 8.0}
                      onChange={(e) => setEditingMovie({ ...editingMovie, rating: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Content Rating</label>
                    <select
                      value={editingMovie.contentRating || 'PG-13'}
                      onChange={(e) => setEditingMovie({ ...editingMovie, contentRating: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="G">G - General Audiences</option>
                      <option value="PG">PG - Parental Guidance</option>
                      <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                      <option value="R">R - Restricted 17+</option>
                      <option value="NC-17">NC-17 - Adults Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Director</label>
                    <input
                      type="text"
                      value={editingMovie.director || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, director: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Genres (comma separated)</label>
                    <input
                      type="text"
                      value={editingMovie.genres?.join(', ') || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, genres: e.target.value.split(',').map((g) => g.trim()).filter(Boolean) })}
                      placeholder="Action, Sci-Fi, Thriller"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Tagline</label>
                    <input
                      type="text"
                      value={editingMovie.tagline || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, tagline: e.target.value })}
                      placeholder="e.g. Mankind was born on Earth. It was never meant to die here."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Synopsis / Overview</label>
                    <textarea
                      rows={3}
                      value={editingMovie.overview || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, overview: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center gap-4 sm:col-span-2 pt-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMovie.isPublished !== false}
                        onChange={(e) => setEditingMovie({ ...editingMovie, isPublished: e.target.checked })}
                        className="accent-red-600 rounded"
                      />
                      <span>Publish immediately to public catalog</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingMovie.isFeatured)}
                        onChange={(e) => setEditingMovie({ ...editingMovie, isFeatured: e.target.checked })}
                        className="accent-red-600 rounded"
                      />
                      <span>Feature in Hero Showcase</span>
                    </label>
                  </div>
                </div>
              )}

              {activeEditorTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Poster Image URL (780px+)</label>
                    <input
                      type="text"
                      value={editingMovie.posterPath || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, posterPath: e.target.value })}
                      placeholder="https://image.tmdb.org/t/p/w780/..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    {editingMovie.posterPath && (
                      <div className="mt-2 w-24 h-36 rounded-lg bg-zinc-900 overflow-hidden border border-white/10">
                        <img src={editingMovie.posterPath} alt="Poster Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Backdrop Image URL (1920x1080+)</label>
                    <input
                      type="text"
                      value={editingMovie.backdropPath || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, backdropPath: e.target.value })}
                      placeholder="https://image.tmdb.org/t/p/original/..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    {editingMovie.backdropPath && (
                      <div className="mt-2 w-full h-40 rounded-xl bg-zinc-900 overflow-hidden border border-white/10">
                        <img src={editingMovie.backdropPath} alt="Backdrop Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">YouTube Official Trailer Key or ID</label>
                    <input
                      type="text"
                      value={editingMovie.trailerYoutubeId || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, trailerYoutubeId: e.target.value })}
                      placeholder="e.g. zSWdZVtXT7E or full youtube url"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}

              {activeEditorTab === 'cast' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">
                      Cast Members ({editingMovie.cast?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCast = editingMovie.cast ? [...editingMovie.cast] : [];
                        newCast.push({ id: Date.now(), name: '', role: '', character: '' });
                        setEditingMovie({ ...editingMovie, cast: newCast });
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-white flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Actor
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {editingMovie.cast?.map((actor, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-white/10">
                        {actor.profilePath ? (
                          <img src={actor.profilePath} alt={actor.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <input
                          type="text"
                          value={actor.name}
                          onChange={(e) => {
                            const updated = [...(editingMovie.cast || [])];
                            updated[idx].name = e.target.value;
                            setEditingMovie({ ...editingMovie, cast: updated });
                          }}
                          placeholder="Actor Name"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={actor.character || actor.role || ''}
                          onChange={(e) => {
                            const updated = [...(editingMovie.cast || [])];
                            updated[idx].character = e.target.value;
                            updated[idx].role = e.target.value;
                            setEditingMovie({ ...editingMovie, cast: updated });
                          }}
                          placeholder="Character Role"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingMovie.cast || []).filter((_, i) => i !== idx);
                            setEditingMovie({ ...editingMovie, cast: updated });
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeEditorTab === 'sources' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase">Direct Streaming Sources (MP4 / HLS)</h4>
                      <p className="text-[11px] text-zinc-500">Provide direct stream URLs played with native CINEXUS engine.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newSrc: VideoSource = {
                          id: `src_${Date.now()}`,
                          title: 'Primary Master Feed',
                          url: '',
                          type: 'mp4',
                          quality: '4K Ultra HD',
                          enabled: true
                        };
                        setEditingMovie({
                          ...editingMovie,
                          sources: [...(editingMovie.sources || []), newSrc]
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Stream Feed
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editingMovie.sources?.map((src, idx) => (
                      <div key={src.id || idx} className="p-3 rounded-xl bg-zinc-900 border border-white/10 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={src.title}
                            onChange={(e) => {
                              const updated = [...(editingMovie.sources || [])];
                              updated[idx].title = e.target.value;
                              setEditingMovie({ ...editingMovie, sources: updated });
                            }}
                            placeholder="Server / Feed Label"
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white"
                          />
                          <select
                            value={src.type}
                            onChange={(e) => {
                              const updated = [...(editingMovie.sources || [])];
                              updated[idx].type = e.target.value as any;
                              setEditingMovie({ ...editingMovie, sources: updated });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white"
                          >
                            <option value="mp4">MP4 Video Stream</option>
                            <option value="hls">HLS Master Playlist (.m3u8)</option>
                            <option value="iframe">External Player Iframe</option>
                          </select>
                          <select
                            value={src.quality}
                            onChange={(e) => {
                              const updated = [...(editingMovie.sources || [])];
                              updated[idx].quality = e.target.value as any;
                              setEditingMovie({ ...editingMovie, sources: updated });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white"
                          >
                            <option value="4K Ultra HD">4K Ultra HD</option>
                            <option value="1080p FHD">1080p Full HD</option>
                            <option value="720p HD">720p HD</option>
                            <option value="Auto">Auto Quality</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={src.url}
                            onChange={(e) => {
                              const updated = [...(editingMovie.sources || [])];
                              updated[idx].url = e.target.value;
                              setEditingMovie({ ...editingMovie, sources: updated });
                            }}
                            placeholder="https://your-domain.com/video.mp4 or .m3u8"
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingMovie.sources || []).filter((_, i) => i !== idx);
                              setEditingMovie({ ...editingMovie, sources: updated });
                            }}
                            className="p-1.5 rounded text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fallback External Server Embeds */}
                  <div className="pt-3 border-t border-white/10">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Embed Servers (Fallback)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-zinc-500 mb-1">StreamHG URL</label>
                        <input
                          type="text"
                          value={editingMovie.servers?.streamhg || ''}
                          onChange={(e) => setEditingMovie({
                            ...editingMovie,
                            servers: { ...editingMovie.servers, streamhg: e.target.value }
                          })}
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-500 mb-1">FileMoon URL</label>
                        <input
                          type="text"
                          value={editingMovie.servers?.filemoon || ''}
                          onChange={(e) => setEditingMovie({
                            ...editingMovie,
                            servers: { ...editingMovie.servers, filemoon: e.target.value }
                          })}
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-[#07090e]">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveMovie}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Movie Record</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. BULK MOVIE ADDITION MODAL (TMDB BATCH + CSV/JSON UPLOAD) */}
      {/* ============================================================ */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl bg-[#0b0f17] border border-white/15 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#07090e]">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-red-500" />
                <div>
                  <h2 className="text-base font-bold text-white uppercase tracking-wider">
                    Bulk Movie Addition System
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Insert 10, 50, 100, or 1000+ movies at once using TMDb Batch Importer or CSV/JSON uploads.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => !isBulkProcessing && setIsBulkModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-3 bg-[#090c13] border-b border-white/10 gap-2">
              <button
                type="button"
                onClick={() => setBulkMode('tmdb')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  bulkMode === 'tmdb'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>TMDb Batch Importer</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkMode('file')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  bulkMode === 'file'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>CSV / JSON File Upload</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {bulkMode === 'tmdb' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-red-500" />
                      Configure TMDb List Ingestion
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                          List Category
                        </label>
                        <select
                          value={tmdbCategory}
                          onChange={(e) => setTmdbCategory(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                        >
                          <option value="popular">Popular Movies (All-Time High Demand)</option>
                          <option value="top_rated">Top Rated Cinema (Critically Acclaimed)</option>
                          <option value="trending">Trending This Week (Highest Buzz)</option>
                          <option value="now_playing">Now Playing in Theaters</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                          Import Quantity
                        </label>
                        <select
                          value={tmdbCount}
                          onChange={(e) => setTmdbCount(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                        >
                          <option value={10}>10 Movies (Quick Ingestion)</option>
                          <option value={20}>20 Movies (1 Full TMDb Page)</option>
                          <option value={50}>50 Movies (Curated Catalog)</option>
                          <option value={100}>100 Movies (Extensive Catalog)</option>
                          <option value={200}>200 Movies (Bulk Studio Import)</option>
                          <option value={500}>500 Movies (Production Library)</option>
                          <option value={1000}>1000 Movies (Ultimate Cinema Index)</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                      ℹ️ All items will be saved directly into Cloud Firestore using optimized <span className="text-white font-mono">writeBatch</span> chunking (400 items per commit) to respect Firestore's 500-operation limits.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartTmdbBatch}
                    disabled={isBulkProcessing}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isBulkProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing TMDb Import...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Import {tmdbCount} Movies from TMDb</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {bulkMode === 'file' && (
                <div className="space-y-4">
                  {/* File Upload Zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-white/15 hover:border-red-500/50 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all text-center cursor-pointer space-y-2 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json,text/csv,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-red-500 mx-auto transition-colors" />
                    <div>
                      <span className="text-xs font-semibold text-white">Click to upload CSV or JSON file</span>
                      <p className="text-[11px] text-zinc-500">Supports .csv or .json formatted movie catalogues</p>
                    </div>
                  </div>

                  {/* Manual Paste Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-400 uppercase">
                        Or Paste CSV / JSON Data Directly
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkFileContent(sampleCsv);
                          handleTextContentChange(sampleCsv);
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Load Sample CSV</span>
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={bulkFileContent}
                      onChange={(e) => handleTextContentChange(e.target.value)}
                      placeholder="Paste CSV (title,year,rating,genres,poster,videourl...) or JSON array [{...}]"
                      className="w-full p-3 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {parsedBulkItems.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-xs space-y-2">
                      <div className="flex items-center justify-between text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Ready to Import: {parsedBulkItems.length} Movies Detected
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1 text-zinc-400 text-[11px] pr-1">
                        {parsedBulkItems.slice(0, 5).map((m, idx) => (
                          <div key={idx} className="truncate">
                            • <strong className="text-white">{m.title}</strong> ({m.releaseYear}) — {m.genres?.join(', ')}
                          </div>
                        ))}
                        {parsedBulkItems.length > 5 && (
                          <div className="text-zinc-500 italic">...and {parsedBulkItems.length - 5} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStartFileBatch}
                    disabled={isBulkProcessing || parsedBulkItems.length === 0}
                    className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isBulkProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Writing to Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>Import {parsedBulkItems.length} Movies to Firestore</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Progress Indicator */}
              {isBulkProcessing && (
                <div className="p-4 rounded-2xl bg-black/60 border border-red-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{bulkProgress.stage}</span>
                    <span className="font-mono text-red-400 font-bold">
                      {bulkProgress.total > 0 ? `${Math.round((bulkProgress.current / bulkProgress.total) * 100)}%` : '0%'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                      style={{
                        width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Result Notice */}
              {bulkResultNotice && (
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/20 text-xs text-white flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bulkResultNotice}</span>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-4 border-t border-white/10 bg-[#07090e]">
              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => setIsBulkModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Close Importer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
