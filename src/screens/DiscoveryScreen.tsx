import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import { Movie, Screen } from '@/types/movie';
import { haptic } from '@/lib/telegram';
import { getPlatformStyle, IMDB_STYLE, KP_STYLE } from '@/lib/platformColors';

interface Props {
  movies: Movie[];
  currentIndex: number;
  onLike: (movie: Movie) => void;
  onPass: () => void;
  onDetails: (movie: Movie) => void;
  onNavigate: (screen: Screen) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const SWIPE_THRESHOLD = 120;

const SwipeCard: React.FC<{
  movie: Movie;
  onLike: () => void;
  onPass: () => void;
  onDetails: () => void;
}> = ({ movie, onLike, onPass, onDetails }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      haptic.success();
      onLike();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      haptic.light();
      onPass();
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ 
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        rotate: x.get() > 0 ? 20 : -20,
        transition: { duration: 0.3 }
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="absolute inset-0 rounded-2xl overflow-hidden border border-border shadow-2xl bg-surface">
        <img src={movie.posterUrl} className="w-full h-full object-cover" alt={movie.title} />
        
        {/* LIKE overlay */}
        <motion.div 
          className="absolute inset-0 bg-success/20 rounded-2xl flex items-center justify-center z-30 pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <div className="bg-success/90 px-8 py-4 rounded-2xl border-4 border-success rotate-[-12deg]">
            <span className="text-3xl font-extrabold text-primary-foreground tracking-wider">НРАВИТСЯ</span>
          </div>
        </motion.div>

        {/* PASS overlay */}
        <motion.div 
          className="absolute inset-0 bg-destructive/20 rounded-2xl flex items-center justify-center z-30 pointer-events-none"
          style={{ opacity: passOpacity }}
        >
          <div className="bg-destructive/90 px-8 py-4 rounded-2xl border-4 border-destructive rotate-[12deg]">
            <span className="text-3xl font-extrabold text-primary-foreground tracking-wider">ПРОПУСК</span>
          </div>
        </motion.div>

        <div className="absolute top-4 left-4 z-20">
          <div className="bg-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-[16px] fill-1 text-primary-foreground">auto_awesome</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground">AI Choice</span>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-6 pt-20 bg-gradient-to-t from-background via-background/90 to-transparent">
          <div className="glass p-4 rounded-xl border border-border">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-2xl font-bold leading-tight">{movie.title}</h2>
                {movie.titleOriginal && movie.titleOriginal !== movie.title && (
                  <p className="text-xs text-muted-foreground mt-0.5">{movie.titleOriginal}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0 ml-2">
                <div className="flex items-center px-2 py-0.5 rounded-lg gap-1 border" style={IMDB_STYLE}>
                  <span className="text-[9px] font-bold">IMDB</span>
                  <span className="text-xs font-bold">{movie.ratingImdb}</span>
                </div>
                <div className="flex items-center px-2 py-0.5 rounded-lg gap-1 border" style={KP_STYLE}>
                  <span className="text-[9px] font-bold">КП</span>
                  <span className="text-xs font-bold">{movie.ratingKinopoisk}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {movie.platform && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider" style={getPlatformStyle(movie.platform)}>{movie.platform}</span>
              )}
              {movie.type === 'series' && (
                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-md border border-success/20 uppercase tracking-wider">Сериал</span>
              )}
              {movie.genres.map(g => (
                <span key={g} className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border uppercase tracking-wider">{g}</span>
              ))}
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border uppercase tracking-wider">{movie.duration}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {movie.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

type FilterType = 'all' | 'movie' | 'series';

export const DiscoveryScreen: React.FC<Props> = ({ movies, currentIndex, onLike, onPass, onDetails, onNavigate, onRefresh, isRefreshing }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);
  const [localIndex, setLocalIndex] = useState(0);

  // Get unique platforms from movies
  const platforms = useMemo(() => {
    const set = new Set(movies.map(m => m.platform).filter(Boolean));
    return Array.from(set);
  }, [movies]);

  // Apply filters
  const filteredMovies = useMemo(() => {
    let result = movies;
    if (filterType !== 'all') {
      result = result.filter(m => m.type === filterType);
    }
    if (filterPlatform) {
      result = result.filter(m => m.platform?.toLowerCase() === filterPlatform.toLowerCase());
    }
    return result;
  }, [movies, filterType, filterPlatform]);

  // Reset local index when filters change
  const prevFilterKey = useRef(`${filterType}-${filterPlatform}`);
  const filterKey = `${filterType}-${filterPlatform}`;
  if (filterKey !== prevFilterKey.current) {
    prevFilterKey.current = filterKey;
    setLocalIndex(0);
  }

  const currentMovie = filteredMovies[localIndex];
  const nextMovie = filteredMovies[localIndex + 1];

  const handleLocalLike = (movie: Movie) => {
    onLike(movie);
    setLocalIndex(prev => prev + 1);
  };

  const handleLocalPass = () => {
    onPass();
    setLocalIndex(prev => prev + 1);
  };

  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && window.scrollY === 0) {
      setIsPulling(true);
      setPullY(Math.min(dy * 0.5, 120));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullY >= PULL_THRESHOLD && onRefresh && !isRefreshing) {
      haptic.medium();
      onRefresh();
      setLocalIndex(0);
    }
    setPullY(0);
    setIsPulling(false);
  }, [pullY, onRefresh, isRefreshing]);

  if (!currentMovie) {
    return (
      <motion.div 
        className="h-screen w-full flex flex-col items-center justify-center p-8 text-center bg-background"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <span className="material-symbols-outlined text-primary text-6xl mb-4">sentiment_very_satisfied</span>
        <h2 className="text-2xl font-bold mb-2">Вы просмотрели всё!</h2>
        <p className="text-muted-foreground mb-8">
          {filterType !== 'all' || filterPlatform 
            ? 'Попробуйте сбросить фильтры или выбрать другое настроение.' 
            : 'Попробуйте другое настроение для новых находок.'}
        </p>
        <div className="flex gap-3">
          {(filterType !== 'all' || filterPlatform) && (
            <button 
              onClick={() => { setFilterType('all'); setFilterPlatform(null); setLocalIndex(0); }}
              className="bg-muted px-6 py-3 rounded-xl font-bold text-foreground border border-border"
            >
              Сбросить фильтры
            </button>
          )}
          <button 
            onClick={() => onNavigate('MOOD_GRID')}
            className="bg-primary px-8 py-3 rounded-xl font-bold text-primary-foreground shadow-lg shadow-primary/20"
          >
            Выбрать настроение
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="h-screen w-full flex flex-col bg-background overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <motion.div
        className="flex items-center justify-center overflow-hidden"
        animate={{ height: isPulling || isRefreshing ? Math.max(pullY, isRefreshing ? 48 : 0) : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : (pullY / PULL_THRESHOLD) * 180 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
        >
          <span className={`material-symbols-outlined text-2xl ${pullY >= PULL_THRESHOLD || isRefreshing ? 'text-primary' : 'text-muted-foreground'}`}>
            {isRefreshing ? 'progress_activity' : 'refresh'}
          </span>
        </motion.div>
        {!isRefreshing && pullY > 10 && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">
            {pullY >= PULL_THRESHOLD ? 'Отпустите' : 'Потяните вниз'}
          </span>
        )}
      </motion.div>

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
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className={`size-10 rounded-full glass flex items-center justify-center ${showFilters ? 'ring-2 ring-primary' : ''}`}
        >
          <span className="material-symbols-outlined text-muted-foreground">tune</span>
        </button>
      </header>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-6"
          >
            <div className="pb-4 space-y-3">
              {/* Type filter */}
              <div className="flex gap-2">
                {([['all', 'Все'], ['movie', 'Фильмы'], ['series', 'Сериалы']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilterType(val)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      filterType === val 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Platform filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterPlatform(null)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    !filterPlatform 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  Все платформы
                </button>
                {platforms.map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPlatform(filterPlatform === p ? null : p)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all"
                    style={filterPlatform === p ? { ...getPlatformStyle(p), fontWeight: 800 } : { ...getPlatformStyle(p), opacity: 0.6 }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 relative px-4 py-2 flex items-center justify-center">
        <div className="relative w-full max-w-[400px] aspect-[2/3]">
          {nextMovie && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden border border-border shadow-xl bg-surface scale-[0.92] opacity-50">
              <img src={nextMovie.posterUrl} className="w-full h-full object-cover" alt={nextMovie.title} />
            </div>
          )}
          <AnimatePresence mode="popLayout">
            <SwipeCard
              key={currentMovie.id}
              movie={currentMovie}
              onLike={() => handleLocalLike(currentMovie)}
              onPass={handleLocalPass}
              onDetails={() => onDetails(currentMovie)}
            />
          </AnimatePresence>
        </div>
      </main>

      <div className="px-6 py-8 flex items-center justify-center gap-10">
        <motion.button 
          onClick={handleLocalPass}
          className="group flex flex-col items-center gap-2"
          whileTap={{ scale: 0.85 }}
        >
          <div className="size-16 rounded-full bg-destructive/10 border-2 border-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive hover:text-primary-foreground transition-all">
            <span className="material-symbols-outlined text-3xl">close</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-destructive/50">Пропуск</span>
        </motion.button>

        <motion.button 
          onClick={() => onDetails(currentMovie)}
          className="group flex flex-col items-center gap-2"
          whileTap={{ scale: 0.85 }}
        >
          <div className="size-12 rounded-full glass border border-border text-muted-foreground flex items-center justify-center hover:text-foreground transition-all">
            <span className="material-symbols-outlined text-2xl">info</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Детали</span>
        </motion.button>

        <motion.button 
          onClick={() => handleLocalLike(currentMovie)}
          className="group flex flex-col items-center gap-2"
          whileTap={{ scale: 0.85 }}
        >
          <div className="size-16 rounded-full bg-success/10 border-2 border-success/20 text-success flex items-center justify-center hover:bg-success hover:text-primary-foreground transition-all">
            <span className="material-symbols-outlined text-3xl fill-1">favorite</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-success/50">Нравится</span>
        </motion.button>
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
