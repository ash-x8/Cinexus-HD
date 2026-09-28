import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tv, Film, Save, ListPlus, Radio } from 'lucide-react';
import { getSeries, saveSeries, deleteSeries, getEpisodesBySeries, saveEpisode, deleteEpisode, logAdminAction } from '../../services/firestore';
import { SeriesItem, EpisodeItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminSeries: React.FC = () => {
  const { user } = useAuth();
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Series Editor Modal
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Partial<SeriesItem> | null>(null);

  // Episode Editor Modal
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [activeSeriesForEpisodes, setActiveSeriesForEpisodes] = useState<SeriesItem | null>(null);
  const [episodesList, setEpisodesList] = useState<EpisodeItem[]>([]);
  const [newEpisode, setNewEpisode] = useState<Partial<EpisodeItem>>({
    seasonNumber: 1,
    episodeNumber: 1,
    title: '',
    overview: ''
  });

  const loadSeries = async () => {
    setLoading(true);
    try {
      const data = await getSeries();
      setSeriesList(data);
    } catch (e) {
      console.warn('Error loading series:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const handleOpenEpisodes = async (series: SeriesItem) => {
    setActiveSeriesForEpisodes(series);
    const eps = await getEpisodesBySeries(series.id);
    setEpisodesList(eps);
    setNewEpisode({
      seasonNumber: 1,
      episodeNumber: eps.length + 1,
      title: '',
      overview: ''
    });
    setIsEpisodeModalOpen(true);
  };

  const handleSaveEpisode = async () => {
    if (!activeSeriesForEpisodes || !newEpisode.title?.trim()) {
      alert('Please enter an episode title.');
      return;
    }
    const epToSave: EpisodeItem = {
      id: newEpisode.id || `ep_${activeSeriesForEpisodes.id}_${Date.now()}`,
      seriesId: activeSeriesForEpisodes.id,
      seasonNumber: newEpisode.seasonNumber || 1,
      episodeNumber: newEpisode.episodeNumber || 1,
      title: newEpisode.title,
      overview: newEpisode.overview || '',
      runtime: newEpisode.runtime || '45m',
      isPublished: true,
      servers: newEpisode.servers || {},
      createdAt: new Date().toISOString()
    };

    await saveEpisode(epToSave);
    await logAdminAction(
      user?.email || 'admin',
      'SAVE_EPISODE',
      'episodes',
      epToSave.id,
      `Saved episode S${epToSave.seasonNumber}E${epToSave.episodeNumber} for ${activeSeriesForEpisodes.title}`
    );

    const updated = await getEpisodesBySeries(activeSeriesForEpisodes.id);
    setEpisodesList(updated);
    setNewEpisode({
      seasonNumber: 1,
      episodeNumber: updated.length + 1,
      title: '',
      overview: ''
    });
  };

  const handleDeleteEpisode = async (epId: string) => {
    if (!activeSeriesForEpisodes) return;
    await deleteEpisode(epId);
    const updated = await getEpisodesBySeries(activeSeriesForEpisodes.id);
    setEpisodesList(updated);
  };

  const handleSaveSeries = async () => {
    if (!editingSeries?.title?.trim()) {
      alert('Please enter a series title.');
      return;
    }
    const sToSave = {
      ...editingSeries,
      mediaType: editingSeries.mediaType || 'tv',
      isPublished: editingSeries.isPublished !== undefined ? editingSeries.isPublished : true
    } as SeriesItem;

    await saveSeries(sToSave);
    await logAdminAction(user?.email || 'admin', 'SAVE_SERIES', 'series', sToSave.id, `Saved series "${sToSave.title}"`);
    setIsSeriesModalOpen(false);
    await loadSeries();
  };

  const handleDeleteSeries = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete series "${title}" and all its episodes?`)) return;
    await deleteSeries(id);
    await logAdminAction(user?.email || 'admin', 'DELETE_SERIES', 'series', id, `Deleted series "${title}"`);
    await loadSeries();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            TV & Anime Series Hub
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Organize multi-season episodic television and anime series with sources.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSeries({
              id: `tv_${Date.now()}`,
              title: '',
              mediaType: 'tv',
              releaseYear: 2024,
              genres: ['Drama'],
              rating: 8.5,
              isPublished: true
            });
            setIsSeriesModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase tracking-wider transition-colors shadow-lg shadow-red-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Series</span>
        </button>
      </div>

      {/* Series Table */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090c13] text-zinc-400 uppercase tracking-wider border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-semibold">Series Title</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Year</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Episodes</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {seriesList.map((s) => (
              <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                  <div className="w-8 h-12 rounded bg-zinc-900 overflow-hidden shrink-0">
                    {s.posterPath && <img src={s.posterPath} alt={s.title} className="w-full h-full object-cover" />}
                  </div>
                  <span className="truncate max-w-xs">{s.title}</span>
                </td>
                <td className="px-4 py-3 uppercase text-zinc-400 font-semibold">{s.mediaType}</td>
                <td className="px-4 py-3 text-zinc-400">{s.releaseYear}</td>
                <td className="px-4 py-3 text-amber-400 font-mono">{s.rating}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleOpenEpisodes(s)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 font-medium border border-white/10"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-red-500" />
                    <span>Manage Episodes</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditingSeries(s);
                        setIsSeriesModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSeries(s.id, s.title)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Series Editor Modal */}
      {isSeriesModalOpen && editingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-white/15 p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase">
              {editingSeries.title ? `Edit Series: ${editingSeries.title}` : 'Create Series'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  value={editingSeries.title || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Type</label>
                <select
                  value={editingSeries.mediaType || 'tv'}
                  onChange={(e) => setEditingSeries({ ...editingSeries, mediaType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                >
                  <option value="tv">Television Series</option>
                  <option value="anime">Anime Series</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Release Year</label>
                <input
                  type="number"
                  value={editingSeries.releaseYear || 2024}
                  onChange={(e) => setEditingSeries({ ...editingSeries, releaseYear: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Poster Image URL</label>
                <input
                  type="text"
                  value={editingSeries.posterPath || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, posterPath: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Backdrop Image URL</label>
                <input
                  type="text"
                  value={editingSeries.backdropPath || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, backdropPath: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Overview</label>
                <textarea
                  rows={3}
                  value={editingSeries.overview || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, overview: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsSeriesModalOpen(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSeries}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-xs font-semibold text-white uppercase"
              >
                Save Series
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Episode Management Modal */}
      {isEpisodeModalOpen && activeSeriesForEpisodes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-2xl bg-zinc-950 border border-white/15 p-6 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white uppercase">
                  Episodes for {activeSeriesForEpisodes.title}
                </h3>
                <p className="text-xs text-zinc-400">Add or edit streaming feeds for individual episodes.</p>
              </div>
              <button onClick={() => setIsEpisodeModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            {/* Existing Episodes List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase">Current Episodes ({episodesList.length})</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {episodesList.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs"
                  >
                    <div>
                      <span className="font-bold text-red-500 mr-2">S{ep.seasonNumber} E{ep.episodeNumber}</span>
                      <span className="text-white font-medium">{ep.title}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteEpisode(ep.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Episode Form */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase">Add New Episode</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Season</label>
                  <input
                    type="number"
                    value={newEpisode.seasonNumber || 1}
                    onChange={(e) => setNewEpisode({ ...newEpisode, seasonNumber: parseInt(e.target.value, 10) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Episode #</label>
                  <input
                    type="number"
                    value={newEpisode.episodeNumber || 1}
                    onChange={(e) => setNewEpisode({ ...newEpisode, episodeNumber: parseInt(e.target.value, 10) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Episode Title *</label>
                  <input
                    type="text"
                    value={newEpisode.title || ''}
                    onChange={(e) => setNewEpisode({ ...newEpisode, title: e.target.value })}
                    placeholder="e.g. Chapter 1: The Beginning"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Stream Server 1 (StreamHG / Direct)</label>
                <input
                  type="text"
                  value={newEpisode.servers?.streamhg || ''}
                  onChange={(e) =>
                    setNewEpisode({
                      ...newEpisode,
                      servers: { ...newEpisode.servers, streamhg: e.target.value }
                    })
                  }
                  placeholder="https://streamhg.com/embed/..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <button
                onClick={handleSaveEpisode}
                className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase transition-colors"
              >
                Add Episode to Season
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
