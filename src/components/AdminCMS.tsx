import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminBrandSettings } from './admin/AdminBrandSettings';
import { AdminHomepage } from './admin/AdminHomepage';
import { AdminMovies } from './admin/AdminMovies';
import { AdminActivityLogs } from './admin/AdminActivityLogs';
import { AdminPortal } from './admin/AdminPortal';
import { 
  Sparkles, 
  Layers, 
  Film, 
  Activity, 
  ShieldCheck, 
  ExternalLink,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export { sanitizeData, sanitizeMovieData, sanitizePayload, saveMovieToFirestore } from './admin/AdminCMS';

export interface AdminCMSProps {
  onSuccess?: () => void;
  onExit?: () => void;
  initialTab?: 'branding' | 'rails' | 'movies' | 'logs';
}

export const AdminCMS: React.FC<AdminCMSProps> = ({ 
  onSuccess = () => {}, 
  onExit = () => {},
  initialTab = 'branding'
}) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'branding' | 'rails' | 'movies' | 'logs'>(initialTab);

  // If user is not authenticated or not an admin, render the login security gateway
  if (!user || !isAdmin) {
    return (
      <AdminPortal 
        onSuccess={onSuccess} 
        onExit={onExit} 
        onAccessGranted={onSuccess} 
        onBackToSite={onExit} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans select-none">
      
      {/* Top Admin CMS Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#090c13]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <h1 className="text-sm font-black tracking-wider uppercase font-display text-white">
              Cinexus Studio CMS Console
            </h1>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">
            Cloud Verified
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors border border-white/5"
            title="Open Public Cinema"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Live Site</span>
          </Link>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-xs font-semibold text-red-400 border border-red-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main CMS Sub-Navigation Tabs */}
      <div className="bg-[#0b0e17] border-b border-white/10 px-4 sm:px-8 flex items-center gap-2 overflow-x-auto">
        
        {/* Tab 1: Brand Settings */}
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'branding'
              ? 'border-[#D4AF37] text-[#D4AF37]'
              : 'border-transparent text-zinc-400 hover:text-white hover:border-white/20'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>Brand Settings</span>
        </button>

        {/* Tab 2: Homepage Rails (with Checkbox & Bulk Actions) */}
        <button
          onClick={() => setActiveTab('rails')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rails'
              ? 'border-[#D4AF37] text-[#D4AF37]'
              : 'border-transparent text-zinc-400 hover:text-white hover:border-white/20'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Homepage Rails & Bulk Controls</span>
        </button>

        {/* Tab 3: Media Catalog */}
        <button
          onClick={() => setActiveTab('movies')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'movies'
              ? 'border-[#D4AF37] text-[#D4AF37]'
              : 'border-transparent text-zinc-400 hover:text-white hover:border-white/20'
          }`}
        >
          <Film className="w-4 h-4 text-blue-400" />
          <span>Feature Movies & Series</span>
        </button>

        {/* Tab 4: Audit Logs */}
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-[#D4AF37] text-[#D4AF37]'
              : 'border-transparent text-zinc-400 hover:text-white hover:border-white/20'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Activity & Audit Trail</span>
        </button>

      </div>

      {/* Workspace Panel */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {activeTab === 'branding' && <AdminBrandSettings />}
        {activeTab === 'rails' && <AdminHomepage />}
        {activeTab === 'movies' && <AdminMovies />}
        {activeTab === 'logs' && <AdminActivityLogs />}
      </main>

    </div>
  );
};

export default AdminCMS;
