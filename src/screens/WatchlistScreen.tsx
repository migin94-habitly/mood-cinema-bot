import React from 'react';
import { Movie, Screen } from '@/types/movie';

interface Props {
  movies: Movie[];
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
}

export const WatchlistScreen: React.FC<Props> = ({ movies, onBack, onNavigate }) => {
  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <header className="sticky top-0 z-50 glass border-b border-primary/10 px-4 py-4 flex items-center justify-between">
        <button onClick={onBack} className="size-10 rounded-full hover:bg-muted flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold">Ваш Шортлист</h1>
        <button className="size-10 rounded-full hover:bg-muted flex items-center justify-center">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      <main className="flex-1 p-4 pb-32 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6 text-primary">
          <span className="material-symbols-outlined active-icon">auto_awesome</span>
          <span className="text-xs font-bold uppercase tracking-widest">{movies.length} ФИЛЬМОВ ВЫБРАНО</span>
        </div>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">heart_broken</span>
            <p>Ваш список пуст.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {movies.map(movie => (
              <div key={movie.id} className="flex flex-col gap-2">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-border">
                  <img src={movie.posterUrl} className="w-full h-full object-cover" alt={movie.title} />
                  <div className="absolute top-2 right-2 size-7 glass rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-sm fill-1">favorite</span>
                  </div>
                </div>
                <h3 className="font-bold text-sm truncate px-1">{movie.title}</h3>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[9px] text-warning font-bold">IMDB {movie.ratingImdb}</span>
                  <span className="text-[9px] text-primary font-bold">КП {movie.ratingKinopoisk}</span>
                </div>
                <p className="text-[10px] text-muted-foreground px-1 font-medium">{movie.platform} • {movie.year}</p>
                <button className="mt-1 w-full py-2 bg-primary text-primary-foreground text-[11px] font-bold rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  Смотреть
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-nav border-t border-border pb-10 pt-4 px-10 flex justify-between items-center">
        <button onClick={() => onNavigate('DISCOVERY')} className="flex flex-col items-center gap-1 text-muted-foreground">
          <span className="material-symbols-outlined text-2xl">explore</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Обзор</span>
        </button>
        <button onClick={() => onNavigate('WATCHLIST')} className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined text-2xl fill-1">favorite</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Шортлист</span>
        </button>
        <button onClick={() => onNavigate('PROFILE')} className="flex flex-col items-center gap-1 text-muted-foreground">
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Профиль</span>
        </button>
      </nav>
    </div>
  );
};
