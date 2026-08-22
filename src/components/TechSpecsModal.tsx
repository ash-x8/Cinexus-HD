import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Tv, 
  Radio, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Gauge, 
  CheckCircle2, 
  Volume2 
} from 'lucide-react';

interface TechSpecsModalProps {
  onClose: () => void;
}

export const TechSpecsModal: React.FC<TechSpecsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'aspect' | 'bandwidth'>('video');
  const [testedSpeed, setTestedSpeed] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runSpeedTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setTestedSpeed(128.4);
      setIsTesting(false);
    }, 1800);
  };

  return (
    <div 
      id="tech-specs-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="tech-specs-modal-content"
        className="relative w-full max-w-3xl bg-[#0c1017] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Master Fidelity Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-cinema text-white">
            Cinexus HD Tech Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered for high-end OLED displays, multi-channel sound systems, and studio master accuracy.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'video' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Video Master (AV1 & HEVC)
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'audio' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Spatial Dolby Atmos
          </button>
          <button
            onClick={() => setActiveTab('aspect')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'aspect' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Aspect Ratio Lab
          </button>
          <button
            onClick={() => setActiveTab('bandwidth')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'bandwidth' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bandwidth & Speed
          </button>
        </div>

        {/* Tab 1: Video Engine */}
        {activeTab === 'video' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 font-bold text-[10px]">4K DCI MASTER</span>
                <h4 className="text-sm font-bold text-white">3840 x 2160 native</h4>
                <p className="text-slate-400">Zero artificial edge enhancement. True 1:1 pixel rendering from original studio masters.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">DOLBY VISION & HDR10+</span>
                <h4 className="text-sm font-bold text-white">Dynamic Metadata</h4>
                <p className="text-slate-400">Scene-by-scene brightness tone-mapping up to 4,000 nits peak luminance on supported OLEDs.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">10-BIT DCI-P3</span>
                <h4 className="text-sm font-bold text-white">1.07 Billion Colors</h4>
                <p className="text-slate-400">Complete eradication of color banding in deep space gradients and night scenes.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-200">Stream Bitrate Comparison:</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-cyan-300 font-bold">Cinexus 4K Ultra Lossless (HEVC / AV1)</span>
                    <span className="font-mono text-cyan-300 font-bold">58.0 Mbps</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-400 w-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Standard Streaming Competitors 4K</span>
                    <span className="font-mono text-slate-400">15.0 Mbps</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-slate-500 w-1/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Audio Spatial */}
        {activeTab === 'audio' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Radio className="w-4 h-4" />
                <span>Dolby Atmos 7.1.4 Object-Based Soundstage</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Sound is treated as individual 3D objects placed in physical space rather than static channels. Supports overhead height channels for realistic helicopters, rain, and flybys.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
                  Left / Center / Right
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
                  Subwoofer LFE Channel
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
                  Left / Right Surrounds
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 font-mono text-[11px]">
                  4x Ceiling Height Atmos
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Aspect Ratio */}
        {activeTab === 'aspect' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                <div className="aspect-[2.39/1] bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center font-mono text-[10px] text-red-400">
                  2.39:1 Anamorphic
                </div>
                <span className="font-bold text-white block">Cinemascope Widescreen</span>
                <p className="text-slate-400 text-[11px]">Original theatrical aspect ratio for Dune, Blade Runner 2049, and The Batman.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                <div className="aspect-[1.90/1] bg-slate-950 border border-cyan-500/50 rounded-lg flex items-center justify-center font-mono text-[10px] text-cyan-300">
                  1.90:1 IMAX Enhanced
                </div>
                <span className="font-bold text-white block">IMAX Expanded Framing</span>
                <p className="text-slate-400 text-[11px]">Delivers up to 26% more picture on compatible screens for Oppenheimer and Interstellar.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                <div className="aspect-video bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center font-mono text-[10px] text-slate-300">
                  16:9 (1.78:1) Full TV
                </div>
                <span className="font-bold text-white block">Prestige Television</span>
                <p className="text-slate-400 text-[11px]">Full-screen edge-to-edge presentation for The Last of Us and Shōgun.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Bandwidth Tester */}
        {activeTab === 'bandwidth' && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Cinexus Stream Health Analyzer</h4>
                <p className="text-slate-400">Simulate connection speed to ensure steady 4K 60fps streaming.</p>
              </div>
              <button
                onClick={runSpeedTest}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isTesting ? 'Analyzing Ping & CDN...' : 'Test Connection'}
              </button>
            </div>

            {testedSpeed !== null && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <span className="text-slate-200 font-bold block">Ultra 4K Ready</span>
                    <span className="text-slate-400 text-[11px]">Optimal for 4K Dolby Atmos loss-free delivery</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-2xl font-black text-cyan-300">{testedSpeed}</span>
                  <span className="text-xs text-slate-400 ml-1">Mbps</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
