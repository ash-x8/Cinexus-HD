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
  Tv,
  Check,
  Sparkles,
  AlertCircle,
  PictureInPicture,
  Gauge,
  ArrowLeft,
  Server,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { MovieItem, EpisodeItem, SubtitleTrack, VideoSource } from '../types';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { saveWatchProgress } from '../services/firestore';
import { getYouTubeEmbedUrl, getYouTubeId } from '../utils/youtube';

export interface CinexusPlayerProps {
  movie?: MovieItem;
  content?: MovieItem;
  src?: string;
  episode?: EpisodeItem | null;
  currentEpisode?: EpisodeItem | null;
  allEpisodes?: EpisodeItem[];
  initialTime?: number;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
  onClose?: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPrevEpisode?: boolean;
  autoPlay?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface NormalizedSource {
  id: string;
  name: string;
  url: string;
  type: 'video' | 'iframe' | 'youtube';
  quality?: string;
}

export const CinexusPlayer: React.FC<CinexusPlayerProps> = ({
  movie,
  content,
  src,
  episode,
  currentEpisode,
  allEpisodes = [],
  initialTime = 0,
  onTimeUpdate,
  onEnded,
  onClose,
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode = false,
  hasPrevEpisode = false,
  autoPlay = true
}) => {
  const activeContent = content || movie;
  const activeEpisode = episode !== undefined ? episode : currentEpisode;
  const { user } = useAuth();
  const { branding } = useBrand();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<any>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Parse & Normalize Available Playback Sources
  const [sources, setSources] = useState<NormalizedSource[]>([]);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [isTheater, setIsTheater] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string>('off');
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [hasPromptedResume, setHasPromptedResume] = useState(false);
  const [savedProgressTime, setSavedProgressTime] = useState<number | null>(null);
  const [actionPulse, setActionPulse] = useState<'play' | 'pause' | 'forward' | 'backward' | null>(null);

  // Subtitle management
  const availableSubtitles: SubtitleTrack[] = [
    ...((activeEpisode?.subtitles?.length ? activeEpisode.subtitles : activeContent?.subtitles) || []),
    { id: 'sub-en', label: 'English (CC)', language: 'en', src: 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/subtitles/sample_en.vtt' },
    { id: 'sub-si', label: 'Sinhala (සිංහල උපසිරැසි)', language: 'si', src: 'https://raw.githubusercontent.com/ash-x8/Media-Files/refs/heads/main/subtitles/sample_si.vtt' }
  ];

  // Storage key for local resume fallback
  const contentId = activeContent?.id || 'demo-media';
  const progressKey = `cinexus_progress_${contentId}${activeEpisode ? `_ep${activeEpisode.id}` : ''}`;

  // Build Comprehensive List of Playback Sources
  useEffect(() => {
    const collected: NormalizedSource[] = [];

    // 1. Resolve TMDb / IMDb IDs for real movie streaming embeds
    const tmdbId = activeContent?.tmdbId || (activeContent?.id?.startsWith('tmdb_') ? activeContent.id.replace(/^tmdb_(tv_)?/, '') : null);
    const isTvShow = activeContent?.mediaType === 'tv' || (activeContent?.mediaType as any) === 'series' || !!activeEpisode;
    const sNum = activeEpisode?.seasonNumber || 1;
    const eNum = activeEpisode?.episodeNumber || 1;

    // 2. Direct explicit prop src if provided (e.g. mp4, m3u8, or custom stream)
    if (src) {
      const isYt = !!getYouTubeId(src);
      const isEmbed = isYt || /embed|filemoon|streamtape|vidcloud|multiembed|vidsrc/i.test(src);
      collected.push({
        id: 'prop-src',
        name: isYt ? 'Official Trailer' : isEmbed ? 'Server 1 (Fast Embed)' : 'Direct 4K Master',
        url: isYt ? getYouTubeEmbedUrl(src) || src : src,
        type: isYt ? 'youtube' : isEmbed ? 'iframe' : 'video'
      });
    }

    // 3. Direct custom episode sources
    if (activeEpisode?.sources && activeEpisode.sources.length > 0) {
      activeEpisode.sources.forEach((s, idx) => {
        const isYt = !!getYouTubeId(s.url);
        const isEmbed = isYt || s.type === 'iframe' || s.type === 'embed' || /embed|filemoon|streamtape|vidsrc/i.test(s.url);
        collected.push({
          id: `ep-src-${idx}`,
          name: s.name || `Server ${idx + 1} (${s.quality || 'Auto'})`,
          url: isYt ? getYouTubeEmbedUrl(s.url) || s.url : s.url,
          type: isYt ? 'youtube' : isEmbed ? 'iframe' : 'video',
          quality: s.quality
        });
      });
    }

    // 4. Direct custom movie sources from Firestore
    if (activeContent?.sources && activeContent.sources.length > 0) {
      activeContent.sources.forEach((s: any, idx: number) => {
        const url = s.url || s.streamUrl;
        if (!url) return;
        const isYt = !!getYouTubeId(url);
        const isEmbed = isYt || s.type === 'iframe' || s.type === 'embed' || /embed|filemoon|streamtape|vidsrc/i.test(url);
        collected.push({
          id: `movie-src-${idx}`,
          name: s.name || `Cinema Server ${idx + 1}`,
          url: isYt ? getYouTubeEmbedUrl(url) || url : url,
          type: isYt ? 'youtube' : isEmbed ? 'iframe' : 'video',
          quality: s.quality
        });
      });
    }

    // 5. Universal Full Film Stream Servers (MultiEmbed, VidSrc, Embed.su, 2Embed)
    // These stream the FULL REAL MOVIE or TV EPISODE, completely free of YouTube login blocks!
    if (tmdbId || activeContent?.id) {
      const targetId = tmdbId || activeContent?.id?.replace(/^tmdb_(tv_)?/, '');

      // Server 1: MultiEmbed (Ultra Fast, High-Bandwidth 4K)
      collected.push({
        id: 'srv-multiembed',
        name: 'Server 1 (MultiEmbed 4K)',
        url: isTvShow
          ? `https://multiembed.mov/?video_id=${targetId}&tmdb=1&s=${sNum}&e=${eNum}`
          : `https://multiembed.mov/?video_id=${targetId}&tmdb=1`,
        type: 'iframe',
        quality: '4K Ultra HD'
      });

      // Server 2: VidSrc VIP (Multi-Audio & Sinhala/English Subs)
      collected.push({
        id: 'srv-vidsrc',
        name: 'Server 2 (VidSrc VIP)',
        url: isTvShow
          ? `https://vidsrc.to/embed/tv/${targetId}/${sNum}/${eNum}`
          : `https://vidsrc.to/embed/movie/${targetId}`,
        type: 'iframe',
        quality: '1080p FHD'
      });

      // Server 3: Embed.su (Ultra-Reliable CDN)
      collected.push({
        id: 'srv-embedsu',
        name: 'Server 3 (Embed.su)',
        url: isTvShow
          ? `https://embed.su/embed/tv/${targetId}/${sNum}/${eNum}`
          : `https://embed.su/embed/movie/${targetId}`,
        type: 'iframe',
        quality: '1080p'
      });

      // Server 4: 2Embed Mirror
      collected.push({
        id: 'srv-2embed',
        name: 'Server 4 (2Embed Mirror)',
        url: isTvShow
          ? `https://www.2embed.cc/embedtv/${targetId}&s=${sNum}&e=${eNum}`
          : `https://www.2embed.cc/embed/${targetId}`,
        type: 'iframe',
        quality: 'Auto'
      });
    }

    // 6. Direct MP4 / HLS master video if provided on content
    if ((activeContent as any)?.videoUrl) {
      const vUrl = (activeContent as any).videoUrl;
      const isYt = !!getYouTubeId(vUrl);
      if (!isYt) {
        collected.push({
          id: 'content-video-url',
          name: 'Direct 4K Master Feed',
          url: vUrl,
          type: 'video',
          quality: '4K Master'
        });
      }
    }

    if ((activeContent as any)?.embedUrl) {
      collected.push({
        id: 'content-embed-url',
        name: 'VIP Stream Embed',
        url: (activeContent as any).embedUrl,
        type: 'iframe'
      });
    }

    // 7. Official YouTube Trailer (ALWAYS AT THE END, LABELED AS TRAILER ONLY)
    if (activeContent?.trailerYoutubeId) {
      const embedUrl = getYouTubeEmbedUrl(activeContent.trailerYoutubeId);
      if (embedUrl) {
        collected.push({
          id: 'official-trailer',
          name: 'Trailer (Preview Only)',
          url: embedUrl,
          type: 'youtube'
        });
      }
    }

    // Fallback demo video if list is still empty
    if (collected.length === 0) {
      collected.push({
        id: 'default-demo',
        name: 'Cinexus Demo Feed',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        type: 'video'
      });
    }

    setSources(collected);
    setActiveSourceIndex(0);
    setPlaybackError(null);
    setIframeError(false);
  }, [src, activeContent, activeEpisode]);

  const currentSource: NormalizedSource | undefined = sources[activeSourceIndex] || sources[0];

  // Check saved resume time on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentTime > 15 && (!parsed.duration || parsed.currentTime < parsed.duration - 30)) {
          setSavedProgressTime(parsed.currentTime);
        }
      } else if (initialTime > 15) {
        setSavedProgressTime(initialTime);
      }
    } catch {}
  }, [progressKey, initialTime]);

  // Initialize Video element with HLS or Native Video
  useEffect(() => {
    if (!currentSource || currentSource.type !== 'video') return;
    const video = videoRef.current;
    if (!video) return;

    setPlaybackError(null);
    const videoUrl = currentSource.url;

    if (videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsRef.current = hls;
        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setPlaybackError('Stream manifest failed to load.');
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
      }
    } else {
      video.src = videoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSource]);

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sync Video Duration, Time, and Continue Watching
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const cur = video.currentTime;
    const dur = video.duration || 0;
    setCurrentTime(cur);

    if (video.buffered.length > 0) {
      setBufferedEnd(video.buffered.end(video.buffered.length - 1));
    }

    onTimeUpdate?.(cur, dur);

    // Save progress periodically
    if (Math.floor(cur) % 5 === 0 && dur > 0) {
      const percentage = Math.round((cur / dur) * 100);
      const progressPayload = {
        contentId,
        title: activeContent?.title || 'CINEXUS Title',
        posterPath: activeContent?.posterPath || activeContent?.posterUrl || null,
        backdropPath: activeContent?.backdropPath || activeContent?.backdropUrl || null,
        currentTime: cur,
        duration: dur,
        percentage,
        episodeId: activeEpisode?.id,
        episodeNumber: activeEpisode?.episodeNumber,
        seasonNumber: activeEpisode?.seasonNumber,
        episodeTitle: activeEpisode?.title,
        lastWatchedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(progressKey, JSON.stringify(progressPayload));
      } catch {}

      if (user?.id) {
        saveWatchProgress(user.id, progressPayload as any).catch(() => {});
      }
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);

    if (autoPlay) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // Pulse Feedback Action
  const triggerPulse = (action: 'play' | 'pause' | 'forward' | 'backward') => {
    setActionPulse(action);
    setTimeout(() => setActionPulse(null), 500);
  };

  // Play / Pause Toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      triggerPulse('play');
    } else {
      video.pause();
      setIsPlaying(false);
      triggerPulse('pause');
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
    video.currentTime = target;
    setCurrentTime(target);
  };

  const seekRelative = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), duration);
    triggerPulse(seconds > 0 ? 'forward' : 'backward');
  };

  // Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume > 0 ? volume : 0.8;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  // Speed
  const handleSpeedSelect = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  // Subtitle
  const handleSubtitleSelect = (lang: string) => {
    setActiveSubtitle(lang);
    setShowSubtitleMenu(false);
    const video = videoRef.current;
    if (video && video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
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

  // Picture in Picture
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Theater View
  const toggleTheater = () => {
    setIsTheater((prev) => !prev);
  };

  // Controls Auto-Hide
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3200);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          toggleTheater();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'p':
          e.preventDefault();
          togglePiP();
          break;
        case 'arrowleft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          seekRelative(10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, duration]);

  // Format Seconds
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Resume Playback
  const resumePlayback = () => {
    if (videoRef.current && savedProgressTime) {
      videoRef.current.currentTime = savedProgressTime;
      setCurrentTime(savedProgressTime);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    setHasPromptedResume(true);
    setSavedProgressTime(null);
  };

  const startFromBeginning = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    setHasPromptedResume(true);
    setSavedProgressTime(null);
  };

  // Next Server Fallback Handler
  const handleSwitchToNextServer = () => {
    if (sources.length > 1) {
      const nextIdx = (activeSourceIndex + 1) % sources.length;
      setActiveSourceIndex(nextIdx);
      setPlaybackError(null);
      setIframeError(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative bg-black rounded-3xl overflow-hidden shadow-2xl transition-all select-none group ${
        isTheater ? 'w-full max-w-7xl mx-auto aspect-video' : 'w-full aspect-video'
      } ${isFullscreen ? 'h-screen w-screen rounded-none' : ''}`}
      style={{
        boxShadow: '0 0 50px rgba(212, 175, 55, 0.15)'
      }}
    >
      {/* 1. EMBED / IFRAME PLAYER (FileMoon, YouTube, Streamtape) */}
      {currentSource?.type === 'iframe' || currentSource?.type === 'youtube' ? (
        <div className="relative w-full h-full bg-black">
          <iframe
            ref={iframeRef}
            src={currentSource.url}
            title={activeContent?.title || 'Cinexus Stream'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={() => setIframeError(true)}
          />

          {/* Iframe Fallback Barrier */}
          {iframeError && (
            <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-[#D4AF37]" />
              <h3 className="text-lg font-bold text-white">Stream Server Unreachable</h3>
              <p className="text-xs text-zinc-400 max-w-md">
                The current media provider connection timed out or is restricted in your region.
              </p>
              {sources.length > 1 && (
                <button
                  onClick={handleSwitchToNextServer}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  Switch to Backup Server
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 2. DIRECT HTML5 VIDEO PLAYER (MP4 / HLS) WITH CUSTOM CONTROLS */
        <video
          ref={videoRef}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setPlaybackError('Direct video stream encountered a decoding or network error.')}
          onEnded={() => {
            setIsPlaying(false);
            onEnded?.();
          }}
          playsInline
          className="w-full h-full object-contain cursor-pointer"
          crossOrigin="anonymous"
        >
          {availableSubtitles.map((sub) => (
            <track
              key={sub.id}
              kind="subtitles"
              label={sub.label}
              srcLang={sub.language}
              src={sub.src}
              default={sub.isDefault}
            />
          ))}
        </video>
      )}

      {/* Subtle Cinexus Watermark (Dark Gold Accented) */}
      {branding.watermarkEnabled && (
        <div
          className="absolute top-4 right-4 pointer-events-none transition-opacity duration-300 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-[#D4AF37]/30 shadow-lg"
          style={{ opacity: branding.watermarkOpacity || 0.75 }}
        >
          <img
            src={branding.logoUrl}
            alt="Cinexus"
            className="h-5 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"
          />
          <span className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase font-display hidden sm:inline">
            CINEXUS 4K
          </span>
        </div>
      )}

      {/* Top Left Close/Back Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-40 p-2.5 rounded-full bg-black/60 hover:bg-black text-white hover:text-[#D4AF37] border border-white/10 transition-all cursor-pointer backdrop-blur-md"
          title="Exit Player"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Server Selector Bar at Top (Floating Pill) */}
      {sources.length > 1 && (
        <div className="absolute top-4 left-16 z-30 hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
          <Server className="w-3.5 h-3.5 text-[#D4AF37] ml-2" />
          {sources.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSourceIndex(idx);
                setPlaybackError(null);
                setIframeError(false);
              }}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeSourceIndex === idx
                  ? 'bg-[#D4AF37] text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Center Pulse Feedback Animation */}
      {actionPulse && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-300">
          <div className="w-20 h-20 rounded-full bg-black/70 border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center shadow-2xl backdrop-blur-md">
            {actionPulse === 'play' && <Play className="w-10 h-10 fill-current ml-1" />}
            {actionPulse === 'pause' && <Pause className="w-10 h-10 fill-current" />}
            {actionPulse === 'forward' && <RotateCw className="w-10 h-10" />}
            {actionPulse === 'backward' && <RotateCcw className="w-10 h-10" />}
          </div>
        </div>
      )}

      {/* Resume Playback Floating Banner */}
      {savedProgressTime && !hasPromptedResume && currentSource?.type === 'video' && (
        <div className="absolute top-16 left-4 z-40 p-3 rounded-2xl bg-zinc-950/90 border border-[#D4AF37]/50 shadow-2xl backdrop-blur-lg flex items-center gap-3 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <div className="text-xs">
            <span className="text-zinc-300">Resume from </span>
            <span className="font-bold text-[#D4AF37]">{formatTime(savedProgressTime)}</span>?
          </div>
          <button
            onClick={resumePlayback}
            className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black rounded-lg cursor-pointer transition-all shadow-md"
          >
            Resume
          </button>
          <button
            onClick={startFromBeginning}
            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            Start Over
          </button>
        </div>
      )}

      {/* Playback Error Alert */}
      {playbackError && (
        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <h3 className="text-lg font-bold text-white">Playback Interrupted</h3>
          <p className="text-xs text-zinc-400 max-w-sm">{playbackError}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play();
                  setPlaybackError(null);
                }
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Retry Video
            </button>
            {sources.length > 1 && (
              <button
                onClick={handleSwitchToNextServer}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Switch Server
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Controls Bar (Visible for HTML5 Video or when hovering) */}
      {currentSource?.type === 'video' && (
        <div
          className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/85 to-transparent pt-16 pb-4 px-4 sm:px-6 transition-all duration-300 z-30 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          {/* Progress Seeker */}
          <div className="relative flex items-center mb-3 group/seeker">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/30 transition-all"
                style={{ width: `${(bufferedEnd / (duration || 1)) * 100}%` }}
              />
            </div>

            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 rounded-full pointer-events-none transition-all shadow-[0_0_12px_rgba(212,175,55,0.7)]"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />

            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="relative w-full h-4 opacity-0 cursor-pointer z-10"
              aria-label="Progress Bar"
            />
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between text-white text-xs gap-3">
            
            {/* Left Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full hover:bg-white/10 text-[#D4AF37] hover:text-amber-300 transition-colors cursor-pointer"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                onClick={() => seekRelative(-10)}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
                title="Rewind 10s (Left Arrow)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => seekRelative(10)}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
                title="Forward 10s (Right Arrow)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Episode Navigation */}
              {hasPrevEpisode && (
                <button
                  onClick={onPrevEpisode}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Previous Episode"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              )}

              {hasNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Next Episode"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}

              {/* Volume Control */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 bg-white/20 accent-[#D4AF37] rounded-lg cursor-pointer"
                  aria-label="Volume Slider"
                />
              </div>

              {/* Time Stamp */}
              <div className="font-mono text-[11px] text-zinc-400 select-none">
                <span className="text-white font-semibold">{formatTime(currentTime)}</span>
                <span className="mx-1">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Speed Selector Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowSubtitleMenu(false);
                    setShowSourceMenu(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                    playbackSpeed !== 1 ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Playback Speed"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-9 right-0 w-28 bg-[#12151E] border border-amber-500/30 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500">Speed</div>
                    {SPEED_OPTIONS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedSelect(speed)}
                        className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          playbackSpeed === speed ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{speed}x</span>
                        {playbackSpeed === speed && <Check className="w-3 h-3 text-black" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtitles Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSubtitleMenu(!showSubtitleMenu);
                    setShowSpeedMenu(false);
                    setShowSourceMenu(false);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeSubtitle !== 'off' ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Subtitles & Closed Captions"
                >
                  <Subtitles className="w-4 h-4" />
                </button>

                {showSubtitleMenu && (
                  <div className="absolute bottom-9 right-0 w-44 bg-[#12151E] border border-amber-500/30 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500">Subtitles</div>
                    <button
                      onClick={() => handleSubtitleSelect('off')}
                      className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        activeSubtitle === 'off' ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      <span>Off</span>
                      {activeSubtitle === 'off' && <Check className="w-3 h-3 text-black" />}
                    </button>
                    {availableSubtitles.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubtitleSelect(sub.language)}
                        className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          activeSubtitle === sub.language ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        {activeSubtitle === sub.language && <Check className="w-3 h-3 text-black" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theater Mode */}
              <button
                onClick={toggleTheater}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer hidden md:block ${
                  isTheater ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-white'
                }`}
                title={isTheater ? 'Default View (T)' : 'Theater View (T)'}
              >
                <Tv className="w-4 h-4" />
              </button>

              {/* Picture-in-Picture */}
              <button
                onClick={togglePiP}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
                title="Picture in Picture (P)"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Server Toggle Icon on Mobile */}
      {sources.length > 1 && (
        <div className="sm:hidden absolute top-4 right-16 z-30">
          <button
            onClick={() => setShowSourceMenu(!showSourceMenu)}
            className="p-2 rounded-full bg-black/60 backdrop-blur-md text-[#D4AF37] border border-white/10"
            title="Switch Server"
          >
            <Server className="w-4 h-4" />
          </button>
          {showSourceMenu && (
            <div className="absolute top-10 right-0 w-40 bg-[#12151E] border border-amber-500/30 rounded-2xl p-2 shadow-2xl z-50">
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Servers</div>
              {sources.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSourceIndex(idx);
                    setShowSourceMenu(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-xs truncate ${
                    activeSourceIndex === idx ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-300'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CinexusPlayer;
