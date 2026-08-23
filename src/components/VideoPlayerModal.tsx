import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  X, 
  Check, 
  Bookmark, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';
import { MovieItem } from '../types';
import { PlayerWatermark } from './player/PlayerWatermark';
import { getPlaybackSources, parseEmbedCode, PlaybackSource } from '../services/embedParser';
import { BRANDING } from '../config/branding';

interface VideoPlayerModalProps {
  movie: MovieItem;
  episodeId?: string;
  initialTime?: number;
  onClose: (finalTime: number, duration: number) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  movie,
  episodeId,
  initialTime = 0,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(120);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [isSourceLoading, setIsSourceLoading] = useState(true);

  // Settings menu states
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'4K Ultra HD (2160p)' | '1080p FHD' | '720p HD' | 'Auto (Adaptive)'>('4K Ultra HD (2160p)');
  const [selectedAudio, setSelectedAudio] = useState<'Dolby Atmos 7.1' | 'DTS Digital 5.1' | 'English Stereo (Original)' | 'Director Commentary'>('Dolby Atmos 7.1');
  const [selectedSubtitle, setSelectedSubtitle] = useState<'English [CC]' | 'Sinhala [සිංහල CC]' | 'Spanish (Español)' | 'Off'>('English [CC]');
  const [aspectRatioMode, setAspectRatioMode] = useState<'original' | '16:9' | '2.39:1' | 'fill'>('original');

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<{ id: string; time: number; note: string }[]>([]);
  const [showBookmarkPrompt, setShowBookmarkPrompt] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');

  // Selected episode if TV
  const currentEpisode = episodeId 
    ? movie.episodes?.find((ep) => ep.id === episodeId) 
    : undefined;

  // Determine media source / embed
  const rawStreamInput = currentEpisode?.videoUrl || movie.demoVideoUrl;
  const playbackSources = getPlaybackSources(rawStreamInput, {
    sources: currentEpisode?.sources || movie.sources,
    servers: movie.servers,
    trailerYoutubeId: movie.trailerYoutubeId
  });
  const fallbackSource: PlaybackSource = {
    id: 'sample-fallback',
    title: 'Sample Preview',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'video',
    providerName: 'Google Cloud sample'
  };
  const activeSource = playbackSources[selectedSourceIndex] || playbackSources[0] || fallbackSource;
  const parsed = parseEmbedCode(activeSource.url);

  const isIframeEmbed = activeSource.type === 'iframe';

  const calculatedAspectRatio = parsed.embed?.aspectRatio || (16 / 9);

  // Controls timer
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceToNextSource = () => {
    if (selectedSourceIndex < playbackSources.length - 1) {
      setSelectedSourceIndex(index => index + 1);
      setPlayerError(null);
      setIsSourceLoading(true);
      return;
    }
    setIsSourceLoading(false);
    setPlayerError('Every configured source failed. Try the official trailer or check back later.');
  };

