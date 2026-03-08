export type MoodType = 'Epic' | 'Romantic' | 'Scared' | 'Funny' | 'Mysterious' | 'Relaxed';

export interface Movie {
  id: string;
  title: string;
  titleOriginal: string;
  year: number;
  duration: string;
  ratingImdb: number;
  ratingKinopoisk: number;
  genres: string[];
  description: string;
  posterUrl: string;
  platform: string;
  type: 'movie' | 'series';
  actors: Actor[];
}

export interface Actor {
  name: string;
  imageUrl: string;
}

export type Screen = 'WELCOME' | 'MOOD_GRID' | 'AI_PROCESSING' | 'DISCOVERY' | 'WATCHLIST' | 'PROFILE' | 'DETAILS';

export interface AppState {
  currentScreen: Screen;
  selectedMood: MoodType | null;
  watchlist: Movie[];
  movies: Movie[];
  currentMovieIndex: number;
  selectedMovie: Movie | null;
}
