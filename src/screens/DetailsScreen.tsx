import React, { useState } from 'react';
import { Movie } from '@/types/movie';
import { getPlatformStyle, IMDB_STYLE, KP_STYLE } from '@/lib/platformColors';
import { AnimatePresence, motion } from 'framer-motion';
import { haptic } from '@/lib/telegram';

interface Props {
  movie: Movie;
  onBack: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
}

const WATCH_SOURCES = [
  { name: 'HDRezka', url: 'https://hdrezka.ag', icon: '🎬' },
  { name: 'ZetFlix', url: 'https://zet-flix.online', icon: '🎥' },
];

export const DetailsScreen: React.FC<Props> = ({ movie, onBack, isInWatchlist, onToggleWatchlist }) => {
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  const handleShare = async () => {
    const shareText = `Посмотри: ${movie.title} (${movie.year}). IMDB: ${movie.ratingImdb}, КП: ${movie.ratingKinopoisk}. Рекомендация от Movie Mood AI!`;
    const shareUrl = window.location.href;
    haptic.light();
    // Telegram Mini App native share
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      try { tg.openTelegramLink(url); return; } catch {}
    }
    if (navigator.share) {
      try { await navigator.share({ title: movie.title, text: shareText, url: shareUrl }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Скопировано в буфер обмена');
    } catch {}
  };

  const handleBack = () => {
    haptic.light();
    onBack();
  };

  const handleWatch = (source: typeof WATCH_SOURCES[0]) => {
    const query = encodeURIComponent(movie.titleOriginal || movie.title);
    window.open(`${source.url}/search/?q=${query}`, '_blank');
    setShowSourcePicker(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-y-auto">
      {/* Fixed top action bar — always tappable, even when scrolling */}
      <div
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 pb-3"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <button
          onClick={handleBack}
          type="button"
          aria-label="Назад"
          className="size-11 glass rounded-2xl flex items-center justify-center transition-transform active:scale-90 shadow-lg"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button
          onClick={handleShare}
          type="button"
          aria-label="Поделиться"
          className="size-11 glass rounded-2xl flex items-center justify-center transition-transform active:scale-90 shadow-lg"
        >
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>

      <div className="relative h-[50vh] shrink-0">
        <img
          src={movie.posterUrl}
          className="w-full h-full object-cover"
          alt={movie.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://placehold.co/600x900/0F0A1F/A855F7/png?text=${encodeURIComponent(movie.title.slice(0, 30))}&font=montserrat`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="relative -mt-20 px-6 pb-48 z-10 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {movie.platform && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border" style={getPlatformStyle(movie.platform)}>{movie.platform}</span>
            )}
            {movie.type === 'series' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-success/20 text-success border border-success/30 rounded">Сериал</span>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded border" style={IMDB_STYLE}>
              <span className="text-[10px] font-bold">IMDB</span>
              <span className="text-sm font-bold">{movie.ratingImdb}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded border" style={KP_STYLE}>
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
          <p className="text-muted-foreground leading-relaxed text-sm">{movie.description}</p>
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
        {movie.ticketonUrl && (
          <button 
            onClick={async () => {
              const { trackCinemaClick } = await import('@/services/engagementService');
              trackCinemaClick(movie.title, movie.ticketonUrl!);
              window.open(movie.ticketonUrl, '_blank');
            }}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all border-2 border-accent"
          >
            <span className="text-lg">🎬</span>
            <span className="text-base">Пойти в кино</span>
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
        )}
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
        <button 
          onClick={() => setShowSourcePicker(true)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-[0_8px_30px_hsla(272,90%,55%,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <span className="text-base">Смотреть фильм</span>
          <span className="material-symbols-outlined">open_in_new</span>
        </button>
      </div>

      {/* Source picker overlay */}
      <AnimatePresence>
        {showSourcePicker && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setShowSourcePicker(false)} />
            <motion.div
              className="relative w-full max-w-md p-6 pb-10 glass border-t border-border rounded-t-3xl space-y-4"
              initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />
              <h3 className="text-lg font-bold text-center">Где смотреть?</h3>
              <div className="space-y-3">
                {WATCH_SOURCES.map(source => (
                  <button
                    key={source.name}
                    onClick={() => handleWatch(source)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface hover:bg-muted transition-all active:scale-[0.98]"
                  >
                    <span className="text-2xl">{source.icon}</span>
                    <div className="text-left flex-1">
                      <p className="font-bold">{source.name}</p>
                      <p className="text-xs text-muted-foreground">{source.url}</p>
                    </div>
                    <span className="material-symbols-outlined text-muted-foreground">open_in_new</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowSourcePicker(false)}
                className="w-full py-3 text-muted-foreground font-bold text-sm uppercase tracking-wider"
              >
                Отмена
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
