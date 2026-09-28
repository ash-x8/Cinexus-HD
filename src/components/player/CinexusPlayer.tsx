import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  SkipForward,
  SkipBack,
  Subtitles,
  Server,
  Layers,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Check,
  Tv
} from 'lucide-react';
import { MovieItem, EpisodeItem, VideoSource, ServerEmbeds, SubtitleTrack } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { getPlaybackSources, PlaybackSource } from '../../services/embedParser';

export interface CinexusPlayerProps {
  content?: MovieItem;
  movie?: MovieItem;
  episode?: EpisodeItem | null;
  currentEpisode?: EpisodeItem | null;
  allEpisodes?: EpisodeItem[];
  initialTime?: number;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEpisodeChange?: (episode: EpisodeItem) => void;
  onClose?: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPrevEpisode?: boolean;
}

export const CinexusPlayer: React.FC<CinexusPlayerProps> = ({
  content,
  movie,
  episode,
  currentEpisode,
  allEpisodes = [],
  initialTime = 0,
  onTimeUpdate,
  onEpisodeChange,
  onClose,
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode = false,
  hasPrevEpisode = false
}) => {
  const activeContent = (content || movie)!;
  const activeEpisode = episode !== undefined ? episode : currentEpisode;
  const { updateProgress, watchProgressMap } = usePlayer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Subtitle management
  const availableSubtitles: SubtitleTrack[] = [
    ...((activeEpisode?.subtitles?.length ? activeEpisode.subtitles : activeContent?.subtitles) || []),
    { id: 'sub-en', label: 'English (CC)', language: 'en', src: 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/subtitles/sample_en.vtt' },
    { id: 'sub-si', label: 'Sinhala (සිංහල උපසිරැසි)', language: 'si', src: 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/subtitles/sample_si.vtt' }
  ];

  const handleSubtitleChange = (lang: string) => {
    setActiveSubtitle(lang);
    setShowSubtitleMenu(false);
    if (videoRef.current && videoRef.current.textTracks) {
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        const track = videoRef.current.textTracks[i];
        if (lang === 'off') {
          track.mode = 'disabled';
        } else if (track.language === lang || track.label.toLowerCase().includes(lang.toLowerCase())) {
          track.mode = 'showing';
        } else {
          track.mode = 'disabled';
        }
      }
    }
  };
  const [sources, setSources] = useState<PlaybackSource[]>([]);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string>('off');
  const [activeQuality, setActiveQuality] = useState<string>('Auto');

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Assemble all available sources (direct video, admin servers, trailers)
  useEffect(() => {
    if (!activeContent) return;
    const rawSources = activeEpisode?.sources?.length ? activeEpisode.sources : activeContent.sources;
    const servers: ServerEmbeds | undefined = activeEpisode?.servers || activeContent.servers;
    const trailerId = activeContent.trailerYoutubeId;

    const available = getPlaybackSources(undefined, {
      sources: rawSources,
      servers,
      trailerYoutubeId: trailerId
    });

    setSources(available);
    setActiveSourceIndex(0);
    setHasError(available.length === 0);
    if (available.length === 0) {
      setErrorMessage('No authorized playback source is configured for this title.');
    }
  }, [activeContent, activeEpisode]);

  const currentSource = sources[activeSourceIndex] || null;

  // Initialize Video / HLS on Source Change
  const initializeStream = useCallback(() => {
    const video = videoRef.current;
    if (!video || !currentSource || currentSource.type === 'iframe') {
      setIsBuffering(false);
      return;
    }

    setHasError(false);
    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = currentSource.url;
    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('hls');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        // Resume from watch progress or initialTime
        if (initialTime > 0) {
          video.currentTime = initialTime;
        } else {
          const contentKey = activeEpisode ? `${activeContent?.id}_${activeEpisode.id}` : (activeContent?.id || '');
          const saved = watchProgressMap[contentKey];
          if (saved?.currentTime && saved.currentTime > 10 && saved.currentTime < (saved.duration - 30)) {
            video.currentTime = saved.currentTime;
          }
        }
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[HLS] Network error encountered. Trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Media decode error encountered. Trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('[HLS] Fatal playback error:', data);
              hls.destroy();
              setHasError(true);
              setErrorMessage('The remote stream server could not be reached or playback timed out.');
              setIsBuffering(false);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHls) {
      // Native Safari HLS or direct MP4
      video.src = streamUrl;
      video.load();

      // Resume from watch progress or initialTime
      if (initialTime > 0) {
        video.currentTime = initialTime;
      } else {
        const contentKey = activeEpisode ? `${activeContent?.id}_${activeEpisode.id}` : (activeContent?.id || '');
        const saved = watchProgressMap[contentKey];
        if (saved?.currentTime && saved.currentTime > 10 && saved.currentTime < (saved.duration - 30)) {
          video.currentTime = saved.currentTime;
        }
      }

      video.play().catch(() => setIsPlaying(false));
    } else {
      setHasError(true);
      setErrorMessage('Your browser does not support HLS streaming for this source.');
      setIsBuffering(false);
    }
  }, [currentSource, activeContent?.id, activeEpisode, watchProgressMap, initialTime]);

  useEffect(() => {
    initializeStream();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initializeStream]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);
    updateProgress(cur, dur);
    onTimeUpdate?.(cur, dur);

    // Update buffer progress
    if (videoRef.current.buffered.length > 0 && dur > 0) {
      const buffEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered(Math.min(100, (buffEnd / dur) * 100));
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleSeekSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const target = parseFloat(e.target.value);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(console.warn);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.warn);
      setIsFullscreen(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
  };

  // Auto-hide controls timer
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettingsMenu && !showServerMenu && !showSubtitleMenu) {
        setShowControls(false);
      }
    }, 3200);
  };

  // Keyboard Shortcuts (Space, F, M, Left, Right, Up, Down, T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setIsTheater((prev) => !prev);
          break;
        case 'Escape':
          if (showSettingsMenu || showServerMenu || showSubtitleMenu) {
            setShowSettingsMenu(false);
            setShowServerMenu(false);
            setShowSubtitleMenu(false);
          } else if (onClose) {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, duration, showSettingsMenu, showServerMenu, showSubtitleMenu]);

  // Format time mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative bg-black select-none overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : isTheater
          ? 'w-full aspect-[21/9] max-h-[85vh] rounded-none'
          : 'w-full aspect-video max-h-[80vh] rounded-2xl border border-white/10 shadow-2xl'
      }`}
    >
      {/* Top Bar Overlay */}
      <div
        className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-105"
              title="Close Player (Esc)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide flex items-center gap-2">
              {activeContent?.title}
              {activeEpisode && (
                <span className="text-zinc-400 font-normal text-xs">
                  · S{activeEpisode.seasonNumber} E{activeEpisode.episodeNumber}: {activeEpisode.title}
                </span>
              )}
            </h2>
            <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>{activeContent?.releaseYear}</span>
              <span>·</span>
              <span className="text-red-500 font-semibold">{activeContent?.quality}</span>
              {currentSource && (
                <>
                  <span>·</span>
                  <span className="text-zinc-300">{currentSource.title}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Server & Source Switcher Badge */}
        {sources.length > 1 && (
          <button
            onClick={() => setShowServerMenu((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white backdrop-blur-md border border-white/10 transition-colors"
          >
            <Server className="w-3.5 h-3.5 text-red-500" />
            <span>Switch Server ({sources.length})</span>
          </button>
        )}
      </div>

      {/* Official CINEXUS Player Watermark */}
      <div 
        className={`absolute top-4 right-5 sm:right-6 z-20 pointer-events-none transition-all duration-300 select-none ${
          showControls ? 'opacity-85' : 'opacity-60'
        }`}
      >
        <img
          src="https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/file_00000000a72882119fa9566af8cf7b28.png"
          alt="CINEXUS Watermark"
          className="h-5 sm:h-6 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
        />
      </div>

      {/* Main Video Element or Iframe Embed */}
      {currentSource?.type === 'iframe' ? (
        <iframe
          src={currentSource.url}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          title={activeContent?.title || 'Player'}
        />
      ) : (
        <video
          ref={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onError={() => {
            setHasError(true);
            setErrorMessage('Playback error: Unable to decode stream from this server.');
            setIsBuffering(false);
          }}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
          crossOrigin="anonymous"
        >
          {availableSubtitles.map((sub) => (
            <track
              key={sub.id}
              kind="subtitles"
              src={sub.src}
              srcLang={sub.language}
              label={sub.label}
              default={activeSubtitle === sub.language}
            />
          ))}
        </video>
      )}

      {/* Buffering Indicator */}
      {isBuffering && !hasError && currentSource?.type !== 'iframe' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="w-12 h-12 rounded-full border-2 border-red-600/30 border-t-red-600 animate-spin" />
          <p className="mt-3 text-xs tracking-wider text-zinc-300 font-medium uppercase">Buffering Master Feed...</p>
        </div>
      )}

      {/* Error & Source Failover State */}
      {hasError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center bg-[#07090e]/95 backdrop-blur-lg">
          <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">Playback source unavailable</h3>
          <p className="text-xs text-zinc-400 max-w-md mt-1 mb-6">{errorMessage || 'The remote media host did not return a playable video stream.'}</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={initializeStream}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Stream</span>
            </button>

            {sources.length > 1 && (
              <button
                onClick={() => {
                  const nextIndex = (activeSourceIndex + 1) % sources.length;
                  setActiveSourceIndex(nextIndex);
                  setHasError(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-colors"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Next Server ({sources[(activeSourceIndex + 1) % sources.length]?.title})</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Back to Details
              </button>
            )}
          </div>
        </div>
      )}

      {/* Server Selection Flyout */}
      {showServerMenu && (
        <div className="absolute top-16 right-6 z-40 w-72 p-3 rounded-2xl bg-zinc-950/95 border border-white/15 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-semibold text-white">
            <span className="flex items-center gap-2">
              <Server className="w-4 h-4 text-red-500" /> Authorized Streaming Servers
            </span>
            <button onClick={() => setShowServerMenu(false)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {sources.map((src: PlaybackSource, idx: number) => (
              <button
                key={src.id}
                onClick={() => {
                  setActiveSourceIndex(idx);
                  setShowServerMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                  activeSourceIndex === idx
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30 font-medium'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                }`}
              >
                <div>
                  <div className="font-medium text-white">{src.title}</div>
                  <div className="text-[10px] text-zinc-400 uppercase">{src.providerName} · {src.type}</div>
                </div>
                {activeSourceIndex === idx && <Check className="w-4 h-4 text-red-400" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Settings Menu Flyout */}
      {showSettingsMenu && (
        <div className="absolute bottom-20 right-6 z-40 w-56 p-3 rounded-2xl bg-zinc-950/95 border border-white/15 shadow-2xl backdrop-blur-xl text-xs text-white">
          <div className="font-semibold text-zinc-400 pb-2 mb-2 border-b border-white/10 uppercase tracking-wider text-[10px]">
            Playback Speed
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`py-1 rounded-lg text-center transition-colors ${
                  playbackRate === spd ? 'bg-red-600 text-white font-semibold' : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="font-semibold text-zinc-400 pb-2 mb-2 border-b border-white/10 uppercase tracking-wider text-[10px]">
            Display Quality
          </div>
          <div className="space-y-1">
            {['Auto', '4K Ultra HD', '1080p FHD', '720p HD'].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setActiveQuality(q);
                  setShowSettingsMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  activeQuality === q ? 'bg-white/15 text-white font-medium' : 'hover:bg-white/5 text-zinc-400'
                }`}
              >
                <span>{q}</span>
                {activeQuality === q && <Check className="w-3.5 h-3.5 text-red-500" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtitles (CC) Flyout Menu */}
      {showSubtitleMenu && (
        <div className="absolute bottom-20 right-14 z-40 w-64 p-3 rounded-2xl bg-zinc-950/95 border border-white/15 shadow-2xl backdrop-blur-xl text-xs text-white animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 font-semibold text-zinc-300">
            <span className="flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-red-500" />
              <span>Closed Captions & Subtitles</span>
            </span>
            <button onClick={() => setShowSubtitleMenu(false)} className="text-zinc-400 hover:text-white cursor-pointer">✕</button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            <button
              onClick={() => handleSubtitleChange('off')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                activeSubtitle === 'off' ? 'bg-red-600/20 text-red-400 font-semibold border border-red-500/30' : 'hover:bg-white/5 text-zinc-300'
              }`}
            >
              <span>Subtitles Off</span>
              {activeSubtitle === 'off' && <Check className="w-3.5 h-3.5 text-red-400" />}
            </button>
            {availableSubtitles.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubtitleChange(sub.language)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  activeSubtitle === sub.language ? 'bg-red-600/20 text-red-400 font-semibold border border-red-500/30' : 'hover:bg-white/5 text-zinc-300'
                }`}
              >
                <span>{sub.label}</span>
                {activeSubtitle === sub.language && <Check className="w-3.5 h-3.5 text-red-400" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Bottom Controls Bar */}
      {currentSource?.type !== 'iframe' && (
        <div
          className={`absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress / Seekbar */}
          <div className="relative group w-full mb-3 cursor-pointer">
            {/* Buffered bar */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/30 transition-all duration-150" style={{ width: `${buffered}%` }} />
            </div>
            {/* Progress fill */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-red-600 rounded-full" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
            {/* Native range input overlay */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeekSlider}
              className="relative w-full h-3 opacity-0 cursor-pointer z-10"
            />
          </div>

          {/* Controls Bottom Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-transform hover:scale-105"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => handleSeek(-10)}
                className="p-2 text-zinc-300 hover:text-white transition-colors"
                title="Rewind 10s (Left Arrow)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSeek(10)}
                className="p-2 text-zinc-300 hover:text-white transition-colors"
                title="Forward 10s (Right Arrow)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} className="p-2 text-zinc-300 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 accent-red-600 rounded-lg cursor-pointer transition-all"
                />
              </div>

              {/* Timestamp */}
              <div className="text-xs font-mono tabular-nums text-zinc-400">
                <span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Previous / Next Episode for TV Series */}
              {hasPrevEpisode && (
                <button
                  onClick={onPrevEpisode}
                  className="p-2 text-zinc-300 hover:text-white transition-colors"
                  title="Previous Episode"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              )}

              {hasNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="p-2 text-zinc-300 hover:text-white transition-colors"
                  title="Next Episode"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}

              {/* Subtitles (CC) */}
              <button
                onClick={() => setShowSubtitleMenu((v) => !v)}
                className={`p-2 transition-colors cursor-pointer ${activeSubtitle !== 'off' ? 'text-red-500 font-bold' : 'text-zinc-300 hover:text-white'}`}
                title="Subtitles & Audio (CC)"
              >
                <Subtitles className="w-4 h-4" />
              </button>

              {/* Theater Mode */}
              <button
                onClick={() => setIsTheater((prev) => !prev)}
                className={`p-2 transition-colors ${isTheater ? 'text-red-500' : 'text-zinc-300 hover:text-white'}`}
                title="Theater Mode (T)"
              >
                <Tv className="w-4 h-4" />
              </button>

              {/* Settings Menu */}
              <button
                onClick={() => setShowSettingsMenu((v) => !v)}
                className="p-2 text-zinc-300 hover:text-white transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-zinc-300 hover:text-white transition-colors"
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
