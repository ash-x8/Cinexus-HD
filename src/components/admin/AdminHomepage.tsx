import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Check,
  Edit,
  Save,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  AlertCircle,
  Tag,
  GripVertical,
  MoveVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  getHomepageSections, 
  subscribeHomepageSections, 
  saveHomepageSection, 
  deleteHomepageSection, 
  logAdminAction 
} from '../../services/firestore';
import { HomepageSectionConfig } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SortableRailItemProps {
  sec: HomepageSectionConfig;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleEnable: (sec: HomepageSectionConfig) => void;
  onEdit: (sec: HomepageSectionConfig) => void;
  onDelete: (id: string, title: string) => void;
}

const SortableRailItem: React.FC<SortableRailItemProps> = ({
  sec,
  index,
  isSelected,
  onToggleSelect,
  onToggleEnable,
  onEdit,
  onDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: sec.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none ${
        isDragging
          ? 'bg-[#181C28] border-amber-500 shadow-2xl scale-[1.02]'
          : isSelected
          ? 'bg-[#181c2b] border-amber-500/60 shadow-lg'
          : sec.enabled
          ? 'bg-zinc-950 border-white/10 shadow-sm'
          : 'bg-zinc-950/40 border-white/5 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Bulk Action Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(sec.id)}
          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          title={`Select ${sec.title}`}
          aria-label={`Select ${sec.title}`}
        />

        {/* Visual Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-2 -ml-1 text-zinc-500 hover:text-amber-400 cursor-grab active:cursor-grabbing rounded-xl hover:bg-white/5 transition-colors touch-none"
          title="Drag up or down to reorder rail"
          aria-label={`Drag to reorder rail ${sec.title}`}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="w-7 text-center font-mono font-bold text-zinc-500 text-xs">
          #{index + 1}
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
          onClick={() => onToggleEnable(sec)}
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
          onClick={() => onEdit(sec)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
          title="Edit Rail Details"
        >
          <Edit className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(sec.id, sec.title)}
          className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 cursor-pointer"
          title="Delete Rail"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const AdminHomepage: React.FC = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<HomepageSectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSec, setEditingSec] = useState<HomepageSectionConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedRailIds, setSelectedRailIds] = useState<string[]>([]);
  const [isBulkActioning, setIsBulkActioning] = useState(false);

  // Setup dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // allows click without accidental drag
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedList = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      order: idx + 1
    }));

    setSections(reorderedList);

    try {
      for (const item of reorderedList) {
        await saveHomepageSection(item);
      }
      await logAdminAction(
        user?.email || 'admin',
        'REORDER_RAILS_DND',
        'homepage',
        'all',
        'Visually reordered homepage rails via drag-and-drop'
      );
      setSaveNotice('Rail order re-indexed and saved in real-time.');
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err: any) {
      console.error('Save reordered rails error:', err);
      setSaveError(`Failed to save rail order: ${err.message || 'Firestore error'}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Permanently remove homepage section "${title}"?`)) return;
    try {
      await deleteHomepageSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      setSelectedRailIds((prev) => prev.filter((item) => item !== id));
      await logAdminAction(user?.email || 'admin', 'DELETE_RAIL', 'homepage', id, `Deleted homepage rail "${title}"`);
      setSaveNotice(`Rail "${title}" removed.`);
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err: any) {
      console.error('Delete rail error:', err);
      setSaveError(`Failed to delete rail: ${err.message || 'Firestore error'}`);
    }
  };

  // Bulk Actions
  const handleToggleSelect = (id: string) => {
    setSelectedRailIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRailIds.length === sections.length) {
      setSelectedRailIds([]);
    } else {
      setSelectedRailIds(sections.map((s) => s.id));
    }
  };

  const handleBulkEnable = async () => {
    if (selectedRailIds.length === 0) return;
    setIsBulkActioning(true);
    try {
      for (const id of selectedRailIds) {
        const target = sections.find((s) => s.id === id);
        if (target) {
          await saveHomepageSection({ ...target, enabled: true });
        }
      }
      setSections((prev) =>
        prev.map((s) => (selectedRailIds.includes(s.id) ? { ...s, enabled: true } : s))
      );
      setSaveNotice(`Enabled ${selectedRailIds.length} selected rails.`);
      setTimeout(() => setSaveNotice(null), 3000);
      await logAdminAction(
        user?.email || 'admin',
        'BULK_ENABLE_RAILS',
        'homepage',
        selectedRailIds.join(','),
        `Bulk enabled ${selectedRailIds.length} homepage rails`
      );
    } catch (err: any) {
      setSaveError(`Bulk enable failed: ${err.message}`);
    } finally {
      setIsBulkActioning(false);
    }
  };

  const handleBulkDisable = async () => {
    if (selectedRailIds.length === 0) return;
    setIsBulkActioning(true);
    try {
      for (const id of selectedRailIds) {
        const target = sections.find((s) => s.id === id);
        if (target) {
          await saveHomepageSection({ ...target, enabled: false });
        }
      }
      setSections((prev) =>
        prev.map((s) => (selectedRailIds.includes(s.id) ? { ...s, enabled: false } : s))
      );
      setSaveNotice(`Disabled ${selectedRailIds.length} selected rails.`);
      setTimeout(() => setSaveNotice(null), 3000);
      await logAdminAction(
        user?.email || 'admin',
        'BULK_DISABLE_RAILS',
        'homepage',
        selectedRailIds.join(','),
        `Bulk disabled ${selectedRailIds.length} homepage rails`
      );
    } catch (err: any) {
      setSaveError(`Bulk disable failed: ${err.message}`);
    } finally {
      setIsBulkActioning(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRailIds.length === 0) return;
    if (!window.confirm(`Permanently delete all ${selectedRailIds.length} selected rails?`)) return;

    setIsBulkActioning(true);
    try {
      for (const id of selectedRailIds) {
        await deleteHomepageSection(id);
      }
      setSections((prev) => prev.filter((s) => !selectedRailIds.includes(s.id)));
      setSaveNotice(`Deleted ${selectedRailIds.length} rails.`);
      setSelectedRailIds([]);
      setTimeout(() => setSaveNotice(null), 3000);
      await logAdminAction(
        user?.email || 'admin',
        'BULK_DELETE_RAILS',
        'homepage',
        selectedRailIds.join(','),
        `Bulk deleted ${selectedRailIds.length} homepage rails`
      );
    } catch (err: any) {
      setSaveError(`Bulk delete failed: ${err.message}`);
    } finally {
      setIsBulkActioning(false);
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
            Drag and drop rails to visually rearrange display order on the public cinema homepage.
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

      {/* Visual Reordering Guide */}
      {sections.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <MoveVertical className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Grab the handle on the left of any rail to drag and drop it into your preferred homepage position.</span>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {sections.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#12151E] border border-amber-500/20 text-xs shadow-lg">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sections.length > 0 && selectedRailIds.length === sections.length}
                onChange={handleSelectAll}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="font-bold text-white">Select All Rails</span>
            </label>
            {selectedRailIds.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                {selectedRailIds.length} Selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkEnable}
              disabled={selectedRailIds.length === 0 || isBulkActioning}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enable Selected</span>
            </button>

            <button
              onClick={handleBulkDisable}
              disabled={selectedRailIds.length === 0 || isBulkActioning}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
              <span>Disable Selected</span>
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={selectedRailIds.length === 0 || isBulkActioning}
              className="px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Sections List with dnd-kit Drag and Drop */}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sections.map((sec, idx) => (
                  <SortableRailItem
                    key={sec.id}
                    sec={sec}
                    index={idx}
                    isSelected={selectedRailIds.includes(sec.id)}
                    onToggleSelect={handleToggleSelect}
                    onToggleEnable={handleToggleEnable}
                    onEdit={(s) => setEditingSec({ ...s })}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
