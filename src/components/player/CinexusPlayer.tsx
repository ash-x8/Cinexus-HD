import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  Settings, 
  Subtitles, 
  Layers, 
  SkipForward, 
  SkipBack, 
  AlertCircle, 
  RefreshCw, 
  Tv, 
  Sparkles,
  Check,
  Compass
} from 'lucide-react';
import { MovieItem, EpisodeItem, VideoSource, SubtitleTrack } from '../../types';
import { PlayerWatermark } from './PlayerWatermark';
import { BRANDING } from '../../config/branding';

interface CinexusPlayerProps {
  movie: MovieItem;
  currentEpisode?: EpisodeItem;
  allEpisodes?: EpisodeItem[];
  initialTime?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEpisodeChange?: (episode: EpisodeItem) => void;
  onClose?: () => void;
}

export const CinexusPlayer: React.FC<CinexusPlayerProps> = ({
  movie,
  currentEpisode,
  allEpisodes = [],
  initialTime = 0,
  onTimeUpdate,
  onEpisodeChange,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sources resolution
  const availableSources: VideoSource[] = React.useMemo(() => {
    if (currentEpisode?.sources && currentEpisode.sources.length > 0) {
      return currentEpisode.sources.filter(s => s.enabled !== false);
    }
    if (movie.sources && movie.sources.length > 0) {
      return movie.sources.filter(s => s.enabled !== false);
    }
    // If movie has demoVideoUrl that isn't BigBuckBunny, use it
    if (movie.demoVideoUrl && !movie.demoVideoUrl.includes('BigBuckBunny')) {
      return [{
        id: 'src-primary',
        title: 'Master Stream',
        url: movie.demoVideoUrl,
        type: movie.demoVideoUrl.includes('.m3u8') ? 'hls' : 'mp4',
        quality: movie.quality || '4K',
        isDefault: true,
        enabled: true
      }];
    }
    // YouTube trailer if exists
    if (movie.trailerYoutubeId) {
      return [{
        id: 'src-yt',
        title: 'Official 4K Trailer Stream',
        url: `https://www.youtube.com/embed/${movie.trailerYoutubeId}?autoplay=1&enablejsapi=1`,
        type: 'youtube',
        quality: '4K',
        isDefault: true,
        enabled: true
      }];
    }
    return [];
  }, [movie, currentEpisode]);

  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const activeSource: VideoSource | undefined = availableSources[activeSourceIndex];

  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('Off');
  const [showControls, setShowControls] = useState(true);
  const [activeMenu, setActiveMenu] = useState<'none' | 'sources' | 'quality' | 'speed' | 'subtitles'>('none');
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Subtitles
  const subtitles: SubtitleTrack[] = React.useMemo(() => {
    const list: SubtitleTrack[] = [];
    if (currentEpisode?.subtitles && currentEpisode.subtitles.length > 0) {
      list.push(...currentEpisode.subtitles);
    } else if (movie.subtitles && movie.subtitles.length > 0) {
      list.push(...movie.subtitles);
    }
    return list;
  }, [movie, currentEpisode]);

  // Next episode logic
  const currentEpIndex = allEpisodes.findIndex(ep => ep.id === currentEpisode?.id);
  const nextEpisode = currentEpIndex >= 0 && currentEpIndex < allEpisodes.length - 1 
    ? allEpisodes[currentEpIndex + 1] 
    : undefined;
  const prevEpisode = currentEpIndex > 0 
    ? allEpisodes[currentEpIndex - 1] 
    : undefined;

  // Initialize Video Stream with HLS or Native
  const loadSource = useCallback((source?: VideoSource) => {
    if (!source || !source.url) {
      setPlaybackError('No active streaming source configured for this title.');
      return;
    }

    setPlaybackError(null);
    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (!video) return;

    const isHls = source.type === 'hls' || source.url.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(source.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        if (initialTime > 0) {
          video.currentTime = initialTime;
        }
        video.play().catch(() => setIsPlaying(false));
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try next source if available
              if (activeSourceIndex < availableSources.length - 1) {
                setActiveSourceIndex(prev => prev + 1);
              } else {
                setPlaybackError('Stream network connection failed. Please try an alternate source.');
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      // Safari Native HLS
      video.src = source.url;
      if (initialTime > 0) video.currentTime = initialTime;
      video.play().catch(() => setIsPlaying(false));
    } else {
      // Standard Direct MP4 / WebM
      video.src = source.url;
      if (initialTime > 0) video.currentTime = initialTime;
      video.play().catch(() => setIsPlaying(false));
    }
  }, [activeSourceIndex, availableSources, initialTime]);

  useEffect(() => {
    if (activeSource && activeSource.type !== 'youtube' && activeSource.type !== 'iframe' && activeSource.type !== 'embed') {
      loadSource(activeSource);
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeSource, loadSource]);

  // Controls auto-hide
  const triggerUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setActiveMenu('none');
      }
    }, 3500);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          seekDelta(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          seekDelta(-10);
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          setIsTheater(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted]);

  // Actions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    triggerUserActivity();
  };

  const seekDelta = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(duration, Math.max(0, video.currentTime + seconds));
    triggerUserActivity();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  };

  const adjustVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Math.min(1, Math.max(0, volume + delta));
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setActiveMenu('none');
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isEmbedType = activeSource?.type === 'youtube' || activeSource?.type === 'iframe' || activeSource?.type === 'embed';

  return (
    <div 
      ref={containerRef}
      onMouseMove={triggerUserActivity}
      onClick={triggerUserActivity}
      className={`relative w-full bg-black select-none overflow-hidden group ${
        isTheater ? 'h-screen' : 'aspect-video max-h-[85vh] rounded-3xl border border-slate-800 shadow-2xl'
      }`}
    >
      {/* PERSISTENT CINEXUS WATERMARK */}
      <PlayerWatermark position={BRANDING.watermark.position} />

      {/* NO STREAM SOURCES AVAILABLE STATE (No fake videos!) */}
      {availableSources.length === 0 ? (
        <div className="absolute inset-0 bg-[#07090e] flex items-center justify-center p-6 text-center z-30">
          <div className="max-w-md space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Stream Currently Unavailable</h3>
              <p className="text-xs text-slate-400 mt-1">
                No active 4K feed or legal broadcast source is currently configured for &quot;{movie.title}&quot;. Check back soon or select an alternative master release.
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white border border-slate-700 cursor-pointer"
              >
                Return to Cinema Hub
              </button>
            )}
          </div>
        </div>
      ) : isEmbedType ? (
        /* EMBED / IFRAME PLAYER */
        <div className="w-full h-full relative">
          <iframe
            src={activeSource?.url}
            title={movie.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        /* NATIVE HTML5 + HLS PLAYER */
        <>
          <video
            ref={videoRef}
            onClick={togglePlay}
            onTimeUpdate={() => {
              const video = videoRef.current;
              if (video) {
                setCurrentTime(video.currentTime);
                setDuration(video.duration || 0);
                if (onTimeUpdate) {
                  onTimeUpdate(video.currentTime, video.duration || 0);
                }
              }
            }}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsBuffering(false);
              setIsPlaying(true);
            }}
            onEnded={() => {
              setIsPlaying(false);
              if (nextEpisode && onEpisodeChange) {
                onEpisodeChange(nextEpisode);
              }
            }}
            onError={() => {
              if (activeSourceIndex < availableSources.length - 1) {
                setActiveSourceIndex(prev => prev + 1);
              } else {
                setPlaybackError('Playback error on configured stream feeds.');
              }
            }}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          />

          {/* Buffering Indicator */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border-4 border-red-500/30 border-t-red-500 animate-spin" />
                <span className="text-[11px] font-mono text-red-400 font-bold uppercase tracking-wider">
                  Syncing Buffer...
                </span>
              </div>
            </div>
          )}

          {/* Playback Error Warning */}
          {playbackError && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 text-center z-20">
              <div className="space-y-3">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">{playbackError}</h4>
                {availableSources.length > 1 && (
                  <button
                    onClick={() => {
                      const nextIdx = (activeSourceIndex + 1) % availableSources.length;
                      setActiveSourceIndex(nextIdx);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white cursor-pointer"
                  >
                    Switch to Source {activeSourceIndex + 2}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* TOP OVERLAY HEADER BAR */}
      <div className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <div>
            <h3 className="text-sm sm:text-base font-bold font-display text-white truncate max-w-xs sm:max-w-md">
              {movie.title}
            </h3>
            {currentEpisode && (
              <p className="text-[11px] text-slate-400">
                Season {currentEpisode.seasonNumber || 1} • Episode {currentEpisode.episodeNumber || 1}: {currentEpisode.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quality Badge */}
          <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-red-500/30 text-[10px] font-mono font-bold text-red-400">
            {activeSource?.quality || '4K UHD'}
          </span>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/90 border border-white/10 text-white transition-all cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM CONTROL BAR */}
      {!isEmbedType && (
        <div className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-3 transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Timeline Scrubber */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[11px] font-mono text-slate-300 min-w-[45px]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <span className="text-[11px] font-mono text-slate-400 min-w-[45px] text-right">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            {/* Left Controls: Play, Skip, Volume */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={togglePlay}
                className="p-2 sm:p-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-950/60 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={() => seekDelta(-10)}
                className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Seek -10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => seekDelta(10)}
                className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Seek +10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button onClick={toggleMute} className="p-2 text-slate-300 hover:text-white cursor-pointer">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVolume(val);
                    setIsMuted(val === 0);
                    if (videoRef.current) videoRef.current.volume = val;
                  }}
                  className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Episode Navigation */}
              {prevEpisode && (
                <button
                  onClick={() => onEpisodeChange && onEpisodeChange(prevEpisode)}
                  className="hidden sm:flex items-center gap-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span>Prev Ep</span>
                </button>
              )}

              {nextEpisode && (
                <button
                  onClick={() => onEpisodeChange && onEpisodeChange(nextEpisode)}
                  className="hidden sm:flex items-center gap-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  <span>Next Ep</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right Controls: Source selector, Settings, Fullscreen */}
            <div className="flex items-center gap-2 relative">
              {/* Source Switcher */}
              {availableSources.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === 'sources' ? 'none' : 'sources')}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-red-500" />
                    <span>Source {activeSourceIndex + 1}</span>
                  </button>

                  {activeMenu === 'sources' && (
                    <div className="absolute bottom-10 right-0 w-48 bg-[#0b0f17] border border-slate-800 rounded-2xl p-2 shadow-2xl space-y-1 z-30">
                      <span className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 block">
                        Streaming Nodes
                      </span>
                      {availableSources.map((src, i) => (
                        <button
                          key={src.id}
                          onClick={() => {
                            setActiveSourceIndex(i);
                            setActiveMenu('none');
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                            i === activeSourceIndex ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{src.title}</span>
                          {i === activeSourceIndex && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Speed Menu */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === 'speed' ? 'none' : 'speed')}
                  className="px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 hover:text-white cursor-pointer"
                >
                  {playbackSpeed}x
                </button>

                {activeMenu === 'speed' && (
                  <div className="absolute bottom-10 right-0 w-28 bg-[#0b0f17] border border-slate-800 rounded-2xl p-1.5 shadow-2xl space-y-1 z-30">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`w-full text-left px-2.5 py-1 rounded-xl text-xs font-mono cursor-pointer ${
                          playbackSpeed === speed ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theater Mode */}
              <button
                onClick={() => setIsTheater(!isTheater)}
                className="p-2 text-slate-300 hover:text-white cursor-pointer"
                title="Theater Mode (T)"
              >
                <Tv className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-300 hover:text-white cursor-pointer"
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
