import React, { useState } from 'react';
import { 
  X, 
  HardDriveDownload, 
  CheckCircle2, 
  Film, 
  Sparkles, 
  Trash2, 
  Play, 
  AlertCircle 
} from 'lucide-react';
import { MovieItem } from '../types';

interface DownloadModalProps {
  movie?: MovieItem | null;
  onClose: () => void;
  onPlayMovie: (movie: MovieItem) => void;
}

interface DownloadItem {
  id: string;
  movie: MovieItem;
  quality: string;
  size: string;
  progress: number;
  completed: boolean;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  movie,
  onClose,
  onPlayMovie
}) => {
  const [downloadQuality, setDownloadQuality] = useState<'4K Ultra HD (HEVC)' | '1080p FHD' | '720p Standard'>('4K Ultra HD (HEVC)');
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      id: 'dl-1',
      movie: {
        id: 'dune-part-two',
        title: 'Dune: Part Two',
        tagline: 'Long live the fighters.',
        overview: 'Paul Atreides unites with Chani and the Fremen...',
        mediaType: 'movie',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=85',
        trailerYoutubeId: 'Way9Dexny3w',
        demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        releaseYear: 2024,
        rating: 8.8,
        votesCount: '480K',
        rottenTomatoesScore: 92,
        contentRating: 'PG-13',
        duration: '2h 46m',
        genres: ['Sci-Fi', 'Adventure'],
        quality: '4K Ultra HD',
        hasDolbyAtmos: true,
        hasHDR10Plus: true,
        cast: [],
        reviews: [],
        techSpecs: {} as any
      },
      quality: '4K Ultra HD (HEVC)',
      size: '6.4 GB',
      progress: 100,
      completed: true
    }
  ]);

  const [isDownloadingCurrent, setIsDownloadingCurrent] = useState(false);

  const startDownload = () => {
    if (!movie) return;
    setIsDownloadingCurrent(true);

    const sizeMap = {
      '4K Ultra HD (HEVC)': '6.8 GB',
      '1080p FHD': '3.2 GB',
      '720p Standard': '1.4 GB'
    };

    const newDl: DownloadItem = {
      id: `dl-${Date.now()}`,
      movie,
      quality: downloadQuality,
      size: sizeMap[downloadQuality],
      progress: 15,
      completed: false
    };

    setDownloads(prev => [newDl, ...prev]);

    // Simulate download progress
    const interval = setInterval(() => {
      setDownloads(prev => 
        prev.map(item => {
          if (item.id === newDl.id) {
            const nextProgress = Math.min(100, item.progress + 30);
            return {
              ...item,
              progress: nextProgress,
              completed: nextProgress >= 100
            };
          }
          return item;
        })
      );
    }, 800);

    setTimeout(() => {
      clearInterval(interval);
      setIsDownloadingCurrent(false);
    }, 3200);
  };

  const removeDownload = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div 
      id="download-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="download-modal-content"
        className="relative w-full max-w-2xl bg-[#0c1017] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100"
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
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
            <HardDriveDownload className="w-4 h-4" />
            <span>Offline Master Cache</span>
          </div>
          <h2 className="text-2xl font-black font-cinema text-white">
            Offline Cinema Downloads
          </h2>
          <p className="text-xs text-slate-400">
            Download full feature films in high-definition bitrates for flights, travels, or offline setups.
          </p>
        </div>

        {/* Target Movie Download Panel */}
        {movie && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 rounded-lg object-cover border border-slate-700" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{movie.title}</h4>
                <p className="text-xs text-slate-400">{movie.duration} • {movie.releaseYear}</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Select Download Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { id: '4K Ultra HD (HEVC)', size: '~6.8 GB (Lossless Bitrate)' },
                  { id: '1080p FHD', size: '~3.2 GB (High-Def Balanced)' },
                  { id: '720p Standard', size: '~1.4 GB (Storage Saver)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setDownloadQuality(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      downloadQuality === opt.id
                        ? 'bg-red-600/20 border-red-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="block">{opt.id}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{opt.size}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startDownload}
              disabled={isDownloadingCurrent}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 disabled:opacity-50"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>{isDownloadingCurrent ? 'Preparing Download Stream...' : `Download ${movie.title}`}</span>
            </button>
          </div>
        )}

        {/* Downloaded Storage List */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between text-slate-400 font-bold uppercase tracking-wider">
            <span>Cached Offline Media ({downloads.length})</span>
            <span>Storage Used: 6.4 GB / 256 GB</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {downloads.map(d => (
              <div
                key={d.id}
                className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={d.movie.posterUrl} alt={d.movie.title} className="w-9 h-12 rounded object-cover" />
                  <div className="min-w-0">
                    <h5 className="font-bold text-white truncate">{d.movie.title}</h5>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{d.quality}</span>
                      <span>•</span>
                      <span className="font-mono">{d.size}</span>
                      {d.completed && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>
                    {!d.completed && (
                      <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${d.progress}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {d.completed && (
                    <button
                      onClick={() => onPlayMovie(d.movie)}
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span className="hidden sm:inline">Play Offline</span>
                    </button>
                  )}
                  <button
                    onClick={() => removeDownload(d.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/50 hover:text-red-400 text-slate-400 border border-slate-700"
                    title="Delete Download"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
