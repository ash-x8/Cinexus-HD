import React, { ReactNode, useEffect, useState } from 'react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { AuthModal } from '../auth/AuthModal';
import { subscribeSiteSettings } from '../../services/firestore';
import { SiteSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export const PublicLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const unsub = subscribeSiteSettings((s) => {
      setSiteSettings(s);
      if (s.theme) {
        const root = document.documentElement;
        if (s.theme.primaryAccent) root.style.setProperty('--cinexus-primary', s.theme.primaryAccent);
        if (s.theme.secondaryAccent) root.style.setProperty('--cinexus-secondary', s.theme.secondaryAccent);
        if (s.theme.backgroundColor) root.style.setProperty('--cinexus-bg', s.theme.backgroundColor);
        if (s.theme.surfaceColor) root.style.setProperty('--cinexus-surface', s.theme.surfaceColor);
        if (s.theme.textColor) root.style.setProperty('--cinexus-text', s.theme.textColor);
      }
    });
    return () => unsub();
  }, []);

  // If maintenance mode is activated and user is not admin
  if (siteSettings?.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display uppercase tracking-wider">
          Scheduled Cinema Maintenance
        </h1>
        <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
          {siteSettings.siteName || 'CINEXUS'} streaming nodes are currently undergoing scheduled high-bitrate core upgrades.
          Public streaming will resume momentarily. Thank you for your patience.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080c] text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      <PublicNavbar />
      <main className="flex-1 w-full">{children}</main>
      <PublicFooter />
      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
};
