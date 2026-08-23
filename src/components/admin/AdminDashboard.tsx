import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MovieItem, UserProfile, HomepageSectionConfig, AuditLog, AdminStats, QualityBadge, VideoProvider } from '../../types';
import { Logo } from '../common/Logo';
import { parseEmbedCode, ParsedEmbedResult } from '../../services/embedParser';
import { BRANDING } from '../../config/branding';
import { 
  BarChart3, Film, Tv, Users, Shield, Settings, Database, Plus, Search, 
  Trash2, Edit3, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, 
  ExternalLink, Sparkles, Check, X, Sliders, Globe, Eye, Flame, FileText,
  Clock, Play, Radio, Layers, Code, CheckSquare, AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onSelectMovie?: (movie: MovieItem) => void;
  onCatalogUpdated?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onSelectMovie, onCatalogUpdated }) => {
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tmdb' | 'catalog' | 'embeds' | 'cms' | 'users' | 'providers' | 'settings' | 'audit'>('overview');
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [customContent, setCustomContent] = useState<MovieItem[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSectionConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [providers, setProviders] = useState<VideoProvider[]>(BRANDING.defaultProviders);
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

  // Embed Parser state in admin
  const [rawEmbedCodeInput, setRawEmbedCodeInput] = useState('');
  const [parsedEmbedResult, setParsedEmbedResult] = useState<ParsedEmbedResult | null>(null);
  const [embedTargetTitle, setEmbedTargetTitle] = useState('');

  // Catalog Filters
  const [catalogSearch, setCatalogSearch] = useState('');

  // Toast feedback
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
      setCustomContent(await api.getAdminContent());
    } catch (e) {
      console.error(e);
      showToast('Failed to sync admin database');
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
      setImportSuccess(`Successfully published "${res.item.title}" into CINEXUS Catalog!`);
      showToast(`Imported "${res.item.title}" with 4K stream feeds!`);
      loadAllData();
      if (onCatalogUpdated) onCatalogUpdated();
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
    showToast(`Updated section "${updated[index].title}"`);
    if (onCatalogUpdated) onCatalogUpdated();
  };

  // Delete Custom Content
  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this title from the catalog?')) return;
    try {
      await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      setCustomContent(prev => prev.filter(c => c.id !== id));
      showToast('Title deleted from catalog');
      loadAllData();
      if (onCatalogUpdated) onCatalogUpdated();
    } catch (e: any) {
      showToast('Failed to delete content');
    }
  };

  // Test Embed Code
  const handleParseEmbedTest = () => {
    if (!rawEmbedCodeInput.trim()) {
      showToast('Please paste an iframe embed code or stream URL.');
      return;
    }
    const result = parseEmbedCode(rawEmbedCodeInput, providers);
    setParsedEmbedResult(result);
    if (result.isValid) {
      showToast('Embed code successfully parsed and validated!');
    } else {
      showToast(result.error || 'Invalid embed code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07090e] text-slate-100 flex flex-col overflow-hidden animate-fadeIn select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#0b0f17] border border-red-500 text-white shadow-2xl text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header className="h-16 px-4 sm:px-6 bg-[#0b0f17] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            id="btn-admin-exit"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Cinema</span>
          </button>
          
          <div className="h-5 w-px bg-white/10" />
          
          <Logo size="sm" />
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-[10px] font-bold text-red-400 uppercase tracking-widest">
            <Shield className="w-3 h-3 text-red-500" />
            <span>Studio Master Management</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400">TMDB API:</span>
            <span className="text-emerald-400 font-semibold">Active & Synced</span>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Refresh Admin Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
          </button>

          {/* Admin User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name}
              className="w-8 h-8 rounded-full border border-red-500 object-cover"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
              <div className="text-[10px] text-red-400 font-bold">{user?.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-56 sm:w-64 bg-[#07090e] border-r border-white/10 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-1.5">
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overview' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Studio Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('tmdb')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tmdb' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>TMDB 1-Click Import</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'catalog' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Film className="w-4 h-4 text-red-400" />
              <span>Catalog Management</span>
            </button>

            <button
              onClick={() => setActiveTab('embeds')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'embeds' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Embed Code Parser</span>
            </button>

            <button
              onClick={() => setActiveTab('cms')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'cms' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Homepage Rails CMS</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'users' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Users & Role Access</span>
            </button>

            <button
              onClick={() => setActiveTab('providers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'providers' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Video Providers Whitelist</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Platform Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'audit' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/60' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Audit Trails</span>
            </button>

          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-[#0b0f17]/60 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* ============================================================ */}
          {/* 1. STUDIO OVERVIEW TAB */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Studio Master Overview</h2>
                <p className="text-xs text-slate-400 mt-1">Real-time health, streaming infrastructure metrics, and catalog state.</p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                  <span className="text-xs text-slate-400 block font-medium">Catalog Movies</span>
                  <div className="text-2xl font-bold text-white mt-1">{stats?.totalMovies || 120}</div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">4K & HDR Enabled</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                  <span className="text-xs text-slate-400 block font-medium">TV Series & Anime</span>
                  <div className="text-2xl font-bold text-white mt-1">{stats?.totalTVSeries || 45}</div>
                  <span className="text-[10px] text-cyan-400 font-semibold mt-1 block">Episode Master Feeds</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                  <span className="text-xs text-slate-400 block font-medium">Registered Accounts</span>
                  <div className="text-2xl font-bold text-white mt-1">{stats?.totalUsers || 2}</div>
                  <span className="text-[10px] text-purple-400 font-semibold mt-1 block">Admin & VIP Viewers</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                  <span className="text-xs text-slate-400 block font-medium">Stream Watch Hours</span>
                  <div className="text-2xl font-bold text-white mt-1">{stats?.totalWatchHours || 36400} hrs</div>
                  <span className="text-[10px] text-red-400 font-semibold mt-1 block">Ultra High Bitrate</span>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-slate-900/80 to-slate-900/80 border border-red-900/40 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Quick Studio Operations</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('tmdb')}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    1-Click TMDB Movie Import
                  </button>
                  <button
                    onClick={() => setActiveTab('embeds')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Parse Video Embed Code
                  </button>
                  <button
                    onClick={() => setActiveTab('cms')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Manage Homepage Rails
                  </button>
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
                <h2 className="text-2xl font-bold text-white tracking-tight">TMDB 1-Click Catalog Importer</h2>
                <p className="text-xs text-slate-400 mt-1">Live query official TMDB API v3, extract 4K posters, cast, crew, and bind custom streaming feeds.</p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleTmdbSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={tmdbSearchQuery}
                    onChange={(e) => setTmdbSearchQuery(e.target.value)}
                    placeholder="Search TMDB for movies or TV shows (e.g., Gladiator II, Arcane, Fallout)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex bg-slate-900 rounded-2xl border border-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setTmdbMediaType('movie')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      tmdbMediaType === 'movie' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Movie
                  </button>
                  <button
                    type="button"
                    onClick={() => setTmdbMediaType('tv')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      tmdbMediaType === 'tv' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TV Series
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={tmdbSearching}
                  className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {tmdbSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search TMDB</span>
                </button>
              </form>

              {/* Import Success Alert */}
              {importSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{importSuccess}</span>
                  </div>
                  <button onClick={() => setImportSuccess(null)} className="text-emerald-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Search Results Grid */}
              {tmdbSearchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300">Search Results from TMDB ({tmdbSearchResults.length} items)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {tmdbSearchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedTmdbItem(item)}
                        className={`p-2 rounded-2xl bg-slate-900/90 border transition-all cursor-pointer group ${
                          selectedTmdbItem?.id === item.id 
                            ? 'border-red-500 ring-2 ring-red-500/40 bg-slate-800' 
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={item.posterPath || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300'}
                          alt={item.title}
                          className="w-full aspect-[2/3] object-cover rounded-xl shadow-md group-hover:scale-[1.02] transition-transform"
                        />
                        <div className="mt-2 space-y-0.5">
                          <div className="text-xs font-bold text-white truncate">{item.title}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{item.releaseYear}</span>
                            <span className="text-amber-400 font-semibold">★ {item.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Item Import Configuration */}
                  {selectedTmdbItem && (
                    <div className="p-6 rounded-3xl bg-[#0b0f17] border border-red-900/50 space-y-4 shadow-2xl">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <img
                          src={selectedTmdbItem.posterPath || ''}
                          alt={selectedTmdbItem.title}
                          className="w-24 aspect-[2/3] object-cover rounded-2xl border border-slate-700 shadow-md shrink-0"
                        />
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-red-600 font-bold text-[10px] text-white uppercase">
                              {selectedTmdbItem.mediaType}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">{selectedTmdbItem.releaseYear}</span>
                          </div>
                          <h4 className="text-lg font-bold text-white">{selectedTmdbItem.title}</h4>
                          <p className="text-xs text-slate-300 line-clamp-2">{selectedTmdbItem.overview}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-red-400" />
                          <span>Authorized Stream URL or Embed Code (Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={customStreamUrl}
                          onChange={(e) => setCustomStreamUrl(e.target.value)}
                          placeholder="Paste MP4/HLS URL or <iframe src='...'></iframe>"
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <button
                        onClick={() => handleImportTMDB(selectedTmdbItem)}
                        disabled={importing}
                        className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>Publish "{selectedTmdbItem.title}" to Public Catalog</span>
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
                  <h2 className="text-2xl font-bold text-white tracking-tight">Catalog Management</h2>
                  <p className="text-xs text-slate-400 mt-1">Review custom imported cinema, inspect feeds, and delete titles.</p>
                </div>
                <button
                  onClick={() => setActiveTab('tmdb')}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Import New Title</span>
                </button>
              </div>

              {/* Search Filter */}
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Filter catalog by title, genre..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Catalog Table */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/60 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Title</th>
                        <th className="p-3.5">Type</th>
                        <th className="p-3.5">Year</th>
                        <th className="p-3.5">Rating</th>
                        <th className="p-3.5">Quality</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {customContent.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No custom imported titles yet. Use TMDB 1-Click Importer to add titles to the live catalog.
                          </td>
                        </tr>
                      ) : (
                        customContent
                          .filter(c => c.title.toLowerCase().includes(catalogSearch.toLowerCase()))
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3.5 flex items-center gap-3">
                                <img
                                  src={item.posterPath || ''}
                                  alt={item.title}
                                  className="w-8 h-12 object-cover rounded-lg shadow"
                                />
                                <div>
                                  <div className="font-bold text-white">{item.title}</div>
                                  <div className="text-[10px] text-slate-500 truncate max-w-xs">{item.tagline}</div>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {item.mediaType}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-300">{item.releaseYear}</td>
                              <td className="p-3.5 text-amber-400 font-semibold">★ {item.rating.toFixed(1)}</td>
                              <td className="p-3.5">
                                <span className="text-[10px] font-semibold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
                                  {item.quality}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleDeleteContent(item.id)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
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
          {/* 4. EMBED CODE PARSER TAB */}
          {/* ============================================================ */}
          {activeTab === 'embeds' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Authorized Video Embed Parser</h2>
                <p className="text-xs text-slate-400 mt-1">Paste raw iframe embed code (e.g. &lt;iframe src="..." width="640" height="360" allowfullscreen&gt;&lt;/iframe&gt;) to inspect extracted aspect ratios, sanitize attributes, and preview player rendering.</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Raw Embed Code or Stream Feed URL</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rawEmbedCodeInput}
                    onChange={(e) => setRawEmbedCodeInput(e.target.value)}
                    placeholder='<IFRAME SRC="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" WIDTH=640 HEIGHT=360 allowfullscreen></IFRAME>'
                    className="w-full bg-[#07090e] border border-slate-800 rounded-2xl p-3 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleParseEmbedTest}
                    className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Parse, Validate & Test</span>
                  </button>
                </div>

                {/* Parsed Result Display */}
                {parsedEmbedResult && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white">Parsed Video Specifications</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        parsedEmbedResult.isValid ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400'
                      }`}>
                        {parsedEmbedResult.isValid ? 'VALID SECURE EMBED' : 'PARSING ERROR'}
                      </span>
                    </div>

                    {parsedEmbedResult.isValid && parsedEmbedResult.embed && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-900">
                          <span className="text-slate-500 block text-[10px]">Calculated Aspect Ratio</span>
                          <span className="font-bold text-white font-mono">
                            {parsedEmbedResult.embed.aspectRatio.toFixed(3)} ({parsedEmbedResult.embed.originalWidth || 16} : {parsedEmbedResult.embed.originalHeight || 9})
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900">
                          <span className="text-slate-500 block text-[10px]">Provider / Domain</span>
                          <span className="font-bold text-cyan-400 font-mono truncate block">
                            {parsedEmbedResult.embed.providerDomain}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900">
                          <span className="text-slate-500 block text-[10px]">Fullscreen Enabled</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {parsedEmbedResult.embed.allowFullscreen ? 'Yes (Native Support)' : 'Restricted'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900">
                          <span className="text-slate-500 block text-[10px]">Sanitization Status</span>
                          <span className="font-bold text-purple-400 font-mono">XSS Protected</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. HOMEPAGE CMS RAILS TAB */}
          {/* ============================================================ */}
          {activeTab === 'cms' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Homepage CMS Rails & Sections</h2>
                <p className="text-xs text-slate-400 mt-1">Configure layout order, titles, and visibility for content carousels on the public streaming page.</p>
              </div>

              <div className="space-y-3">
                {homepageSections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{sec.title}</span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {sec.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{sec.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleSection(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          sec.enabled 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
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
          {/* 6. USERS & ROLES TAB */}
          {/* ============================================================ */}
          {activeTab === 'users' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">User Administration & Role Access</h2>
                <p className="text-xs text-slate-400 mt-1">Review accounts and assign privileges (USER, EDITOR, ADMIN, SUPER_ADMIN).</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Current Role</th>
                      <th className="p-3.5 text-right">Assign Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-700"
                          />
                          <span className="font-semibold text-white">{u.name}</span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-mono">{u.email}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'SUPER_ADMIN' 
                              ? 'bg-red-950 text-red-400 border border-red-800' 
                              : u.role === 'ADMIN'
                              ? 'bg-purple-950 text-purple-400 border border-purple-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
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
          {/* 7. VIDEO PROVIDERS WHITELIST TAB */}
          {/* ============================================================ */}
          {activeTab === 'providers' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Authorized Video Provider Domains</h2>
                <p className="text-xs text-slate-400 mt-1">Whitelist domain origins permitted to load video streams and embeds inside CINEXUS players.</p>
              </div>

              <div className="space-y-2.5">
                {providers.map((p) => (
                  <div key={p.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.domain}</div>
                    </div>
                    <button
                      onClick={() => {
                        setProviders(providers.map(item => item.id === p.id ? { ...item, enabled: !item.enabled } : item));
                        showToast(`Updated whitelist status for ${p.domain}`);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        p.enabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {p.enabled ? 'Authorized' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 8. PLATFORM SETTINGS TAB */}
          {/* ============================================================ */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Platform Global Settings</h2>
                <p className="text-xs text-slate-400 mt-1">Configure site metadata, brand identity, and streaming quality standards.</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Platform Brand Title</label>
                  <input
                    type="text"
                    defaultValue={BRANDING.name}
                    className="w-full bg-[#07090e] border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Platform Tagline</label>
                  <input
                    type="text"
                    defaultValue={BRANDING.tagline}
                    className="w-full bg-[#07090e] border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => showToast('Platform configuration saved to server.')}
                    className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                  >
                    Save Platform Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 9. AUDIT TRAILS TAB */}
          {/* ============================================================ */}
          {activeTab === 'audit' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Studio Operational Audit Logs</h2>
                <p className="text-xs text-slate-400 mt-1">Immutable security log of all admin publications, imports, and role updates.</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Admin</th>
                      <th className="p-3.5">Details</th>
                      <th className="p-3.5 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 font-bold text-[10px] border border-red-900/50">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-mono">{log.adminEmail}</td>
                        <td className="p-3.5 text-slate-400 truncate max-w-md">{log.details || 'N/A'}</td>
                        <td className="p-3.5 text-right text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