  const selectSource = (index: number) => {
    setSelectedSourceIndex(index);
    setPlayerError(null);
    setIsSourceLoading(true);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettingsMenu(false);
      }
    }, 3500);
  };

  useEffect(() => {
    setSelectedSourceIndex(0);
    setPlayerError(null);
  }, [rawStreamInput, episodeId, movie.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (isIframeEmbed) {
      sourceTimeoutRef.current = setTimeout(() => {
        advanceToNextSource();
      }, 9000);
      return () => {
        if (sourceTimeoutRef.current) clearTimeout(sourceTimeoutRef.current);
      };
    }
    if (!video) return;

    if (initialTime > 0) {
      video.currentTime = initialTime;
    }

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };
    const handleError = () => {
      advanceToNextSource();
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsPlaying(false));
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('error', handleError);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [initialTime, isIframeEmbed, selectedSourceIndex, activeSource.url]);

  const togglePlay = () => {
    if (isIframeEmbed) return;
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed:', err);
    }
  };

  const addBookmark = () => {
    if (!bookmarkNote.trim()) return;
    const newBm = {
      id: `bm_${Date.now()}`,
      time: currentTime,
      note: bookmarkNote.trim()
    };
    setBookmarks([...bookmarks, newBm]);
    setBookmarkNote('');
    setShowBookmarkPrompt(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleClose = () => {
    onClose(currentTime, duration);
  };

  return (
    <div
      ref={containerRef}
      id="cinexus-video-player"
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-[#07090e] flex items-center justify-center select-none overflow-hidden"
    >
      {/* Ambient Cinema Lighting Glow */}
      {ambientGlow && (
        <div 
          className="absolute inset-0 opacity-30 blur-3xl pointer-events-none transition-all duration-700"
          style={{
            background: 'radial-gradient(circle, rgba(229, 9, 20, 0.4) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(7, 9, 14, 0.95) 85%)'
          }}
        />
      )}

      {/* Official CINEXUS Player Watermark Overlay */}
      <PlayerWatermark position="top-right" opacity={0.75} />

      {/* Video Content Container with exact aspect ratio preservation */}
      <div 
        className="relative w-full max-w-[1240px] max-h-[92vh] flex items-center justify-center transition-all duration-300 px-2 sm:px-4"
      >
        <div 
          className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl border border-white/10 flex items-center justify-center"
          style={{
            aspectRatio: aspectRatioMode === 'original' 
              ? `${calculatedAspectRatio}` 
              : aspectRatioMode === '2.39:1'
              ? '2.39 / 1'
              : aspectRatioMode === '16:9'
              ? '16 / 9'
              : 'auto'
          }}
        >
          {playerError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 text-white space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Playback Stream Unavailable</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  {playerError}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    selectSource(selectedSourceIndex);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Stream</span>
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Back to Cinema
                </button>
              </div>
            </div>
          ) : isIframeEmbed ? (
            <iframe
              ref={iframeRef}
              src={activeSource.url}
              title={`CINEXUS Video Player - ${movie.title}`}
              className="w-full h-full border-0 aspect-video"
              allow={parsed.embed?.allow || "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"}
              allowFullScreen={parsed.embed?.allowFullscreen ?? true}
              onLoad={() => {
                setIsSourceLoading(false);
                if (sourceTimeoutRef.current) clearTimeout(sourceTimeoutRef.current);
              }}
              onError={advanceToNextSource}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              src={activeSource.url}
              onLoadStart={() => setIsSourceLoading(true)}
              onCanPlay={() => setIsSourceLoading(false)}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
            />
          )}

          {isSourceLoading && !playerError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/20">
              <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs text-slate-200">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-red-400" />
                Loading {activeSource.title}...
              </div>
            </div>
          )}

          {/* Subtitles Overlay if enabled */}
          {selectedSubtitle !== 'Off' && !isIframeEmbed && !playerError && (
            <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none px-6 z-20">
              <span className="inline-block bg-black/85 text-amber-300 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold tracking-wide shadow-lg border border-black/50">
                {selectedSubtitle.includes('Sinhala') 
                  ? '[සිංහල උපසිරැසි]: CINEXUS මාස්ටර් සිනමා අත්දැකීමට සාදරයෙන් පිළිගනිමු.' 
                  : `[Narrator]: Welcome to ${BRANDING.name} Master Cinema Experience.`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top Header Bar */}
      <div 
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="player-back-btn"
            onClick={handleClose}
            className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Back to Catalog"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-600 font-bold text-[10px] text-white uppercase tracking-wider">
                {selectedQuality.split(' ')[0]}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-medium">
                {selectedAudio.split(' ')[0]}
              </span>
              {isIframeEmbed && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-400 font-bold">
                  {parsed.embed?.providerName || 'AUTHORIZED EMBED'}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight mt-0.5">
              {movie.title}
              {currentEpisode && <span className="text-slate-300 font-normal"> — Ep {currentEpisode.episodeNumber}: {currentEpisode.title}</span>}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ambient Glow Toggle */}
          <button
            onClick={() => setAmbientGlow(!ambientGlow)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              ambientGlow ? 'bg-red-600/20 border-red-500/50 text-red-300' : 'bg-slate-900/80 border-slate-700 text-slate-400'
            }`}
            title="Toggle Ambient Cinema Lighting"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Cinema Mood</span>
          </button>

          {/* Bookmark Timestamp Trigger */}
          <button
            onClick={() => setShowBookmarkPrompt(true)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
            title="Bookmark Scene Timestamp"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Bookmark</span>
          </button>
        </div>
      </div>

      {/* Bookmark Modal Prompt */}
      {showBookmarkPrompt && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0b0f17] border border-slate-700 p-5 rounded-2xl max-w-sm w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Bookmark Scene ({formatTime(currentTime)})</span>
              </h4>
              <button onClick={() => setShowBookmarkPrompt(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. Master duel sequence..."
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBookmarkPrompt(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={addBookmark}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar (native video streams) */}
      {!isIframeEmbed && (
        <div 
          className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-30 transition-opacity duration-300 space-y-3 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Timeline Bar */}
          <div className="relative flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
            />
          </div>

          {/* Controls Cluster */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 10);
                }}
                className="p-2 text-slate-300 hover:text-white"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = Math.min(duration, currentTime + 10);
                }}
                className="p-2 text-slate-300 hover:text-white"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-slate-300 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-slate-700 rounded appearance-none accent-red-500"
                />
              </div>

              <div className="text-xs font-mono text-slate-300">
                <span>{formatTime(currentTime)}</span>
                <span className="text-slate-500"> / </span>
                <span className="text-slate-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ${
                  showSettingsMenu ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900/80 border-slate-700 text-slate-300'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-all"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Popup Menu */}
      {showSettingsMenu && (
        <div className="absolute bottom-20 right-6 z-40 bg-[#0b0f17] border border-slate-700 rounded-2xl p-4 w-72 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Playback Master Config</span>
            <button onClick={() => setShowSettingsMenu(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Playback Source</span>
              <select
                value={selectedSourceIndex}
                onChange={(e) => selectSource(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              >
                {playbackSources.map((source, index) => (
                  <option key={source.id} value={index}>{source.title} - {source.providerName}</option>
                ))}
                {playbackSources.length === 0 && <option value={0}>{fallbackSource.title}</option>}
              </select>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Quality Profile</span>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              >
                <option value="4K Ultra HD (2160p)">4K Ultra HD (2160p)</option>
                <option value="1080p FHD">1080p FHD (1080p)</option>
                <option value="720p HD">720p HD (720p)</option>
                <option value="Auto (Adaptive)">Auto (Adaptive Bitrate)</option>
              </select>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Subtitles & Audio</span>
              <select
                value={selectedSubtitle}
                onChange={(e) => setSelectedSubtitle(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none mb-1.5"
              >
                <option value="English [CC]">English [CC]</option>
                <option value="Sinhala [සිංහල CC]">Sinhala [සිංහල CC]</option>
                <option value="Spanish (Español)">Spanish (Español)</option>
                <option value="Off">Subtitles Off</option>
              </select>

              <select
                value={selectedAudio}
                onChange={(e) => setSelectedAudio(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              >
                <option value="Dolby Atmos 7.1">Dolby Atmos 7.1 Lossless</option>
                <option value="DTS Digital 5.1">DTS Digital 5.1</option>
                <option value="English Stereo (Original)">English Stereo Original</option>
              </select>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Aspect Ratio Scaling</span>
              <div className="grid grid-cols-3 gap-1">
                {(['original', '16:9', '2.39:1'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAspectRatioMode(mode)}
                    className={`py-1 rounded-lg border text-[10px] font-semibold uppercase ${
                      aspectRatioMode === mode ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
