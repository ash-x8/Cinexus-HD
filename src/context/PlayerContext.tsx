import React, { createContext, useContext, useState } from 'react';
import { MovieItem, EpisodeItem, VideoSource } from '../types';

interface PlayerContextType {
  activeItem: MovieItem | null;
  activeEpisode: EpisodeItem | null;
  activeSource: VideoSource | null;
  isPlaying: boolean;
  trailerModalItem: MovieItem | null;
  quickPreviewItem: MovieItem | null;
  techSpecsItem: MovieItem | null;
  watchPartyItem: MovieItem | null;
  downloadModalItem: MovieItem | null;
  
  playContent: (item: MovieItem, episode?: EpisodeItem, source?: VideoSource) => void;
  closePlayer: () => void;
  openTrailer: (item: MovieItem) => void;
  closeTrailer: () => void;
  openQuickPreview: (item: MovieItem) => void;
  closeQuickPreview: () => void;
  openTechSpecs: (item: MovieItem) => void;
  closeTechSpecs: () => void;
  openWatchParty: (item: MovieItem) => void;
  closeWatchParty: () => void;
  openDownloadModal: (item: MovieItem) => void;
  closeDownloadModal: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeItem, setActiveItem] = useState<MovieItem | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<EpisodeItem | null>(null);
  const [activeSource, setActiveSource] = useState<VideoSource | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [trailerModalItem, setTrailerModalItem] = useState<MovieItem | null>(null);
  const [quickPreviewItem, setQuickPreviewItem] = useState<MovieItem | null>(null);
  const [techSpecsItem, setTechSpecsItem] = useState<MovieItem | null>(null);
  const [watchPartyItem, setWatchPartyItem] = useState<MovieItem | null>(null);
  const [downloadModalItem, setDownloadModalItem] = useState<MovieItem | null>(null);

  const playContent = (item: MovieItem, episode?: EpisodeItem, source?: VideoSource) => {
    setActiveItem(item);
    setActiveEpisode(episode || null);
    
    // Choose source
    const defaultSrc = source || episode?.sources?.[0] || item.sources?.[0] || {
      id: `src_default`,
      title: '4K Cinema Master',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'mp4',
      quality: '4K'
    };
    setActiveSource(defaultSrc);
    setIsPlaying(true);

    // Close preview modals if open
    setQuickPreviewItem(null);
    setTrailerModalItem(null);
  };

  const closePlayer = () => {
    setIsPlaying(false);
    setActiveItem(null);
    setActiveEpisode(null);
    setActiveSource(null);
  };

  return (
    <PlayerContext.Provider
      value={{
        activeItem,
        activeEpisode,
        activeSource,
        isPlaying,
        trailerModalItem,
        quickPreviewItem,
        techSpecsItem,
        watchPartyItem,
        downloadModalItem,
        playContent,
        closePlayer,
        openTrailer: setTrailerModalItem,
        closeTrailer: () => setTrailerModalItem(null),
        openQuickPreview: setQuickPreviewItem,
        closeQuickPreview: () => setQuickPreviewItem(null),
        openTechSpecs: setTechSpecsItem,
        closeTechSpecs: () => setTechSpecsItem(null),
        openWatchParty: setWatchPartyItem,
        closeWatchParty: () => setWatchPartyItem(null),
        openDownloadModal: setDownloadModalItem,
        closeDownloadModal: () => setDownloadModalItem(null)
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
};
