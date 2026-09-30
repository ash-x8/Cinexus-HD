import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { AuthModal } from '../auth/AuthModal';
import { SearchModal } from '../search/SearchModal';
import { subscribeSiteSettings } from '../../services/firestore';
import { SiteSettings, MovieItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export const PublicLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Keyboard shortcut listener for '/' and 'Ctrl+K' / 'Cmd+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsub = subscribeSiteSettings((s) => {
      setSiteSettings(s);
    });
    return () => unsub();
  }, []);

  // If maintenance mode is activated and user is not admin
  if (siteSettings?.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0D12] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(229,169,60,0.25)]">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display uppercase tracking-wider text-amber-400">
          Scheduled Cinema Maintenance
        </h1>
        <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
          {siteSettings.siteName || 'CINEXUS-HD'} streaming nodes are currently undergoing scheduled high-bitrate core upgrades.
          Public streaming will resume momentarily. Thank you for your patience.
        </p>
      </div>
    );
  }

  const handleSelectMovie = (movie: MovieItem) => {
    setSearchModalOpen(false);
    navigate(`/watch/${movie.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      <PublicNavbar onOpenSearch={() => setSearchModalOpen(true)} />
      
      <main className="flex-1 w-full">{children}</main>
      
      <PublicFooter />
      
      {/* Global Live Instant Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectMovie={handleSelectMovie}
      />
      
      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
};
