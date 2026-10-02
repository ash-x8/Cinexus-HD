import React, { useState, useEffect } from 'react';
import { useBrand, DEFAULT_BRANDING, BrandingConfig } from '../../context/BrandContext';
import { useAuth } from '../../context/AuthContext';
import { logAdminAction } from '../../services/firestore';
import {
  Sparkles,
  Save,
  Check,
  RotateCcw,
  Globe,
  Image,
  Palette,
  Shield,
  Eye,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const PRESET_LOGOS = [
  {
    label: 'Cinexus Gold Emblem',
    url: 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/file_00000000a72882119fa9566af8cf7b28.png'
  },
  {
    label: 'Gold Cinema Reel',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80'
  }
];

export const AdminBrandSettings: React.FC = () => {
  const { branding, updateBranding, resetToDefault } = useBrand();
  const { user } = useAuth();

  const [form, setForm] = useState<BrandingConfig>(branding);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync form when branding updates from Firestore
  useEffect(() => {
    setForm(branding);
  }, [branding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateBranding({
        siteTitle: form.siteTitle.trim() || DEFAULT_BRANDING.siteTitle,
        logoUrl: form.logoUrl.trim() || DEFAULT_BRANDING.logoUrl,
        faviconUrl: form.faviconUrl.trim() || DEFAULT_BRANDING.faviconUrl,
        primaryColor: form.primaryColor || '#D4AF37',
        secondaryColor: form.secondaryColor || '#F59E0B',
        tagline: form.tagline.trim() || DEFAULT_BRANDING.tagline,
        brandDescription: form.brandDescription.trim() || DEFAULT_BRANDING.brandDescription,
        watermarkEnabled: form.watermarkEnabled,
        watermarkOpacity: form.watermarkOpacity
      });

      await logAdminAction(
        user?.email || 'admin',
        'UPDATE_BRAND_SETTINGS',
        'branding',
        'settings/branding',
        `Updated Site Title to "${form.siteTitle}" and Logo URL.`
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('[AdminBrandSettings] Save error:', err);
      setSaveError(err.message || 'Failed to save brand settings to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all brand assets to default Cinexus Dark Gold specification?')) return;
    try {
      await resetToDefault();
      setForm(DEFAULT_BRANDING);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to reset branding.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Dynamic Brand Controller</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight">
            Brand Settings & Visual Identity
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage global site logos, favicons, watermarks, and site titles stored in Firestore document <code className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">settings/branding</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Brand settings updated in Firestore! Changes are now live across all visitor screens.</span>
        </div>
      )}

      {/* Error Alert */}
      {saveError && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Real-time Live Preview Card */}
      <div className="rounded-3xl bg-[#12151E] border border-[#D4AF37]/30 p-6 sm:p-8 space-y-6 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#D4AF37]" />
            <span>Real-time Live Brand Preview</span>
          </h2>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Synchronized with DOM</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Header Preview */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Navbar Lockup
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0D12] border border-white/10">
              <img
                src={form.logoUrl}
                alt="Logo Preview"
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_BRANDING.logoUrl;
                }}
              />
              <div className="leading-tight">
                <span className="text-sm font-black tracking-widest uppercase font-display text-white">
                  {form.siteTitle.split('|')[0].trim() || 'CINEXUS'}
                </span>
                <span className="block text-[9px] font-bold tracking-widest text-[#D4AF37] uppercase">
                  {form.tagline || '4K CINEMA'}
                </span>
              </div>
            </div>
          </div>

          {/* Watermark Preview */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Player Canvas Watermark
            </div>
            <div className="relative aspect-video w-full rounded-xl bg-zinc-950 border border-white/10 overflow-hidden flex items-center justify-center">
              <span className="text-zinc-600 text-xs font-mono">4K Master Stream Feed</span>
              {form.watermarkEnabled && (
                <div
                  className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-[#D4AF37]/30"
                  style={{ opacity: form.watermarkOpacity }}
                >
                  <img src={form.logoUrl} alt="Watermark" className="h-4 w-auto object-contain" />
                  <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-wider font-display">
                    CINEXUS 4K
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl bg-[#12151E] border border-white/10 p-6 sm:p-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Site Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Global Site Title (Browser Tab & SEO)
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                value={form.siteTitle}
                onChange={(e) => setForm({ ...form, siteTitle: e.target.value })}
                placeholder="CINEXUS-HD | Ultra-High-Bitrate Cinema"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/40 border border-white/15 focus:border-[#D4AF37] text-white text-xs outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Updates <code>document.title</code> dynamically across the single-page application.
            </p>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Global Logo Image URL
            </label>
            <div className="relative">
              <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="url"
                required
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://domain.com/logo.png"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/40 border border-white/15 focus:border-[#D4AF37] text-white text-xs outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {PRESET_LOGOS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setForm({ ...form, logoUrl: preset.url })}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Favicon URL */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Favicon Icon URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="url"
                required
                value={form.faviconUrl}
                onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
                placeholder="https://domain.com/favicon.png"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/40 border border-white/15 focus:border-[#D4AF37] text-white text-xs outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Direct link to ICO or PNG icon for browser tabs and bookmarks.
            </p>
          </div>

          {/* Primary Brand Color (Dark Gold) */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Primary Cinema Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="w-12 h-10 rounded-xl bg-transparent border border-white/20 cursor-pointer"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="w-32 px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-mono uppercase"
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, primaryColor: '#D4AF37' })}
                className="text-[11px] text-amber-400 hover:underline cursor-pointer"
              >
                Set Dark Gold (#D4AF37)
              </button>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Brand Tagline
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="STREAM. WATCH. EXPERIENCE."
              className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 focus:border-[#D4AF37] text-white text-xs outline-none transition-all"
            />
          </div>

          {/* Watermark Controls */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Player Video Watermark
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Render official brand watermark over the Bespoke Cinexus Video Player canvas.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.watermarkEnabled}
                onChange={(e) => setForm({ ...form, watermarkEnabled: e.target.checked })}
                className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
              />
            </div>

            {form.watermarkEnabled && (
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Watermark Opacity</span>
                  <span className="font-mono text-white">{Math.round(form.watermarkOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={form.watermarkOpacity}
                  onChange={(e) => setForm({ ...form, watermarkOpacity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white/20 accent-[#D4AF37] rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing Brand Assets...' : 'Save & Publish Brand Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};

export default AdminBrandSettings;
