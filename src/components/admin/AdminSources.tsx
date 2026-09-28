import React, { useState } from 'react';
import { Radio, Server, CheckCircle2, AlertCircle, Play, ExternalLink } from 'lucide-react';
import { parseEmbedCode } from '../../services/embedParser';

export const AdminSources: React.FC = () => {
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [activeIframe, setActiveIframe] = useState<string | null>(null);

  const handleTestUrl = () => {
    if (!testUrl.trim()) return;
    const res = parseEmbedCode(testUrl);
    setTestResult(res);
    if (res.isValid && res.embed?.src) {
      setActiveIframe(res.embed.src);
    }
  };

  const defaultProviders = [
    { id: 'streamhg', name: 'StreamHG Cloud', domain: 'streamhg.com', status: 'Optimal', type: 'Primary HLS & Iframe' },
    { id: 'ernvids', name: 'EarnVids Network', domain: 'earnvids.com', status: 'Optimal', type: 'Secondary Embed' },
    { id: 'filemoon', name: 'FileMoon CDN', domain: 'filemoon.sx', status: 'Optimal', type: 'Tertiary Embed' },
    { id: 'storage', name: 'Firebase Storage', domain: 'firebasestorage.app', status: 'Active', type: 'Direct 4K MP4' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
          Streaming Sources & Servers
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Configure video delivery networks, authorized servers, and test playback streams.
        </p>
      </div>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {defaultProviders.map((p) => (
          <div key={p.id} className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{p.name}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold uppercase">
                <CheckCircle2 className="w-3 h-3" /> {p.status}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">{p.type}</p>
            <p className="text-[10px] text-zinc-600 font-mono">{p.domain}</p>
          </div>
        ))}
      </div>

      {/* Stream URL Tester */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-500" />
          <span>Stream Verification & Safe Parser Tool</span>
        </h2>
        <p className="text-xs text-zinc-400">
          Paste an authorized .m3u8, .mp4, or iframe embed code to inspect its dimensions, aspect ratio, and playback safety.
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Paste embed code or video stream URL..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
          />
          <button
            onClick={handleTestUrl}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase tracking-wider transition-colors"
          >
            Verify Stream
          </button>
        </div>

        {testResult && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              {testResult.isValid ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Stream Passed Validation
                </span>
              ) : (
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Stream Validation Rejected: {testResult.error}
                </span>
              )}
            </div>
            {testResult.embed && (
              <div className="text-zinc-400 space-y-1 font-mono text-[11px]">
                <div>Extracted URL: <span className="text-white">{testResult.embed.src}</span></div>
                <div>Detected Provider: <span className="text-white">{testResult.embed.providerName || 'Direct'}</span></div>
                <div>Calculated Aspect Ratio: <span className="text-white">{testResult.embed.aspectRatio?.toFixed(3)}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Live Preview Window */}
        {activeIframe && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase">Live Playback Preview</h3>
            <div className="aspect-video w-full max-w-2xl rounded-xl overflow-hidden bg-black border border-white/10">
              <iframe
                src={activeIframe}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title="Stream Preview"
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
