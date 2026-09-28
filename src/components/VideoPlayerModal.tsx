import React from 'react';
import { MovieItem, EpisodeItem } from '../types';
import { CinexusPlayer } from './player/CinexusPlayer';

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
  const currentEpisode = episodeId
    ? movie.episodes?.find((ep: EpisodeItem) => ep.id === episodeId)
    : undefined;

  let lastTime = initialTime;
  let lastDuration = 0;

  const handleClose = () => {
    onClose(lastTime, lastDuration);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col justify-center">
        <CinexusPlayer
          movie={movie}
          currentEpisode={currentEpisode}
          allEpisodes={movie.episodes || []}
          initialTime={initialTime}
          onTimeUpdate={(time: number, dur: number) => {
            lastTime = time;
            lastDuration = dur;
          }}
          onClose={handleClose}
        />
      </div>
    </div>
  );
};
