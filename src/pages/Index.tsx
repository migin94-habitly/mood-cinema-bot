import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Screen, MoodType, Movie, AppState } from '@/types/movie';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { MoodSelectionScreen } from '@/screens/MoodSelectionScreen';
import { AIProcessingScreen } from '@/screens/AIProcessingScreen';
import { DiscoveryScreen, DiscoveryFilters } from '@/screens/DiscoveryScreen';
import { WatchlistScreen } from '@/screens/WatchlistScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { DetailsScreen } from '@/screens/DetailsScreen';
import { getMovieRecommendations, getRecentlyRecommended, saveRecommendationHistory } from '@/services/movieService';
import { getTelegramWebApp, haptic } from '@/lib/telegram';
import { usePersistence } from '@/hooks/usePersistence';

const BACK_MAP: Partial<Record<Screen, Screen>> = {
  MOOD_GRID: 'WELCOME',
  AI_PROCESSING: 'MOOD_GRID',
  DISCOVERY: 'MOOD_GRID',
  WATCHLIST: 'DISCOVERY',
  PROFILE: 'DISCOVERY',
  DETAILS: 'DISCOVERY',
};

const Index: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentScreen: 'WELCOME',
    selectedMood: null,
    watchlist: [],
    movies: [],
    currentMovieIndex: 0,
    selectedMovie: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);
  const [watchedCount, setWatchedCount] = useState(0);
  const [activeFilters, setActiveFilters] = useState<{ type?: string; genre?: string | null }>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleDataLoaded = useCallback((data: { watchlist: Movie[]; swipeCount: number; watchedCount: number }) => {
    setState(prev => ({ ...prev, watchlist: data.watchlist }));
    setSwipeCount(data.swipeCount);
    setWatchedCount(data.watchedCount);
    setDataLoaded(true);
  }, []);

  const { saveStats, addToWatchlist, removeFromWatchlist } = usePersistence(handleDataLoaded);

  const screenRef = useRef(state.currentScreen);
  screenRef.current = state.currentScreen;

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;
    tg.ready();
    tg.expand();
    const tp = tg.themeParams;
    const root = document.documentElement;
    if (tp.bg_color) root.style.setProperty('--tg-bg', tp.bg_color);
    if (tp.header_bg_color) tg.setHeaderColor(tp.header_bg_color);
    if (tp.bg_color) tg.setBackgroundColor(tp.bg_color);
  }, []);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;
    const handleBack = () => {
      const backTo = BACK_MAP[screenRef.current];
      if (backTo) {
        haptic.light();
        setState(prev => ({ ...prev, currentScreen: backTo }));
      }
    };
    if (state.currentScreen === 'WELCOME') tg.BackButton.hide();
    else tg.BackButton.show();
    tg.BackButton.onClick(handleBack);
    return () => { tg.BackButton.offClick(handleBack); };
  }, [state.currentScreen]);

  const navigateTo = (screen: Screen) => {
    haptic.light();
    setState(prev => ({ ...prev, currentScreen: screen }));
  };

  const handleMoodSelect = (mood: MoodType) => {
    haptic.medium();
    setActiveFilters({});
    setState(prev => ({ ...prev, selectedMood: mood, currentScreen: 'AI_PROCESSING' }));
  };

  const fetchMovies = useCallback(async (mood: MoodType, type?: string, genre?: string | null) => {
    const movies = await getMovieRecommendations(mood, type, genre);
    haptic.success();
    setState(prev => ({
      ...prev,
      movies: movies.length > 0 ? movies : [],
      currentMovieIndex: 0,
      currentScreen: 'DISCOVERY',
      selectedMood: mood,
    }));
    setIsRefreshing(false);
  }, []);

  const handleRefresh = useCallback(() => {
    if (state.selectedMood && !isRefreshing) {
      setIsRefreshing(true);
      fetchMovies(state.selectedMood, activeFilters.type, activeFilters.genre);
    }
  }, [state.selectedMood, isRefreshing, fetchMovies, activeFilters]);

  const handleFiltersChange = useCallback((filters: DiscoveryFilters) => {
    setActiveFilters({ type: filters.type, genre: filters.genre });
    setIsRefreshing(true);
    fetchMovies(filters.mood, filters.type === 'all' ? undefined : filters.type, filters.genre);
  }, [fetchMovies]);

  useEffect(() => {
    if (state.currentScreen === 'AI_PROCESSING' && state.selectedMood) {
      fetchMovies(state.selectedMood);
    }
  }, [state.currentScreen, state.selectedMood, fetchMovies]);

  const handleLike = (movie: Movie) => {
    haptic.success();
    const newSwipe = swipeCount + 1;
    const newWatched = watchedCount + 1;
    setSwipeCount(newSwipe);
    setWatchedCount(newWatched);
    const isAlreadyIn = state.watchlist.some(m => m.id === movie.id);
    setState(prev => ({
      ...prev,
      watchlist: isAlreadyIn ? prev.watchlist : [...prev.watchlist, movie],
      currentMovieIndex: prev.currentMovieIndex + 1
    }));
    if (!isAlreadyIn) addToWatchlist(movie);
    saveStats(newSwipe, newWatched);
  };

  const handlePass = () => {
    haptic.light();
    const newSwipe = swipeCount + 1;
    setSwipeCount(newSwipe);
    setState(prev => ({
      ...prev,
      currentMovieIndex: prev.currentMovieIndex + 1
    }));
    saveStats(newSwipe, watchedCount);
  };

  const handleToggleWatchlist = (movie: Movie) => {
    haptic.medium();
    setState(prev => {
      const isAdded = prev.watchlist.some(m => m.id === movie.id);
      if (isAdded) {
        removeFromWatchlist(movie.id);
      } else {
        addToWatchlist(movie);
      }
      return {
        ...prev,
        watchlist: isAdded
          ? prev.watchlist.filter(m => m.id !== movie.id)
          : [...prev.watchlist, movie],
      };
    });
  };

  const openDetails = (movie: Movie) => {
    haptic.selection();
    setState(prev => ({ ...prev, selectedMovie: movie, currentScreen: 'DETAILS' }));
  };

  const renderScreen = () => {
    switch (state.currentScreen) {
      case 'WELCOME':
        return <WelcomeScreen onStart={() => navigateTo('MOOD_GRID')} />;
      case 'MOOD_GRID':
        return <MoodSelectionScreen onSelectMood={handleMoodSelect} />;
      case 'AI_PROCESSING':
        return <AIProcessingScreen mood={state.selectedMood!} />;
      case 'DISCOVERY':
        return (
          <DiscoveryScreen 
            movies={state.movies} 
            currentIndex={state.currentMovieIndex}
            onLike={handleLike}
            onPass={handlePass}
            onDetails={openDetails}
            onNavigate={navigateTo}
            onRefresh={handleRefresh}
            onFiltersChange={handleFiltersChange}
            isRefreshing={isRefreshing}
            currentMood={state.selectedMood!}
          />
        );
      case 'WATCHLIST':
        return <WatchlistScreen movies={state.watchlist} onBack={() => navigateTo('DISCOVERY')} onNavigate={navigateTo} onRemove={(movie) => handleToggleWatchlist(movie)} />;
      case 'PROFILE':
        return <ProfileScreen watchlistCount={state.watchlist.length} swipeCount={swipeCount} watchedCount={watchedCount} onNavigate={navigateTo} />;
      case 'DETAILS':
        return (
          <DetailsScreen 
            movie={state.selectedMovie!} 
            onBack={() => navigateTo('DISCOVERY')}
            isInWatchlist={state.watchlist.some(m => m.id === state.selectedMovie?.id)}
            onToggleWatchlist={() => handleToggleWatchlist(state.selectedMovie!)}
          />
        );
      default:
        return <WelcomeScreen onStart={() => navigateTo('MOOD_GRID')} />;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      {renderScreen()}
    </div>
  );
};

export default Index;
