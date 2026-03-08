import React from 'react';
import { Movie } from '@/types/movie';

interface Props {
  movie: Movie;
  onBack: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
}

export const DetailsScreen: React.FC<Props> = ({ movie, onBack, isInWatchlist, onToggleWatchlist }) => {
  const handleShare = async () => {
    const shareText = `Посмотри: ${movie.title} (${movie.year}). IMDB: ${movie.ratingImdb}, КП: ${movie.ratingKinopoisk}. Рекомендация от Movie Mood AI!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: movie.title, text: shareText, url: shareUrl });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-y-auto">
      <div className="relative h-[50vh] shrink-0">
        <img src={movie.posterUrl} className="w-full h-full object-cover" alt={movie.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute top-8 inset-x-6 flex items-center justify-between z-20">
          <button onClick={onBack} className="size-10 glass rounded-xl flex items-center justify-center transition-transform active:scale-90">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button onClick={handleShare} className="size-10 glass rounded-xl flex items-center justify-center transition-transform active:scale-90">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </div>

      <div className="relative -mt-20 px-6 pb-48 z-10 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {movie.platform && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 rounded">{movie.platform}</span>
            )}
            {movie.type === 'series' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-success/20 text-success border border-success/30 rounded">Сериал</span>
            )}
            <div className="flex items-center gap-1 text-warning">
              <span className="text-[10px] font-bold">IMDB</span>
              <span className="text-sm font-bold">{movie.ratingImdb}</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <span className="text-[10px] font-bold">КП</span>
              <span className="text-sm font-bold">{movie.ratingKinopoisk}</span>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">{movie.title}</h1>
          {movie.titleOriginal && movie.titleOriginal !== movie.title && (
            <p className="text-muted-foreground text-xs">{movie.titleOriginal}</p>
          )}
          <p className="text-muted-foreground text-sm font-medium">{movie.year} • {movie.duration} • {movie.genres.join(', ')}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">О фильме</h3>
          <p className="text-muted-foreground leading-relaxed text-sm">
            {movie.description}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">В ролях</h3>
          <div className="flex overflow-x-auto gap-4 hide-scrollbar">
            {movie.actors.map(actor => (
              <div key={actor.name} className="flex flex-col items-center gap-2 min-w-[80px]">
                <div className="size-16 rounded-2xl overflow-hidden border border-border shadow-md">
                  <img src={actor.imageUrl} className="w-full h-full object-cover" alt={actor.name} />
                </div>
                <span className="text-[10px] text-center font-medium text-muted-foreground leading-tight">{actor.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 glass border-t border-border flex flex-col gap-3">
        <button 
          onClick={onToggleWatchlist}
          className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-2 ${
            isInWatchlist 
            ? 'border-primary/40 bg-primary/10 text-primary' 
            : 'border-border bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isInWatchlist ? "'FILL' 1" : "'FILL' 0" }}>
            {isInWatchlist ? 'bookmark_added' : 'bookmark_add'}
          </span>
          <span className="text-sm uppercase tracking-wider">
            {isInWatchlist ? 'Удалить из списка' : 'В список просмотра'}
          </span>
        </button>
        <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-[0_8px_30px_hsla(272,90%,55%,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          <span className="text-base">Смотреть фильм</span>
          <span className="material-symbols-outlined">open_in_new</span>
        </button>
      </div>
    </div>
  );
};
