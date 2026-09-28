import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Palette, 
  Download, 
  Upload, 
  RotateCcw,
  Sparkles,
  Eye,
  Tv
} from 'lucide-react';
import { getSiteSettings, saveSiteSettings, logAdminAction, DEFAULT_SITE_SETTINGS, DEFAULT_THEME } from '../../services/firestore';
import { SiteSettings, ThemeConfig } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BRANDING } from '../../config/branding';

const PRESET_THEMES: { name: string; theme: ThemeConfig }[] = [
  {
    name: 'Cinexus Obsidian Red (Default)',
    theme: {
      id: 'cinexus-red',
      name: 'Cinexus Obsidian Red',
      primaryAccent: '#e50914',
      secondaryAccent: '#ff2a3b',
      backgroundColor: '#07090e',
      surfaceColor: '#0f141f',
      textColor: '#f8fafc',
      textMutedColor: '#94a3b8',
      borderRadius: 'lg',
      motionIntensity: 'standard',
      mode: 'dark'
    }
  },
  {
    name: 'IMAX Sapphire Neon',
    theme: {
      id: 'imax-sapphire',
      name: 'IMAX Sapphire Neon',
      primaryAccent: '#0066ff',
      secondaryAccent: '#00d2ff',
      backgroundColor: '#050811',
      surfaceColor: '#0c1322',
      textColor: '#f0f6fc',
      textMutedColor: '#8b949e',
      borderRadius: 'lg',
      motionIntensity: 'standard',
      mode: 'dark'
    }
  },
  {
    name: 'Cannes Velvet Gold',
    theme: {
      id: 'cannes-gold',
      name: 'Cannes Velvet Gold',
      primaryAccent: '#d4af37',
      secondaryAccent: '#f5c518',
      backgroundColor: '#0a0a0c',
      surfaceColor: '#141418',
      textColor: '#fefefe',
      textMutedColor: '#a1a1aa',
      borderRadius: 'md',
      motionIntensity: 'subtle',
      mode: 'dark'
    }
  },
  {
    name: 'Cyberpunk Matrix Emerald',
    theme: {
      id: 'matrix-emerald',
      name: 'Cyberpunk Matrix Emerald',
      primaryAccent: '#059669',
      secondaryAccent: '#10b981',
      backgroundColor: '#040d0a',
      surfaceColor: '#0a1a14',
      textColor: '#f0fdf4',
      textMutedColor: '#6ee7b7',
      borderRadius: 'lg',
      motionIntensity: 'standard',
      mode: 'dark'
    }
  }
];

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'theme' | 'security'>('general');
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSiteSettings().then((s) => {
      setSettings(s);
      if (s.theme) {
        setTheme(s.theme);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setImportError(null);
    try {
      const mergedSettings: SiteSettings = {
        ...settings,
        theme
      };
      await saveSiteSettings(mergedSettings);
      await logAdminAction(user?.email || 'admin', 'UPDATE_SETTINGS', 'settings', 'global_config', 'Updated platform & theme configuration');
      
      // Apply theme CSS variables dynamically
      applyThemeToDocument(theme);
      
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3500);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Dynamically inject CSS variables into document root
  const applyThemeToDocument = (t: ThemeConfig) => {
    const root = document.documentElement;
    root.style.setProperty('--cinexus-primary', t.primaryAccent);
    root.style.setProperty('--cinexus-secondary', t.secondaryAccent);
    root.style.setProperty('--cinexus-bg', t.backgroundColor);
    root.style.setProperty('--cinexus-surface', t.surfaceColor);
    root.style.setProperty('--cinexus-text', t.textColor);
  };

  // Safe Theme Export (Download JSON file)
  const handleExportTheme = () => {
    const exportData = JSON.stringify(theme, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinexus-theme-${theme.id || 'preset'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Safe Theme Import (Validate strictly without any code execution)
  const handleImportThemeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Strictly parse as JSON
        const parsed = JSON.parse(content);

        // Security Validation: Validate allowed keys and hex/safe color patterns
        const colorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
        if (!parsed.primaryAccent || !colorRegex.test(parsed.primaryAccent)) {
          throw new Error('Invalid or missing primaryAccent color (must be valid hex e.g. #e50914).');
        }
        if (!parsed.backgroundColor || !colorRegex.test(parsed.backgroundColor)) {
          throw new Error('Invalid or missing backgroundColor (must be valid hex e.g. #07090e).');
        }

        const safeTheme: ThemeConfig = {
          id: `theme_${Date.now()}`,
          name: String(parsed.name || 'Imported Theme').slice(0, 50),
          primaryAccent: parsed.primaryAccent,
          secondaryAccent: colorRegex.test(parsed.secondaryAccent) ? parsed.secondaryAccent : '#ff2a3b',
          backgroundColor: parsed.backgroundColor,
          surfaceColor: colorRegex.test(parsed.surfaceColor) ? parsed.surfaceColor : '#0f141f',
          textColor: colorRegex.test(parsed.textColor) ? parsed.textColor : '#f8fafc',
          textMutedColor: colorRegex.test(parsed.textMutedColor) ? parsed.textMutedColor : '#94a3b8',
          borderRadius: ['sm', 'md', 'lg', 'full'].includes(parsed.borderRadius) ? parsed.borderRadius : 'lg',
          motionIntensity: ['subtle', 'standard', 'reduced'].includes(parsed.motionIntensity) ? parsed.motionIntensity : 'standard',
          mode: parsed.mode === 'light' ? 'light' : 'dark'
        };

        setTheme(safeTheme);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
      } catch (err: any) {
        setImportError(err.message || 'Invalid theme configuration JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToOfficialLogo = () => {
    setSettings(prev => ({
      ...prev,
      logoUrl: BRANDING.logoUrl,
      faviconUrl: BRANDING.faviconUrl
    }));
  };

  return (
    <div className="max-w-5xl space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            Platform, Appearance & Theme Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure official branding, video watermark coordinates, security rules, and real-time color tokens.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Syncing...' : 'Save All Changes'}</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Configuration saved and synchronized to Cloud Firestore!</span>
        </div>
      )}

      {importError && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span>{importError}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('general')}
          className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'general' ? 'border-red-500 text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>General Platform</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance' ? 'border-red-500 text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Logo & Watermark</span>
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'theme' ? 'border-red-500 text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Realtime Themes</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'security' ? 'border-red-500 text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Access</span>
        </button>
      </div>

      {/* TAB 1: General Platform */}
      {activeTab === 'general' && (
        <div className="p-6 rounded-3xl bg-[#090c13] border border-white/10 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/10">
              Site Identity & Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Site Title</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Tagline</label>
                <input
                  type="text"
                  value={settings.siteTagline}
                  onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Meta Description</label>
                <textarea
                  rows={2}
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Logo & Player Watermark */}
      {activeTab === 'appearance' && (
        <div className="p-6 rounded-3xl bg-[#090c13] border border-white/10 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Official CINEXUS Logo & Brand Marks
              </h3>
              <button
                type="button"
                onClick={handleResetToOfficialLogo}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Official Logo</span>
              </button>
            </div>

            {/* Current Active Logo Preview */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 shrink-0">
                <img
                  src={settings.logoUrl || BRANDING.logoUrl}
                  alt="CINEXUS Active Logo"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Active Brand Asset</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  This official CINEXUS brand mark is rendered across the navbar, mobile header, auth portals, 
                  loading splash screens, and video player watermark.
                </p>
                <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Verified Official Source Asset</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Logo Image URL</label>
                <input
                  type="text"
                  value={settings.logoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Favicon / Applet Icon URL</label>
                <input
                  type="text"
                  value={settings.faviconUrl || ''}
                  onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Player Watermark Controls */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Video Player Watermark Controls
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Watermark Corner Position</label>
                  <select
                    value={settings.watermarkPosition}
                    onChange={(e) => setSettings({ ...settings, watermarkPosition: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white cursor-pointer"
                  >
                    <option value="top-right">Top Right Corner (Standard)</option>
                    <option value="top-left">Top Left Corner</option>
                    <option value="bottom-right">Bottom Right Corner</option>
                    <option value="bottom-left">Bottom Left Corner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                    Watermark Opacity ({Math.round(settings.watermarkOpacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={settings.watermarkOpacity}
                    onChange={(e) => setSettings({ ...settings, watermarkOpacity: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600 mt-2"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.watermarkEnabled}
                    onChange={(e) => setSettings({ ...settings, watermarkEnabled: e.target.checked })}
                    className="accent-red-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Render Official CINEXUS Watermark</span>
                    <span className="text-[11px] text-zinc-400 block">Displays the official logo as a subtle watermark on video streams.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.watermarkMoving ?? false}
                    onChange={(e) => setSettings({ ...settings, watermarkMoving: e.target.checked })}
                    className="accent-red-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Subtle Repositioning Watermark</span>
                    <span className="text-[11px] text-zinc-400 block">Periodically and gently alternates corner positions to avoid OLED burn-in.</span>
                  </div>
                </label>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: Realtime Themes */}
      {activeTab === 'theme' && (
        <div className="p-6 rounded-3xl bg-[#090c13] border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Real-Time Cinema Theme Customizer
              </h3>
              <p className="text-[11px] text-zinc-400">
                All changes reflect across the platform without requiring a code rebuild.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportTheme}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportThemeFile}
              />
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Curated Cinematic Palettes</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_THEMES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setTheme(p.theme)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    theme.name === p.name ? 'border-red-500 bg-red-950/20' : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.theme.primaryAccent }} />
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.theme.secondaryAccent }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: p.theme.backgroundColor }} />
                  </div>
                  <span className="text-xs font-semibold text-white block truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Primary Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.primaryAccent}
                  onChange={(e) => setTheme({ ...theme, primaryAccent: e.target.value })}
                  className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.primaryAccent}
                  onChange={(e) => setTheme({ ...theme, primaryAccent: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Secondary Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.secondaryAccent}
                  onChange={(e) => setTheme({ ...theme, secondaryAccent: e.target.value })}
                  className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.secondaryAccent}
                  onChange={(e) => setTheme({ ...theme, secondaryAccent: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Obsidian Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Surface Card Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.surfaceColor}
                  onChange={(e) => setTheme({ ...theme, surfaceColor: e.target.value })}
                  className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.surfaceColor}
                  onChange={(e) => setTheme({ ...theme, surfaceColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Card Corner Radius</label>
              <select
                value={theme.borderRadius}
                onChange={(e) => setTheme({ ...theme, borderRadius: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white cursor-pointer"
              >
                <option value="sm">Subtle (rounded-sm)</option>
                <option value="md">Modern Cinema (rounded-xl)</option>
                <option value="lg">Smooth Editorial (rounded-2xl)</option>
                <option value="full">Curved Pill (rounded-3xl)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Motion & Transitions</label>
              <select
                value={theme.motionIntensity}
                onChange={(e) => setTheme({ ...theme, motionIntensity: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white cursor-pointer"
              >
                <option value="standard">Standard Cinematic Motion (300ms)</option>
                <option value="subtle">Subtle Minimal Motion (150ms)</option>
                <option value="reduced">Reduced Motion (Accessible)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Security & Access */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-3xl bg-[#090c13] border border-white/10 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/10">
              Access & Guardrails
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="accent-red-600 rounded"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Maintenance Mode</span>
                  <span className="text-[11px] text-zinc-400 block">Temporarily restrict public streaming access during system updates.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowUserRegistrations}
                  onChange={(e) => setSettings({ ...settings, allowUserRegistrations: e.target.checked })}
                  className="accent-red-600 rounded"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Allow New User Registrations</span>
                  <span className="text-[11px] text-zinc-400 block">Permits public users to register via Email and Google OAuth.</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
