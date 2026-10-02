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
  EyeOff,
  Sparkles,
  Loader2,
  AlertCircle,
  Tag
} from 'lucide-react';
import { 
  getHomepageSections, 
  subscribeHomepageSections, 
  saveHomepageSection, 
  deleteHomepageSection, 
  logAdminAction 
} from '../../services/firestore';
import { HomepageSectionConfig } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminHomepage: React.FC = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<HomepageSectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSec, setEditingSec] = useState<HomepageSectionConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Subscribe to realtime homepage rails from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeHomepageSections((data) => {
      setSections(data);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleToggleEnable = async (sec: HomepageSectionConfig) => {
    const updated = { ...sec, enabled: !sec.enabled };
    try {
      await saveHomepageSection(updated);
      setSections((prev) => prev.map((s) => (s.id === sec.id ? updated : s)));
      await logAdminAction(
        user?.email || 'admin',
        'TOGGLE_RAIL_VISIBILITY',
        'homepage',
        sec.id,
        `${updated.enabled ? 'Enabled' : 'Disabled'} rail "${sec.title}"`
      );
    } catch (err: any) {
      console.error('Toggle enable error:', err);
      setSaveError(`Failed to update rail visibility: ${err.message || 'Firestore error'}`);
    }
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

    try {
      for (const item of updatedList) {
        await saveHomepageSection(item);
      }
      await logAdminAction(user?.email || 'admin', 'REORDER_RAILS', 'homepage', 'all', 'Reordered homepage rails');
    } catch (err: any) {
      console.error('Reorder error:', err);
      setSaveError(`Failed to save reordered rails: ${err.message || 'Firestore error'}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Permanently remove homepage section "${title}"?`)) return;
    try {
      await deleteHomepageSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      await logAdminAction(user?.email || 'admin', 'DELETE_RAIL', 'homepage', id, `Deleted homepage rail "${title}"`);
      setSaveNotice(`Rail "${title}" removed.`);
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err: any) {
      console.error('Delete rail error:', err);
      setSaveError(`Failed to delete rail: ${err.message || 'Firestore error'}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSec || !editingSec.title?.trim()) {
      alert('Please enter a rail title.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const railToSave: HomepageSectionConfig = {
        ...editingSec,
        title: editingSec.title.trim(),
        subtitle: editingSec.subtitle?.trim() || '',
        badge: editingSec.badge?.trim() ? editingSec.badge.trim().toUpperCase() : '',
        order: editingSec.order || sections.length + 1,
        enabled: editingSec.enabled !== undefined ? editingSec.enabled : true,
        itemLimit: Number(editingSec.itemLimit) || 12,
        filterGenre: editingSec.filterGenre || 'all'
      };

      await saveHomepageSection(railToSave);
      await logAdminAction(
        user?.email || 'admin',
        'SAVE_RAIL',
        'homepage',
        railToSave.id,
        `Saved homepage rail "${railToSave.title}"`
      );

      setSaveNotice(`Saved rail "${railToSave.title}" successfully.`);
      setTimeout(() => setSaveNotice(null), 3500);
      setEditingSec(null);
    } catch (err: any) {
      console.error('Error saving rail:', err);
      setSaveError(`Save failed: ${err.message || 'Cloud Firestore rejected write request.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2.5">
            <span>Homepage Rails & Layout CMS</span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realtime Sync</span>
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure dynamic homepage row ordering, titles, badges, and visibility in real-time.
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
              filterGenre: 'Action',
              badge: 'NEW'
            };
            setEditingSec(newSec);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-black uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Add Homepage Rail</span>
        </button>
      </div>

      {/* Notice Banner */}
      {saveNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Error Banner */}
      {saveError && (
        <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs flex flex-col items-center justify-center space-y-3 bg-[#12151E] rounded-2xl border border-white/10">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span>Connecting to Cloud Firestore rails...</span>
          </div>
        ) : sections.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-950 rounded-2xl border border-white/10">
            No dynamic homepage rails configured yet. Click "Add Homepage Rail" to create dynamic curated rows that render on the public website.
          </div>
        ) : (
          sections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                sec.enabled
                  ? 'bg-zinc-950 border-white/10 shadow-sm'
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
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-sm">
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
                  className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
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
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleMoveOrder(idx, 'down')}
                  disabled={idx === sections.length - 1}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setEditingSec({ ...sec })}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                  title="Edit Rail Details"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(sec.id, sec.title)}
                  className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[#12151E] border border-amber-500/20 p-6 sm:p-8 space-y-4 shadow-[0_0_50px_rgba(229,169,60,0.15)]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Configure Rail Section</span>
              </h3>
            </div>

            <div className="space-y-4">
              {/* Row Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  Row Title
                </label>
                <input
                  type="text"
                  required
                  value={editingSec.title}
                  onChange={(e) => setEditingSec({ ...editingSec, title: e.target.value })}
                  placeholder="e.g. Trending Blockbusters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                />
              </div>

              {/* Badge Input Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1 flex items-center justify-between">
                  <span>Badge Tag (Optional)</span>
                  <span className="text-[10px] text-zinc-500 font-normal">e.g. NEW, TRENDING, 4K HDR</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={16}
                    value={editingSec.badge || ''}
                    onChange={(e) => setEditingSec({ ...editingSec, badge: e.target.value.toUpperCase() })}
                    placeholder="e.g. NEW, TRENDING, 4K HDR, EXCLUSIVE"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                  />
                  {editingSec.badge && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-black">
                        Preview: {editingSec.badge}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-zinc-500">Quick presets:</span>
                  {['NEW', 'TRENDING', 'HOT', '4K HDR', 'EXCLUSIVE', 'TOP 10'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingSec({ ...editingSec, badge: preset })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        editingSec.badge === preset
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  {editingSec.badge && (
                    <button
                      type="button"
                      onClick={() => setEditingSec({ ...editingSec, badge: '' })}
                      className="px-2 py-0.5 rounded text-[10px] text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={editingSec.subtitle || ''}
                  onChange={(e) => setEditingSec({ ...editingSec, subtitle: e.target.value })}
                  placeholder="e.g. Mastered cinema streams in reference quality"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                />
              </div>

              {/* Filter Genre & Item Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                    Filter Genre
                  </label>
                  <select
                    value={editingSec.filterGenre || 'all'}
                    onChange={(e) => setEditingSec({ ...editingSec, filterGenre: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                  >
                    <option value="all">All Genres</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Action">Action</option>
                    <option value="Drama">Drama</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Animation">Animation</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Sri Lankan Movies">Sri Lankan Movies</option>
                    <option value="Movies with Sinhala Subtitles">Sinhala Subtitles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                    Item Limit
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={50}
                    value={editingSec.itemLimit || editingSec.limit || 12}
                    onChange={(e) =>
                      setEditingSec({ ...editingSec, itemLimit: parseInt(e.target.value, 10), limit: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button 
                type="button"
                onClick={() => setEditingSec(null)} 
                className="px-4 py-2.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>Saving Rail...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-black" />
                    <span>Save Rail</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
