import React from 'react';
import { MovieDetailsModal } from './MovieDetailsModal';
import { MovieItem } from '../types';

export interface MovieDetailModalProps {
  movie: MovieItem;
  isOpen?: boolean;
  onClose: () => void;
  onPlayMovie?: (movie: MovieItem, episodeId?: string) => void;
  isInWatchlist?: (movieId: string) => boolean;
  onToggleWatchlist?: (movie: MovieItem) => void;
  onOpenWatchPartyWithMovie?: (movie: MovieItem) => void;
  onOpenDownloadsWithMovie?: (movie: MovieItem) => void;
  allMovies?: MovieItem[];
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  isOpen = true,
  onClose,
  onPlayMovie = () => {},
  isInWatchlist = () => false,
  onToggleWatchlist = () => {},
  onOpenWatchPartyWithMovie = () => {},
  onOpenDownloadsWithMovie = () => {},
  allMovies = []
}) => {
  if (!isOpen || !movie) return null;

  return (
    <MovieDetailsModal
      movie={movie}
      onClose={onClose}
      onPlayMovie={onPlayMovie}
      isInWatchlist={isInWatchlist}
      onToggleWatchlist={onToggleWatchlist}
      onOpenWatchPartyWithMovie={onOpenWatchPartyWithMovie}
      onOpenDownloadsWithMovie={onOpenDownloadsWithMovie}
      allMovies={allMovies}
    />
  );
};

export { MovieDetailsModal };
export default MovieDetailModal;
