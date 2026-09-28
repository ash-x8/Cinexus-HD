import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  Edit,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { getHomepageSections, saveHomepageSection, deleteHomepageSection, logAdminAction } from '../../services/firestore';
import { HomepageSectionConfig } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminHomepage: React.FC = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<HomepageSectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSec, setEditingSec] = useState<HomepageSectionConfig | null>(null);

  const loadSections = async () => {
    setLoading(true);
    try {
      const data = await getHomepageSections();
      setSections(data);
    } catch (e) {
      console.warn('Error loading rails:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleToggleEnable = async (sec: HomepageSectionConfig) => {
    const updated = { ...sec, enabled: !sec.enabled };
    await saveHomepageSection(updated);
    setSections((prev) => prev.map((s) => (s.id === sec.id ? updated : s)));
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const list = [...sections];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Re-index order
    const updatedList = list.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(updatedList);

    for (const item of updatedList) {
      await saveHomepageSection(item);
    }
    await logAdminAction(user?.email || 'admin', 'REORDER_RAILS', 'homepage', 'all', 'Reordered homepage rails');
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete homepage section "${title}"?`)) return;
    await deleteHomepageSection(id);
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveEdit = async () => {
    if (!editingSec) return;
    await saveHomepageSection(editingSec);
    setEditingSec(null);
    await loadSections();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            Homepage Rails & Layout CMS
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure dynamic homepage row ordering, titles, and visibility in real-time.
          </p>
        </div>

        <button
          onClick={() => {
            const newSec: HomepageSectionConfig = {
              id: `rail_${Date.now()}`,
              title: 'New Curated Cinema Rail',
              subtitle: 'Hand-picked selections from master filmmakers',
              type: 'curated_row',
              order: sections.length + 1,
              enabled: true,
              itemLimit: 12,
              filterGenre: 'Action'
            };
            setEditingSec(newSec);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase tracking-wider transition-colors shadow-lg shadow-red-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Add Homepage Rail</span>
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-950 rounded-2xl border border-white/10">
            No homepage rails configured. Add one to display curated rows on the public cinema homepage.
          </div>
        ) : (
          sections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                sec.enabled
                  ? 'bg-zinc-950 border-white/10'
                  : 'bg-zinc-950/40 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 text-center font-mono font-bold text-zinc-500 text-xs">
                  #{sec.order}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{sec.title}</span>
                    {sec.badge && (
                      <span className="px-2 py-0.5 bg-red-600 text-[10px] font-bold rounded text-white">
                        {sec.badge}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{sec.subtitle || 'No subtitle provided.'}</p>
                  <div className="text-[10px] text-zinc-500 mt-1 uppercase">
                    Limit: {sec.itemLimit || sec.limit || 12} titles · Genre: {sec.filterGenre || 'all'}
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleToggleEnable(sec)}
                  className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                    sec.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                  }`}
                  title={sec.enabled ? 'Enabled on Homepage' : 'Hidden from Homepage'}
                >
                  {sec.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleMoveOrder(idx, 'up')}
                  disabled={idx === 0}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleMoveOrder(idx, 'down')}
                  disabled={idx === sections.length - 1}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setEditingSec({ ...sec })}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300"
                  title="Edit Rail Details"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(sec.id, sec.title)}
                  className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400"
                  title="Delete Rail"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Rail Modal */}
      {editingSec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-white/15 p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase">Configure Rail Section</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Row Title</label>
                <input
                  type="text"
                  value={editingSec.title}
                  onChange={(e) => setEditingSec({ ...editingSec, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Subtitle</label>
                <input
                  type="text"
                  value={editingSec.subtitle || ''}
                  onChange={(e) => setEditingSec({ ...editingSec, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Filter Genre</label>
                  <select
                    value={editingSec.filterGenre || 'all'}
                    onChange={(e) => setEditingSec({ ...editingSec, filterGenre: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  >
                    <option value="all">All Genres</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Action">Action</option>
                    <option value="Drama">Drama</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Documentary">Documentary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Item Limit</label>
                  <input
                    type="number"
                    value={editingSec.itemLimit || editingSec.limit || 12}
                    onChange={(e) =>
                      setEditingSec({ ...editingSec, itemLimit: parseInt(e.target.value, 10), limit: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button onClick={() => setEditingSec(null)} className="px-4 py-2 text-xs text-zinc-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-xs font-semibold text-white uppercase"
              >
                Save Rail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
