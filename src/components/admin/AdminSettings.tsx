import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getSiteSettings, saveSiteSettings, logAdminAction } from '../../services/firestore';
import { SiteSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'CINEXUS',
    siteTagline: 'STREAM. WATCH. EXPERIENCE.',
    siteDescription: 'Next-generation ultra cinema platform with master 4K streaming feeds.',
    watermarkEnabled: true,
    watermarkOpacity: 0.7,
    watermarkPosition: 'top-right',
    maintenanceMode: false,
    defaultQuality: '4K',
    allowUserRegistrations: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    getSiteSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSiteSettings(settings);
      await logAdminAction(user?.email || 'admin', 'UPDATE_SETTINGS', 'settings', 'global_config', 'Updated platform configuration');
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3500);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
          Global Platform Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Configure branding, cinema player watermark security, and maintenance status.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Platform settings synchronized to Cloud Firestore.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-6">
        
        {/* Branding Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/10">
            Brand Identity
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

        {/* Security & Maintenance Section */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/10">
            System & Security Controls
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="accent-red-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-white block">Maintenance Mode</span>
                <span className="text-[11px] text-zinc-400 block">Temporarily restrict public playback during catalog upgrades.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.watermarkEnabled}
                onChange={(e) => setSettings({ ...settings, watermarkEnabled: e.target.checked })}
                className="accent-red-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-white block">Video Player Watermark Protection</span>
                <span className="text-[11px] text-zinc-400 block">Render cryptographic CINEXUS overlay over playback stream.</span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Syncing...' : 'Save Configuration'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
