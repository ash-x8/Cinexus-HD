import React, { useState } from 'react';
import { Shield, Sparkles, Film, AlertTriangle, KeyRound, ArrowRight } from 'lucide-react';
import { Logo } from '../common/Logo';
import { BRANDING } from '../../config/branding';
import { useAuth } from '../../context/AuthContext';

interface MaintenanceScreenProps {
  onAdminBypass: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onAdminBypass }) => {
  const { openAuthModal, user } = useAuth();
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-lg w-full text-center space-y-6 p-6 sm:p-8 rounded-3xl bg-[#0b0f17]/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Scheduled Maintenance in Progress</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Elevating the Cinema Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            CINEXUS is currently optimizing our 4K Ultra HD streaming clusters, TMDB real-time metadata synchronizers, and Sinhala subtitle database.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-left">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>System Upgrade Status</span>
            <span className="text-red-400 font-mono">92% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full w-[92%] animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-500">
            Estimated time to live stream availability: &lt; 15 minutes.
          </p>
        </div>

        {/* Admin Bypass Controls */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? (
            <button
              onClick={onAdminBypass}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Access: Enter CINEXUS Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => openAuthModal()}
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-red-500" />
              <span>Administrator Portal Sign In</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 text-[11px] text-slate-600 text-center">
        © {new Date().getFullYear()} {BRANDING.name} High Definition Cinema Network
      </div>
    </div>
  );
};
