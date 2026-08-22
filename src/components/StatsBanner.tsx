import React from 'react';
import { Sparkles, Tv, Radio, ShieldCheck, Zap } from 'lucide-react';

export const StatsBanner: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-gradient-to-r from-slate-900/90 via-[#111722] to-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-500 shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-white block">4K UHD Master</span>
            <span className="text-xs text-slate-400">Pure uncompressed bitrates</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-white block">Dolby Atmos</span>
            <span className="text-xs text-slate-400">7.1.4 3D spatial surround</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-white block">Dynamic HDR10+</span>
            <span className="text-xs text-slate-400">10-bit wide DCI-P3 gamut</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-white block">0% Buffering</span>
            <span className="text-xs text-slate-400">Edge CDN multi-source sync</span>
          </div>
        </div>

      </div>
    </div>
  );
};
