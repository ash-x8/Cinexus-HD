import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  Radio,
  ExternalLink,
  Film,
  Sparkles,
  Save,
  RotateCw
} from 'lucide-react';
import { getMovies, saveMovie, deleteMovie, logAdminAction } from '../../services/firestore';
import { MovieItem, VideoSource, ServerEmbeds } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminMovies: React.FC = () => {
  const { user } = useAuth();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Partial<MovieItem> | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'basic' | 'media' | 'sources' | 'cast'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
      genres: ['Action'],
      quality: '4K Ultra HD',
      contentRating: 'PG-13',
      rating: 8.0,
      isPublished: true,
      sources: [],
      servers: {}
    });
    setActiveEditorTab('basic');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (movie: MovieItem) => {
    setEditingMovie({ ...movie });
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
            Manage movie metadata, authorized 4K streaming sources, and publishing states.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase tracking-wider transition-colors shadow-lg shadow-red-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Movie</span>
        </button>
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
          {(['all', 'published', 'draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors ${
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
                    Loading movies from Cloud Firestore...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No movies found in this view.
                  </td>
                </tr>
              ) : (
                filtered.map((movie) => (
                  <tr key={movie.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-12 rounded bg-zinc-900 overflow-hidden shrink-0">
                        {movie.posterPath && (
                          <img src={movie.posterPath} alt={movie.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="truncate max-w-xs">{movie.title}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{movie.releaseYear}</td>
                    <td className="px-4 py-3 text-red-400 font-semibold">{movie.quality}</td>
                    <td className="px-4 py-3 text-amber-400 font-mono">{movie.rating}</td>
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
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                          title="Edit Movie"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(movie.id, movie.title)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
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

      {/* Editor Modal */}
      {isEditorOpen && editingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {editingMovie.title ? `Edit Movie: ${editingMovie.title}` : 'Create New Movie'}
              </h2>
              <button onClick={() => setIsEditorOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/10 bg-[#090c13] px-5 gap-4">
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'media', label: 'Media & Visuals' },
                { id: 'sources', label: 'Streaming Sources' }
              ].map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setActiveEditorTab(tb.id as any)}
                  className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                    activeEditorTab === tb.id
                      ? 'border-red-600 text-white'
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
                      onChange={(e) => setEditingMovie({ ...editingMovie, runtime: e.target.value })}
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
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Director</label>
                    <input
                      type="text"
                      value={editingMovie.director || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, director: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Synopsis</label>
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
                      <span>Feature in Hero Carousel</span>
                    </label>
                  </div>
                </div>
              )}

              {activeEditorTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Poster Image URL</label>
                    <input
                      type="text"
                      value={editingMovie.posterPath || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, posterPath: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Backdrop Image URL</label>
                    <input
                      type="text"
                      value={editingMovie.backdropPath || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, backdropPath: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">YouTube Trailer Key</label>
                    <input
                      type="text"
                      value={editingMovie.trailerYoutubeId || ''}
                      onChange={(e) => setEditingMovie({ ...editingMovie, trailerYoutubeId: e.target.value })}
                      placeholder="e.g. Way9Dexny3w"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {activeEditorTab === 'sources' && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">
                    Configure authorized direct video feeds (.mp4, .m3u8) or admin server embeds.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Server 1 (StreamHG Embed / Direct URL)
                    </label>
                    <input
                      type="text"
                      value={editingMovie.servers?.streamhg || ''}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          servers: { ...editingMovie.servers, streamhg: e.target.value }
                        })
                      }
                      placeholder="https://streamhg.com/embed/..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Server 2 (EarnVids Embed)
                    </label>
                    <input
                      type="text"
                      value={editingMovie.servers?.ernvids || ''}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          servers: { ...editingMovie.servers, ernvids: e.target.value }
                        })
                      }
                      placeholder="https://earnvids.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Server 3 (FileMoon Embed)
                    </label>
                    <input
                      type="text"
                      value={editingMovie.servers?.filemoon || ''}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          servers: { ...editingMovie.servers, filemoon: e.target.value }
                        })
                      }
                      placeholder="https://filemoon.sx/e/..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-[#090c13]">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMovie}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Writing to Firestore...' : 'Save & Sync'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
