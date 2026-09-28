import React, { useState, useEffect } from 'react';
import {
  Film,
  Tv,
  Radio,
  Image,
  Layers,
  Database,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getMovies, getSeries, saveMovie, deleteMovie } from '../../services/firestore';
import { getMediaFiles } from '../../services/storage';
import { MovieItem, SeriesItem } from '../../types';
import { INITIAL_CINEMA_CATALOG } from '../../data/defaultCatalog';

interface AdminDashboardProps {
  onNavigate: (tab: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movs, sers, media] = await Promise.all([getMovies(), getSeries(), getMediaFiles()]);
      setMovies(movs);
      setSeries(sers);
      setMediaCount(media.length);
    } catch (e) {
      console.warn('Dashboard load note:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalEpisodes = series.reduce((acc, s) => acc + (s.episodes?.length || s.episodesCount || 0), 0);
  const publishedCount = [...movies, ...series].filter((i) => i.isPublished !== false).length;
  const draftCount = [...movies, ...series].filter((i) => i.isPublished === false).length;

  // Import / Seed Default Curated Cinema Library
  const handleSeedDefaultLibrary = async () => {
    if (!window.confirm('Import default curated 4K cinema master titles into Firestore?')) return;
    setActionNotice('Importing reference titles...');
    try {
      for (const item of INITIAL_CINEMA_CATALOG) {
        await saveMovie(item);
      }
      setActionNotice('Curated library imported successfully into Firestore!');
      await loadData();
    } catch (e: any) {
      setActionNotice(`Import failed: ${e.message}`);
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Bulk Clean Demo Data
  const handleCleanDemoData = async () => {
    const demoIds = ['dune-part-two', 'oppenheimer', 'interstellar', 'arcane', 'shogun'];
    if (!window.confirm(`Permanently remove ${demoIds.length} seeded reference titles from Firestore?`)) return;
    setActionNotice('Removing demo records...');
    try {
      for (const id of demoIds) {
        await deleteMovie(id);
      }
      setActionNotice('Demo records removed permanently.');
      await loadData();
    } catch (e: any) {
      setActionNotice(`Clean failed: ${e.message}`);
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Studio Overview & Metrics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Realtime database telemetry connected to Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-red-600/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-red-500" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Real Statistics Grid (NO MOCK PRODUCTION DATA) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Feature Films</span>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">{movies.length}</div>
          <span className="text-[10px] text-zinc-500">Live in Firestore</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">TV & Anime</span>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">{series.length}</div>
          <span className="text-[10px] text-zinc-500">Series catalog</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Episodes</span>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">{totalEpisodes}</div>
          <span className="text-[10px] text-zinc-500">Episodic records</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Published</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">{publishedCount}</div>
          <span className="text-[10px] text-zinc-500">Publicly visible</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Draft Titles</span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">{draftCount}</div>
          <span className="text-[10px] text-zinc-500">Unpublished</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Media Assets</span>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">{mediaCount}</div>
          <span className="text-[10px] text-zinc-500">Storage objects</span>
        </div>
      </div>

      {/* Quick Launch & Seed Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quick Creation */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Studio Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('movies')}
              className="p-3.5 rounded-xl bg-white/5 hover:bg-red-600/10 hover:border-red-500/30 border border-white/10 text-left transition-colors"
            >
              <Plus className="w-5 h-5 text-red-500 mb-2" />
              <div className="text-xs font-semibold text-white">Create Movie</div>
              <div className="text-[10px] text-zinc-400">Add metadata & sources</div>
            </button>

            <button
              onClick={() => onNavigate('series')}
              className="p-3.5 rounded-xl bg-white/5 hover:bg-red-600/10 hover:border-red-500/30 border border-white/10 text-left transition-colors"
            >
              <Tv className="w-5 h-5 text-red-500 mb-2" />
              <div className="text-xs font-semibold text-white">Create Series</div>
              <div className="text-[10px] text-zinc-400">Add seasons & episodes</div>
            </button>

            <button
              onClick={() => onNavigate('media')}
              className="p-3.5 rounded-xl bg-white/5 hover:bg-red-600/10 hover:border-red-500/30 border border-white/10 text-left transition-colors"
            >
              <Image className="w-5 h-5 text-amber-500 mb-2" />
              <div className="text-xs font-semibold text-white">Upload Media</div>
              <div className="text-[10px] text-zinc-400">Posters, backdrops, streams</div>
            </button>

            <button
              onClick={() => onNavigate('homepage')}
              className="p-3.5 rounded-xl bg-white/5 hover:bg-red-600/10 hover:border-red-500/30 border border-white/10 text-left transition-colors"
            >
              <Layers className="w-5 h-5 text-blue-500 mb-2" />
              <div className="text-xs font-semibold text-white">Homepage Rails</div>
              <div className="text-[10px] text-zinc-400">Reorder & customize rows</div>
            </button>
          </div>
        </div>

        {/* Content Management & Demo Cleanup */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Demo / Seed Content Controls</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Manage reference catalog records safely. Seeded items are stored directly in Cloud Firestore and can be edited, published, or permanently deleted.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSeedDefaultLibrary}
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white border border-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Import Curated Library</span>
            </button>

            <button
              onClick={handleCleanDemoData}
              className="px-4 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-xs font-semibold text-red-400 border border-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Demo Records</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
