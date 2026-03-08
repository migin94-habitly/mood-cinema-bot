import React, { useState } from 'react';
import { Movie, Screen } from '@/types/movie';
import { getPlatformStyle, IMDB_STYLE, KP_STYLE } from '@/lib/platformColors';
import { AnimatePresence, motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { haptic } from '@/lib/telegram';

interface Props {
  movies: Movie[];
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onRemove?: (movie: Movie) => void;
}

const WATCH_SOURCES = [
  { name: 'HDRezka', url: 'https://hdrezka.ag', icon: '🎬' },
  { name: 'ZetFlix', url: 'https://zet-flix.online', icon: '🎥' },
];

const SWIPE_THRESHOLD = -80;

const SwipeableCard: React.FC<{
  movie: Movie;
  onWatch: (movie: Movie) => void;
  onRemove: (movie: Movie) => void;
}> = ({ movie, onWatch, onRemove }) => {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-120, -60, 0], [1, 0.8, 0]);
  const deleteScale = useTransform(x, [-120, -60, 0], [1, 0.8, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < SWIPE_THRESHOLD) {
      haptic.medium();
      onRemove(movie);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 bg-destructive/90 rounded-xl flex items-center justify-end pr-5"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div className="flex flex-col items-center gap-1" style={{ scale: deleteScale }}>
          <span className="material-symbols-outlined text-destructive-foreground text-2xl">delete</span>
          <span className="text-[9px] font-bold text-destructive-foreground uppercase tracking-wider">Удалить</span>
        </motion.div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        className="relative flex flex-col gap-2 bg-background rounded-xl"
        drag="x"
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ cursor: 'grabbing' }}
      >
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-border">
          <img src={movie.posterUrl} className="w-full h-full object-cover" alt={movie.title} draggable={false} />
          <div className="absolute top-2 right-2 size-7 glass rounded-full flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-sm fill-1">favorite</span>
          </div>
        </div>
        <h3 className="font-bold text-sm truncate px-1">{movie.title}</h3>
        <div className="flex items-center gap-2 px-1">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={IMDB_STYLE}>IMDB {movie.ratingImdb}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={KP_STYLE}>КП {movie.ratingKinopoisk}</span>
        </div>
        <div className="px-1">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block" style={getPlatformStyle(movie.platform)}>{movie.platform}</span>
          <span className="text-[10px] text-muted-foreground ml-2">{movie.year}</span>
        </div>
        <button
          onClick={() => onWatch(movie)}
          className="mt-1 w-full py-2 bg-primary text-primary-foreground text-[11px] font-bold rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">play_arrow</span>
          Смотреть
        </button>
      </motion.div>
    </div>
  );
};

export const WatchlistScreen: React.FC<Props> = ({ movies, onBack, onNavigate, onRemove }) => {
  const [sourceMovie, setSourceMovie] = useState<Movie | null>(null);

  const handleWatch = (source: typeof WATCH_SOURCES[0]) => {
    if (!sourceMovie) return;
    const query = encodeURIComponent(sourceMovie.titleOriginal || sourceMovie.title);
    window.open(`${source.url}/search/?q=${query}`, '_blank');
    setSourceMovie(null);
  };

  const handleRemove = (movie: Movie) => {
    onRemove?.(movie);
  };

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

      <main className="flex-1 p-4 pb-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-1 text-primary">
          <span className="material-symbols-outlined active-icon">auto_awesome</span>
          <span className="text-xs font-bold uppercase tracking-widest">{movies.length} ФИЛЬМОВ ВЫБРАНО</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-5 ml-8">← свайп влево чтобы удалить</p>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">heart_broken</span>
            <p>Ваш список пуст.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {movies.map(movie => (
                <motion.div
                  key={movie.id}
                  layout
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.25 } }}
                >
                  <SwipeableCard movie={movie} onWatch={setSourceMovie} onRemove={handleRemove} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>


      {/* Source picker */}
      <AnimatePresence>
        {sourceMovie && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setSourceMovie(null)} />
            <motion.div
              className="relative w-full max-w-md p-6 pb-10 glass border-t border-border rounded-t-3xl space-y-4"
              initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />
              <h3 className="text-lg font-bold text-center">Где смотреть?</h3>
              <p className="text-sm text-muted-foreground text-center">{sourceMovie.title}</p>
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
              <button onClick={() => setSourceMovie(null)} className="w-full py-3 text-muted-foreground font-bold text-sm uppercase tracking-wider">
                Отмена
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
