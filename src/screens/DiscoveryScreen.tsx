import React from 'react';
import { Movie, Screen } from '@/types/movie';

interface Props {
  movies: Movie[];
  currentIndex: number;
  onLike: (movie: Movie) => void;
  onPass: () => void;
  onDetails: (movie: Movie) => void;
  onNavigate: (screen: Screen) => void;
}

export const DiscoveryScreen: React.FC<Props> = ({ movies, currentIndex, onLike, onPass, onDetails, onNavigate }) => {
  const currentMovie = movies[currentIndex];

  if (!currentMovie) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <span className="material-symbols-outlined text-primary text-6xl mb-4">sentiment_very_satisfied</span>
        <h2 className="text-2xl font-bold mb-2">Вы просмотрели всё!</h2>
        <p className="text-muted-foreground mb-8">Попробуйте другое настроение для новых находок.</p>
        <button 
          onClick={() => onNavigate('MOOD_GRID')}
          className="bg-primary px-8 py-3 rounded-xl font-bold text-primary-foreground shadow-lg shadow-primary/20"
        >
          Выбрать настроение
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4">
        <button onClick={() => onNavigate('PROFILE')} className="size-10 rounded-full glass flex items-center justify-center">
          <span className="material-symbols-outlined text-muted-foreground">person</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Movie Mood</h1>
          <div className="flex items-center justify-center gap-1">
            <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Подбор</span>
          </div>
        </div>
        <button className="size-10 rounded-full glass flex items-center justify-center">
          <span className="material-symbols-outlined text-muted-foreground">tune</span>
        </button>
      </header>

      <main className="flex-1 relative px-4 py-2 flex items-center justify-center">
        <div className="relative w-full max-w-[400px] aspect-[2/3] group">
          <div className="absolute inset-0 rounded-2xl overflow-hidden border border-border shadow-2xl bg-surface">
            <img src={currentMovie.posterUrl} className="w-full h-full object-cover" alt={currentMovie.title} />
            
            <div className="absolute top-4 left-4 z-20">
              <div className="bg-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-[16px] fill-1 text-primary-foreground">auto_awesome</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground">AI Choice</span>
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 p-6 pt-20 bg-gradient-to-t from-background via-background/90 to-transparent">
              <div className="glass p-4 rounded-xl border border-border">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-bold leading-tight">{currentMovie.title}</h2>
                  <div className="flex items-center bg-muted px-2 py-0.5 rounded-lg gap-1 border border-border">
                    <span className="material-symbols-outlined text-warning text-sm fill-1">star</span>
                    <span className="text-xs font-bold">{currentMovie.rating}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentMovie.genres.map(g => (
                    <span key={g} className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border uppercase tracking-wider">{g}</span>
                  ))}
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border uppercase tracking-wider">{currentMovie.duration}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {currentMovie.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="px-6 py-8 flex items-center justify-center gap-10">
        <button 
          onClick={onPass}
          className="group flex flex-col items-center gap-2 active:scale-90 transition-transform"
        >
          <div className="size-16 rounded-full bg-destructive/10 border-2 border-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive hover:text-primary-foreground transition-all">
            <span className="material-symbols-outlined text-3xl">close</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-destructive/50">Пропуск</span>
        </button>

        <button 
          onClick={() => onDetails(currentMovie)}
          className="group flex flex-col items-center gap-2 active:scale-90 transition-transform"
        >
          <div className="size-12 rounded-full glass border border-border text-muted-foreground flex items-center justify-center hover:text-foreground transition-all">
            <span className="material-symbols-outlined text-2xl">info</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Детали</span>
        </button>

        <button 
          onClick={() => onLike(currentMovie)}
          className="group flex flex-col items-center gap-2 active:scale-90 transition-transform"
        >
          <div className="size-16 rounded-full bg-success/10 border-2 border-success/20 text-success flex items-center justify-center hover:bg-success hover:text-primary-foreground transition-all">
            <span className="material-symbols-outlined text-3xl fill-1">favorite</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-success/50">Нравится</span>
        </button>
      </div>

      <nav className="glass-nav border-t border-border pb-10 pt-4 px-8 flex justify-between items-center">
        <button onClick={() => onNavigate('DISCOVERY')} className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined text-2xl fill-1">explore</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Обзор</span>
        </button>
        <button onClick={() => onNavigate('WATCHLIST')} className="flex flex-col items-center gap-1 text-muted-foreground">
          <span className="material-symbols-outlined text-2xl">bookmarks</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Список</span>
        </button>
        <button onClick={() => onNavigate('PROFILE')} className="flex flex-col items-center gap-1 text-muted-foreground">
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Профиль</span>
        </button>
      </nav>
    </div>
  );
};
