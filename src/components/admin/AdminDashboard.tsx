import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MovieItem, UserProfile, HomepageSectionConfig, AuditLog, AdminStats, QualityBadge } from '../../types';
import { Logo } from '../common/Logo';
import { 
  BarChart3, Film, Tv, Users, Shield, Settings, Database, Plus, Search, 
  Trash2, Edit3, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, 
  ExternalLink, Sparkles, Check, X, Sliders, Globe, Eye, Flame, FileText,
  Clock, Play, Radio, Layers
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onSelectMovie?: (movie: MovieItem) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onSelectMovie }) => {
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tmdb' | 'catalog' | 'cms' | 'users' | 'reviews' | 'settings' | 'audit'>('overview');
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [customContent, setCustomContent] = useState<MovieItem[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSectionConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // TMDB Importer state
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbMediaType, setTmdbMediaType] = useState<'movie' | 'tv'>('movie');
  const [tmdbSearchResults, setTmdbSearchResults] = useState<MovieItem[]>([]);
  const [tmdbSearching, setTmdbSearching] = useState(false);
  const [selectedTmdbItem, setSelectedTmdbItem] = useState<MovieItem | null>(null);
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Catalog Filters
  const [catalogSearch, setCatalogSearch] = useState('');

  // Notification / feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminAuditLogs()
      ]);
      setStats(statsRes.stats);
      setHomepageSections(statsRes.homepageSections);
      setSettings(statsRes.settings);
      setUsers(usersRes);
      setAuditLogs(logsRes);

      // Load custom content from api
      const contentRes = await fetch('/api/admin/content').then(r => r.json());
      setCustomContent(contentRes.content || []);
    } catch (e) {
      console.error(e);
      showToast('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle TMDB live search
  const handleTmdbSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tmdbSearchQuery.trim()) return;

    setTmdbSearching(true);
    try {
      const res = await api.search(tmdbSearchQuery, tmdbMediaType);
      setTmdbSearchResults(res.items);
      setSelectedTmdbItem(res.items[0] || null);
    } catch (err: any) {
      showToast('TMDB search error: ' + err.message);
    } finally {
      setTmdbSearching(false);
    }
  };

  // 1-Click Import handler
  const handleImportTMDB = async (item: MovieItem) => {
    setImporting(true);
    setImportSuccess(null);
    try {
      const res = await api.importTMDB(
        item.tmdbId || item.id,
        item.mediaType === 'tv' ? 'tv' : 'movie',
        customStreamUrl || undefined,
        user?.email
      );
      setImportSuccess(`Successfully imported "${res.item.title}" into CINEXUS Catalog!`);
      showToast(`Imported "${res.item.title}" with 4K stream sources!`);
      loadAllData();
    } catch (err: any) {
      showToast('Import error: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // User Role Update
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole, user?.email || 'admin');
      showToast(`Updated user role to ${newRole}`);
      loadAllData();
    } catch (err: any) {
      showToast('Role update failed: ' + err.message);
    }
  };

  // Reorder / Toggle Homepage Sections
  const handleToggleSection = async (index: number) => {
    const updated = [...homepageSections];
    updated[index].enabled = !updated[index].enabled;
    setHomepageSections(updated);
    await api.updateHomepageSections(updated, user?.email || 'admin');
    showToast(`Updated section "${updated[index].title}" visibility`);
  };

  // Delete Custom Content
  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this title from the catalog?')) return;
    try {
      await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      setCustomContent(prev => prev.filter(c => c.id !== id));
      showToast('Title deleted from catalog');
      loadAllData();
    } catch (e: any) {
      showToast('Failed to delete content');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden animate-fadeIn">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900 border border-red-500/50 text-white shadow-2xl text-xs font-semibold animate-bounce">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            id="btn-admin-exit"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Site</span>
          </button>
          
          <div className="h-5 w-px bg-zinc-800" />
          
          <Logo size="sm" />
          
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/50 text-[10px] font-bold text-red-400 uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            <span>Studio Management Control</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400">TMDB API:</span>
            <span className="text-emerald-400 font-semibold">Active & Synced</span>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Refresh Admin Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
          </button>

          {/* Admin User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name}
              className="w-8 h-8 rounded-full border border-red-500/60 object-cover"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
              <div className="text-[10px] text-red-400 font-medium">{user?.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-56 sm:w-64 bg-zinc-950 border-r border-zinc-850 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-1.5">
            
            <button
              id="tab-admin-overview"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'overview' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Studio Overview</span>
            </button>

            <button
              id="tab-admin-tmdb"
              onClick={() => setActiveTab('tmdb')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'tmdb' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>TMDB 1-Click Import</span>
            </button>

            <button
              id="tab-admin-catalog"
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'catalog' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Movies & TV Catalog</span>
            </button>

            <button
              id="tab-admin-cms"
              onClick={() => setActiveTab('cms')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'cms' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Homepage CMS Rows</span>
            </button>

            <button
              id="tab-admin-users"
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'users' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users & Roles ({users.length})</span>
            </button>

            <button
              id="tab-admin-audit"
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'audit' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit Action Logs</span>
            </button>

            <button
              id="tab-admin-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Platform Settings</span>
            </button>

          </div>

          <div className="mt-auto p-4 border-t border-zinc-900">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300">Server Infrastructure</div>
              <div>Port: 3000 (0.0.0.0)</div>
              <div>Node/Express v5 + Vite</div>
              <div>Database: Memory + Sync</div>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-900/30">
          
          {/* ============================================================ */}
          {/* 1. OVERVIEW TAB */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Studio Dashboard Overview</h2>
                <p className="text-xs text-zinc-400 mt-1">Real-time cinema streaming telemetry, viewer metrics, and catalog status.</p>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold">Movies In Catalog</span>
                    <Film className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-2xl font-black text-white">{stats?.totalMovies || 1240}</div>
                  <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                    <span>+12 imported this week</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold">TV Series & Shows</span>
                    <Tv className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-white">{stats?.totalTVSeries || 480}</div>
                  <div className="text-[11px] text-zinc-500 font-medium mt-1">
                    3,850+ Total Episodes
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold">Live Streams Now</span>
                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-2xl font-black text-white">{stats?.activeStreamsNow || 42}</div>
                  <div className="text-[11px] text-emerald-400 font-medium mt-1">
                    Peak bandwidth 8.4 Gbps
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold">Total Watch Hours</span>
                    <Clock className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-white">{(stats?.totalWatchHours || 36400).toLocaleString()}h</div>
                  <div className="text-[11px] text-purple-400 font-medium mt-1">
                    4K HDR stream quality
                  </div>
                </div>
              </div>

              {/* Views Over Time & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Views Bar Visualizer */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Daily Streaming Traffic (Views)</h3>
                      <p className="text-xs text-zinc-400">Aggregated client playback sessions this week</p>
                    </div>
                    <span className="text-xs font-semibold text-red-400 bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-800/40">
                      Live Telemetry
                    </span>
                  </div>

                  <div className="h-44 flex items-end gap-3 pt-6 pb-2 border-b border-zinc-800">
                    {stats?.viewsOverTime?.map((item, idx) => {
                      const heightPercent = Math.min(100, Math.max(15, (item.views / 4500) * 100));
                      return (
                        <div key={item.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.views}
                          </div>
                          <div 
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-gradient-to-t from-red-700 to-red-500 rounded-t-md group-hover:from-red-600 group-hover:to-red-400 transition-all shadow-md"
                          />
                          <div className="text-[10px] font-semibold text-zinc-400">
                            {item.date.slice(-5)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Studio Actions */}
                <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Quick Studio Operations</h3>
                    <p className="text-xs text-zinc-400 mb-4">Instant administrative actions</p>
                    
                    <div className="space-y-2.5">
                      <button
                        onClick={() => setActiveTab('tmdb')}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 text-xs font-semibold text-white transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-red-400" />
                          <span>1-Click TMDB Importer</span>
                        </div>
                        <Plus className="w-4 h-4 text-red-400" />
                      </button>

                      <button
                        onClick={() => setActiveTab('cms')}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-800/70 hover:bg-zinc-700/70 border border-zinc-700 text-xs font-semibold text-white transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sliders className="w-4 h-4 text-zinc-400" />
                          <span>Customize Homepage Rails</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      </button>

                      <button
                        onClick={() => setActiveTab('users')}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-800/70 hover:bg-zinc-700/70 border border-zinc-700 text-xs font-semibold text-white transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-zinc-400" />
                          <span>Manage User Access ({users.length})</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                    <span>Active Super Admin:</span>
                    <span className="font-semibold text-red-400">{user?.name}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. TMDB 1-CLICK IMPORTER TAB */}
          {/* ============================================================ */}
          {activeTab === 'tmdb' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-500" />
                  <h2 className="text-2xl font-bold text-white tracking-tight">TMDB 1-Click Catalog Importer</h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Instantly fetch authentic 4K metadata, backdrops, posters, cast, and trailers from The Movie Database (TMDB) and publish directly to CINEXUS.
                </p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleTmdbSearch} className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTmdbMediaType('movie')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        tmdbMediaType === 'movie' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Movies
                    </button>
                    <button
                      type="button"
                      onClick={() => setTmdbMediaType('tv')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        tmdbMediaType === 'tv' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      TV Series
                    </button>
                  </div>

                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={tmdbSearchQuery}
                      onChange={(e) => setTmdbSearchQuery(e.target.value)}
                      placeholder="Search TMDB (e.g. Dune, Oppenheimer, Arcane, Inception)..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={tmdbSearching || !tmdbSearchQuery.trim()}
                    className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {tmdbSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Search TMDB</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span>Quick Presets:</span>
                  {['Dune: Part Two', 'Gladiator II', 'Deadpool & Wolverine', 'Arcane', 'The Last of Us'].map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setTmdbSearchQuery(term);
                        setTmdbSearching(true);
                        api.search(term, tmdbMediaType).then(res => {
                          setTmdbSearchResults(res.items);
                          setSelectedTmdbItem(res.items[0] || null);
                          setTmdbSearching(false);
                        });
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </form>

              {/* Import Feedback */}
              {importSuccess && (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center gap-3 text-xs text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{importSuccess}</span>
                </div>
              )}

              {/* TMDB Results Grid & Preview */}
              {tmdbSearchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Results List */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    <div className="text-xs font-semibold text-zinc-400 mb-2">Search Results ({tmdbSearchResults.length})</div>
                    {tmdbSearchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedTmdbItem(item)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          selectedTmdbItem?.id === item.id 
                            ? 'bg-red-950/40 border-red-700/80 shadow-md' 
                            : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        <img
                          src={item.posterPath || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'}
                          alt={item.title}
                          className="w-10 h-14 object-cover rounded-lg shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {item.releaseYear} • ★ {item.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Item Preview & Import Form */}
                  {selectedTmdbItem && (
                    <div className="md:col-span-2 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
                      <div className="relative h-44 rounded-xl overflow-hidden bg-zinc-950">
                        <img
                          src={selectedTmdbItem.backdropPath || selectedTmdbItem.posterPath || ''}
                          alt={selectedTmdbItem.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-600 text-white mr-2">
                              {selectedTmdbItem.mediaType.toUpperCase()}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-1">{selectedTmdbItem.title}</h3>
                          </div>
                          <span className="text-xs font-bold text-amber-400 bg-zinc-950/80 px-2 py-1 rounded-lg border border-zinc-800">
                            ★ {selectedTmdbItem.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                        {selectedTmdbItem.overview}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                        <div><span className="text-zinc-500">Release Year:</span> {selectedTmdbItem.releaseYear}</div>
                        <div><span className="text-zinc-500">Quality:</span> 4K Ultra HD HDR</div>
                        <div><span className="text-zinc-500">Genres:</span> {selectedTmdbItem.genres?.join(', ') || 'Cinema'}</div>
                        <div><span className="text-zinc-500">TMDB ID:</span> {selectedTmdbItem.tmdbId}</div>
                      </div>

                      {/* Custom Stream Source Attachment */}
                      <div className="pt-3 border-t border-zinc-800">
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Authorized Video Stream Source (MP4 / HLS / CDN URL)
                        </label>
                        <input
                          type="text"
                          value={customStreamUrl}
                          onChange={(e) => setCustomStreamUrl(e.target.value)}
                          placeholder="Default: Google Cloud / Mux 4K Master stream will be attached automatically"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <button
                        onClick={() => handleImportTMDB(selectedTmdbItem)}
                        disabled={importing}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {importing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>Publish "{selectedTmdbItem.title}" to CINEXUS Catalog</span>
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* 3. CATALOG MANAGEMENT TAB */}
          {/* ============================================================ */}
          {activeTab === 'catalog' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Movies & TV Series Catalog</h2>
                  <p className="text-xs text-zinc-400 mt-1">Manage all custom imported titles, stream manifests, and subtitles.</p>
                </div>
                <button
                  onClick={() => setActiveTab('tmdb')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Import New Title</span>
                </button>
              </div>

              {/* Search in Catalog */}
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Filter catalog by title, genre, year..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Catalog Table */}
              <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
                      <tr>
                        <th className="p-3.5">Title & Poster</th>
                        <th className="p-3.5">Type</th>
                        <th className="p-3.5">Year</th>
                        <th className="p-3.5">Rating</th>
                        <th className="p-3.5">Quality</th>
                        <th className="p-3.5">Streams</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {customContent.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-500">
                            No custom titles created yet. Use the 1-Click TMDB Importer to add titles.
                          </td>
                        </tr>
                      ) : (
                        customContent
                          .filter(c => c.title.toLowerCase().includes(catalogSearch.toLowerCase()))
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors">
                              <td className="p-3.5 flex items-center gap-3">
                                <img
                                  src={item.posterPath || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'}
                                  alt={item.title}
                                  className="w-8 h-12 object-cover rounded shadow"
                                />
                                <div>
                                  <div className="font-bold text-white">{item.title}</div>
                                  <div className="text-[10px] text-zinc-500 truncate max-w-xs">{item.tagline}</div>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                  {item.mediaType}
                                </span>
                              </td>
                              <td className="p-3.5 text-zinc-300">{item.releaseYear}</td>
                              <td className="p-3.5 text-amber-400 font-semibold">★ {item.rating.toFixed(1)}</td>
                              <td className="p-3.5">
                                <span className="text-[10px] font-semibold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
                                  {item.quality}
                                </span>
                              </td>
                              <td className="p-3.5 text-zinc-400">
                                {item.sources?.length || 2} Sources (4K/HLS)
                              </td>
                              <td className="p-3.5 text-right space-x-2">
                                <button
                                  onClick={() => handleDeleteContent(item.id)}
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
                                  title="Delete from Catalog"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. HOMEPAGE CMS RAILS TAB */}
          {/* ============================================================ */}
          {activeTab === 'cms' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Homepage CMS Rails & Sections</h2>
                <p className="text-xs text-zinc-400 mt-1">Configure layout order, titles, and visibility for content rows on the main streaming page.</p>
              </div>

              <div className="space-y-3">
                {homepageSections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{sec.title}</span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {sec.type}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">{sec.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleSection(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          sec.enabled 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50' 
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                      >
                        {sec.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{sec.enabled ? 'Enabled' : 'Hidden'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. USERS & ROLES TAB */}
          {/* ============================================================ */}
          {activeTab === 'users' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Registered Users & Role Management</h2>
                <p className="text-xs text-zinc-400 mt-1">Review authenticated accounts, manage super admin privileges, and audit permissions.</p>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Current Role</th>
                      <th className="p-3.5">Created Date</th>
                      <th className="p-3.5 text-right">Assign Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3.5 flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                          />
                          <span className="font-semibold text-white">{u.name}</span>
                        </td>
                        <td className="p-3.5 text-zinc-300 font-mono">{u.email}</td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                            u.role === 'SUPER_ADMIN' 
                              ? 'bg-red-950 text-red-300 border border-red-800' 
                              : u.role === 'ADMIN'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-red-500"
                          >
                            <option value="USER">USER</option>
                            <option value="EDITOR">EDITOR</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 6. AUDIT ACTION LOGS */}
          {/* ============================================================ */}
          {activeTab === 'audit' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">System Audit & Activity Logs</h2>
                <p className="text-xs text-zinc-400 mt-1">Immutable record of all administrative logins, TMDB imports, and catalog modifications.</p>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Actor</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/40">
                        <td className="p-3.5 text-zinc-500">
                          {new Date(log.timestamp).toLocaleTimeString()} {new Date(log.timestamp).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-red-400 font-semibold">{log.adminEmail}</td>
                        <td className="p-3.5 text-zinc-300">{log.action}</td>
                        <td className="p-3.5 text-zinc-400">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 7. SETTINGS TAB */}
          {/* ============================================================ */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">CINEXUS Platform Settings</h2>
                <p className="text-xs text-zinc-400 mt-1">Global streaming parameters and API configurations.</p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Platform Brand Name</label>
                  <input
                    type="text"
                    value={settings.siteName || 'CINEXUS'}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Default Master Quality Preset</label>
                  <select
                    value={settings.defaultQuality || '4K Ultra HD'}
                    onChange={(e) => setSettings({ ...settings, defaultQuality: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="4K Ultra HD">4K Ultra HD (HEVC 2160p)</option>
                    <option value="1080p FHD">1080p Full HD</option>
                    <option value="Auto">Auto Adaptive Bitrate (HLS)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <div>
                    <div className="text-xs font-bold text-white">Maintenance Mode</div>
                    <div className="text-[11px] text-zinc-400">Temporarily show maintenance notice to public visitors</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                  />
                </div>

                <button
                  onClick={async () => {
                    await api.updateSettings(settings, user?.email || 'admin');
                    showToast('Platform settings saved successfully');
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Save Platform Settings
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};
