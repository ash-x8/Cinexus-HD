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
  Tv, 
  Sliders, 
  Subtitles, 
  Radio, 
  Layers 
} from 'lucide-react';
import { MovieItem } from '../types';

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

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(120); // fallback 120s
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ambientGlow, setAmbientGlow] = useState(true);

  // Settings menu states
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeSettingsSubmenu, setActiveSettingsSubmenu] = useState<'main' | 'quality' | 'audio' | 'subtitles' | 'speed' | 'aspect'>('main');
  
  const [selectedQuality, setSelectedQuality] = useState<'4K Ultra HD (2160p)' | '1080p FHD' | '720p HD' | 'Auto (Adaptive)'>('4K Ultra HD (2160p)');
  const [selectedAudio, setSelectedAudio] = useState<'Dolby Atmos 7.1' | 'DTS Digital 5.1' | 'English Stereo (Original)' | 'Director Commentary'>('Dolby Atmos 7.1');
  const [selectedSubtitle, setSelectedSubtitle] = useState<'English [CC]' | 'Spanish (Español)' | 'French (Français)' | 'Japanese (日本語)' | 'Off'>('English [CC]');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<'cinematic' | 'standard' | 'fit'>('cinematic');

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<{ id: string; time: number; note: string }[]>([]);
  const [showBookmarkPrompt, setShowBookmarkPrompt] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');

  // Selected episode if applicable
  const currentEpisode = episodeId 
    ? movie.episodes?.find((ep) => ep.id === episodeId) 
    : undefined;

  const videoSource = currentEpisode?.videoUrl || movie.demoVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  // Controls auto-hide timer
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const video = videoRef.current;
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

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [initialTime]);

  const togglePlay = () => {
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
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = volume || 0.8;
    } else {
      videoRef.current.muted = true;
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
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setActiveSettingsSubmenu('main');
  };

  const addBookmark = () => {
    if (!bookmarkNote.trim()) return;
    setBookmarks([...bookmarks, { id: `bm-${Date.now()}`, time: currentTime, note: bookmarkNote.trim() }]);
    setBookmarkNote('');
    setShowBookmarkPrompt(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
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
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Ambient Cinema Lighting Glow behind video */}
      {ambientGlow && (
        <div 
          className="absolute inset-0 opacity-40 blur-3xl pointer-events-none transition-all duration-700"
          style={{
            background: 'radial-gradient(circle, rgba(229, 9, 20, 0.45) 0%, rgba(0, 229, 255, 0.25) 45%, rgba(0,0,0,0.9) 80%)'
          }}
        />
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        src={videoSource}
        onClick={togglePlay}
        className={`w-full h-full cursor-pointer transition-all duration-300 ${
          aspectRatio === 'cinematic' 
            ? 'max-h-[88vh] object-contain aspect-[2.39/1]' 
            : aspectRatio === 'standard' 
            ? 'max-h-[92vh] object-contain aspect-video' 
            : 'object-cover'
        }`}
      />

      {/* Subtitles Overlay if active */}
      {selectedSubtitle !== 'Off' && (
        <div className="absolute bottom-28 left-0 right-0 text-center pointer-events-none px-6 z-20">
          <span className="inline-block bg-black/85 text-yellow-300 px-4 py-1.5 rounded-lg text-sm sm:text-base font-semibold tracking-wide shadow-lg border border-black/50">
            [Narrator]: Welcome to Cinexus HD Master Experience.
          </span>
        </div>
      )}

      {/* Top Header Bar */}
      <div 
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="player-back-btn"
            onClick={handleClose}
            className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-all"
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
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
              {movie.title}
              {currentEpisode && <span className="text-slate-300 font-normal"> — Ep {currentEpisode.episodeNumber}: {currentEpisode.title}</span>}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ambient Glow Toggle */}
          <button
            onClick={() => setAmbientGlow(!ambientGlow)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              ambientGlow ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900/80 border-slate-700 text-slate-400'
            }`}
            title="Toggle Ambient Cinema Glow"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Ambient Mood</span>
          </button>

          {/* Bookmark Timestamp Trigger */}
          <button
            onClick={() => setShowBookmarkPrompt(true)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
            title="Bookmark Scene Timestamp"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Bookmark</span>
          </button>
        </div>
      </div>

      {/* Bookmark Modal Prompt */}
      {showBookmarkPrompt && (
        <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0c1017] border border-slate-700 p-5 rounded-2xl max-w-sm w-full space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>Save Scene at {formatTime(currentTime)}</span>
            </h4>
            <input
              type="text"
              placeholder="e.g. Incredible action climax, Epic score"
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBookmarkPrompt(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={addBookmark}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Menu Popup */}
      {showSettingsMenu && (
        <div className="absolute bottom-24 right-6 sm:right-12 z-40 w-72 bg-[#0c1017]/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-3 text-xs text-slate-200">
          
          {/* Main Settings Menu */}
          {activeSettingsSubmenu === 'main' && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Playback Configuration
              </div>
              <button
                onClick={() => setActiveSettingsSubmenu('quality')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-red-500" />
                  <span>Quality</span>
                </div>
                <span className="text-slate-400 text-[11px] font-mono">{selectedQuality.split(' ')[0]}</span>
              </button>

              <button
                onClick={() => setActiveSettingsSubmenu('audio')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>Audio Stream</span>
                </div>
                <span className="text-slate-400 text-[11px] font-mono">{selectedAudio.split(' ')[0]}</span>
              </button>

              <button
                onClick={() => setActiveSettingsSubmenu('subtitles')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Subtitles className="w-4 h-4 text-amber-400" />
                  <span>Subtitles</span>
                </div>
                <span className="text-slate-400 text-[11px]">{selectedSubtitle.split(' ')[0]}</span>
              </button>

              <button
                onClick={() => setActiveSettingsSubmenu('speed')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Playback Speed</span>
                </div>
                <span className="text-slate-400 text-[11px] font-mono">{playbackSpeed}x</span>
              </button>

              <button
                onClick={() => setActiveSettingsSubmenu('aspect')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Aspect Ratio</span>
                </div>
                <span className="text-slate-400 text-[11px] capitalize">{aspectRatio}</span>
              </button>
            </div>
          )}

          {/* Quality Submenu */}
          {activeSettingsSubmenu === 'quality' && (
            <div className="space-y-1">
              <button 
                onClick={() => setActiveSettingsSubmenu('main')}
                className="text-slate-400 hover:text-white text-[11px] font-bold p-1 mb-1"
              >
                ← Back
              </button>
              {(['4K Ultra HD (2160p)', '1080p FHD', '720p HD', 'Auto (Adaptive)'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => { setSelectedQuality(q); setActiveSettingsSubmenu('main'); }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
                >
                  <span>{q}</span>
                  {selectedQuality === q && <Check className="w-3.5 h-3.5 text-red-500" />}
                </button>
              ))}
            </div>
          )}

          {/* Audio Submenu */}
          {activeSettingsSubmenu === 'audio' && (
            <div className="space-y-1">
              <button 
                onClick={() => setActiveSettingsSubmenu('main')}
                className="text-slate-400 hover:text-white text-[11px] font-bold p-1 mb-1"
              >
                ← Back
              </button>
              {(['Dolby Atmos 7.1', 'DTS Digital 5.1', 'English Stereo (Original)', 'Director Commentary'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => { setSelectedAudio(a); setActiveSettingsSubmenu('main'); }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
                >
                  <span>{a}</span>
                  {selectedAudio === a && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}

          {/* Subtitles Submenu */}
          {activeSettingsSubmenu === 'subtitles' && (
            <div className="space-y-1">
              <button 
                onClick={() => setActiveSettingsSubmenu('main')}
                className="text-slate-400 hover:text-white text-[11px] font-bold p-1 mb-1"
              >
                ← Back
              </button>
              {(['English [CC]', 'Spanish (Español)', 'French (Français)', 'Japanese (日本語)', 'Off'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setSelectedSubtitle(s); setActiveSettingsSubmenu('main'); }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
                >
                  <span>{s}</span>
                  {selectedSubtitle === s && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          )}

          {/* Speed Submenu */}
          {activeSettingsSubmenu === 'speed' && (
            <div className="space-y-1">
              <button 
                onClick={() => setActiveSettingsSubmenu('main')}
                className="text-slate-400 hover:text-white text-[11px] font-bold p-1 mb-1"
              >
                ← Back
              </button>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
                >
                  <span>{spd}x {spd === 1 ? '(Normal)' : ''}</span>
                  {playbackSpeed === spd && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}

          {/* Aspect Ratio Submenu */}
          {activeSettingsSubmenu === 'aspect' && (
            <div className="space-y-1">
              <button 
                onClick={() => setActiveSettingsSubmenu('main')}
                className="text-slate-400 hover:text-white text-[11px] font-bold p-1 mb-1"
              >
                ← Back
              </button>
              {[
                { id: 'cinematic', label: '2.39:1 Anamorphic Cinema' },
                { id: 'standard', label: '16:9 Standard Wide' },
                { id: 'fit', label: 'Stretch to Full Screen' }
              ].map((asp) => (
                <button
                  key={asp.id}
                  onClick={() => { setAspectRatio(asp.id as any); setActiveSettingsSubmenu('main'); }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
                >
                  <span>{asp.label}</span>
                  {aspectRatio === asp.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Bottom Controls Bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-30 transition-opacity duration-300 space-y-3 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div className="relative flex items-center group">
          <input
            id="video-scrubber"
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 hover:h-2 rounded-lg appearance-none cursor-pointer accent-red-600 transition-all"
          />

          {/* Saved Bookmarks Tick Marks */}
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = bm.time;
                  setCurrentTime(bm.time);
                }
              }}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 hover:scale-150 cursor-pointer transition-transform"
              style={{ left: `${(bm.time / (duration || 1)) * 100}%` }}
              title={`Bookmark: ${bm.note} (${formatTime(bm.time)})`}
            />
          ))}
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-slate-100">
          
          {/* Left Controls: Play, Skip, Volume, Timestamps */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Play/Pause */}
            <button
              id="player-play-toggle-btn"
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            {/* Skip Backward 10s */}
            <button
              id="player-rewind-btn"
              onClick={() => handleSkip(-10)}
              className="text-slate-300 hover:text-white transition-colors p-1"
              title="Rewind 10s"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Skip Forward 10s */}
            <button
              id="player-forward-btn"
              onClick={() => handleSkip(10)}
              className="text-slate-300 hover:text-white transition-colors p-1"
              title="Forward 10s"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Volume & Slider */}
            <div className="flex items-center gap-2 group/vol">
              <button
                id="player-volume-mute-btn"
                onClick={toggleMute}
                className="text-slate-300 hover:text-white p-1"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                id="player-volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-slate-700 appearance-none rounded cursor-pointer accent-red-500"
              />
            </div>

            {/* Time Stamp display */}
            <div className="text-xs font-mono text-slate-300 select-none">
              <span>{formatTime(currentTime)}</span>
              <span className="text-slate-500"> / </span>
              <span>{formatTime(duration)}</span>
            </div>

          </div>

          {/* Right Controls: Settings, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Settings Menu Button */}
            <button
              id="player-settings-btn"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`p-2 rounded-xl border transition-all ${
                showSettingsMenu 
                  ? 'bg-red-600/30 border-red-500 text-red-400' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Audio, Subtitles & Quality"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              id="player-fullscreen-btn"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};
