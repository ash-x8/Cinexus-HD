import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MovieItem, EpisodeItem, VideoSource, WatchProgress } from '../types';
import { useAuth } from './AuthContext';
import {
  saveWatchProgress,
  getUserWatchProgress,
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist
} from '../services/firestore';

interface PlayerContextType {
  activeContent: MovieItem | null;
  activeEpisode: EpisodeItem | null;
  activeSource: VideoSource | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  watchlist: string[];
  watchProgressMap: Record<string, WatchProgress>;
  playContent: (content: MovieItem, episode?: EpisodeItem, source?: VideoSource) => void;
  closePlayer: () => void;
  updateProgress: (currentTime: number, duration: number) => void;
  toggleWatchlist: (movie: MovieItem) => Promise<void>;
  isInWatchlist: (contentId: string) => boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeContent, setActiveContent] = useState<MovieItem | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<EpisodeItem | null>(null);
  const [activeSource, setActiveSource] = useState<VideoSource | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cinexus_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [watchProgressMap, setWatchProgressMap] = useState<Record<string, WatchProgress>>(() => {
    try {
      const saved = localStorage.getItem('cinexus_history');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load user watch progress & watchlist from Firestore when logged in
  useEffect(() => {
    if (!user?.id) return;

    getUserWatchlist(user.id).then((serverWatchlist) => {
      if (serverWatchlist.length > 0) {
        setWatchlist((prev) => Array.from(new Set([...prev, ...serverWatchlist])));
      }
    });

    getUserWatchProgress(user.id).then((serverProgress) => {
      if (Object.keys(serverProgress).length > 0) {
        setWatchProgressMap((prev) => ({ ...prev, ...serverProgress }));
      }
    });
  }, [user?.id]);

  const playContent = (content: MovieItem, episode?: EpisodeItem, source?: VideoSource) => {
    setActiveContent(content);
    setActiveEpisode(episode || null);

    // Pick best available source: requested source -> default source -> first source -> trailer
    const availableSources = episode?.sources?.length ? episode.sources : content.sources || [];
    const chosen = source || availableSources.find((s) => s.isDefault) || availableSources[0] || null;
    setActiveSource(chosen);
    setIsPlaying(true);
  };

  const closePlayer = () => {
    setIsPlaying(false);
    setActiveContent(null);
    setActiveEpisode(null);
    setActiveSource(null);
    setCurrentTime(0);
  };

  const updateProgress = (curTime: number, totalDuration: number) => {
    if (!activeContent || totalDuration <= 0) return;
    setCurrentTime(curTime);
    setDuration(totalDuration);

    const percentage = Math.min(100, Math.round((curTime / totalDuration) * 100));
    const contentKey = activeEpisode ? `${activeContent.id}_${activeEpisode.id}` : activeContent.id;

    const progress: WatchProgress = {
      contentId: activeContent.id,
      movieId: activeContent.id,
      episodeId: activeEpisode?.id,
      seriesId: activeContent.mediaType !== 'movie' ? activeContent.id : undefined,
      seasonNumber: activeEpisode?.seasonNumber,
      episodeNumber: activeEpisode?.episodeNumber,
      episodeTitle: activeEpisode?.title,
      contentType: activeContent.mediaType === 'movie' ? 'movie' : 'tv',
      title: activeContent.title,
      posterPath: activeContent.posterPath,
      backdropPath: activeContent.backdropPath,
      currentTime: curTime,
      duration: totalDuration,
      percentage,
      lastWatchedAt: new Date().toISOString()
    };

    setWatchProgressMap((prev) => {
      const updated = { ...prev, [contentKey]: progress };
      try {
        localStorage.setItem('cinexus_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user?.id) {
      saveWatchProgress(user.id, progress);
    }
  };

  const toggleWatchlist = async (movie: MovieItem) => {
    const isSaved = watchlist.includes(movie.id);
    const updated = isSaved ? watchlist.filter((id) => id !== movie.id) : [movie.id, ...watchlist];

    setWatchlist(updated);
    try {
      localStorage.setItem('cinexus_watchlist', JSON.stringify(updated));
    } catch {}

    if (user?.id) {
      if (isSaved) {
        await removeFromWatchlist(user.id, movie.id);
      } else {
        await addToWatchlist(user.id, movie);
      }
    }
  };

  const isInWatchlist = (contentId: string) => watchlist.includes(contentId);

  return (
    <PlayerContext.Provider
      value={{
        activeContent,
        activeEpisode,
        activeSource,
        isPlaying,
        currentTime,
        duration,
        watchlist,
        watchProgressMap,
        playContent,
        closePlayer,
        updateProgress,
        toggleWatchlist,
        isInWatchlist
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
