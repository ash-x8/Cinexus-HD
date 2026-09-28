import React from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { Play, History, Trash2 } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { watchProgressMap } = usePlayer();
  const historyList = Object.values(watchProgressMap).sort(
    (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
  );

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-300">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
            Watch History
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Resume your viewing progress across multiple devices seamlessly.
          </p>
        </div>
      </div>

      {historyList.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <p className="text-base text-zinc-400">No watch history recorded yet.</p>
          <p className="text-xs text-zinc-500">Titles you begin streaming will automatically appear here with progress tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
          {historyList.map((prog) => {
            const watchUrl = prog.episodeId
              ? `/watch/${prog.contentId}/season/${prog.seasonNumber || 1}/episode/${prog.episodeNumber || 1}`
              : `/watch/${prog.contentId}`;

            return (
              <Link
                key={prog.contentId + (prog.episodeId || '')}
                to={watchUrl}
                className="group p-3 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900 border border-white/10 hover:border-red-500/50 transition-all space-y-3"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 relative">
                  {prog.backdropPath || prog.posterPath ? (
                    <img
                      src={prog.backdropPath || prog.posterPath || ''}
                      alt={prog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">Cinema Feed</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600" style={{ width: `${prog.percentage}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{formatSecs(prog.currentTime)} / {formatSecs(prog.duration)}</span>
                    <span>{prog.percentage}% watched</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-red-400">
                    {prog.title}
                  </h4>
                  {prog.episodeTitle && (
                    <p className="text-xs text-zinc-400 truncate">
                      S{prog.seasonNumber} E{prog.episodeNumber}: {prog.episodeTitle}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
