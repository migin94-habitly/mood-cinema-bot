import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Screen, MoodType, Movie, AppState } from '@/types/movie';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { MoodSelectionScreen } from '@/screens/MoodSelectionScreen';
import { AIProcessingScreen } from '@/screens/AIProcessingScreen';
import { DiscoveryScreen } from '@/screens/DiscoveryScreen';
import { WatchlistScreen } from '@/screens/WatchlistScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { DetailsScreen } from '@/screens/DetailsScreen';
import { getMovieRecommendations } from '@/services/movieService';
import { getTelegramWebApp, haptic } from '@/lib/telegram';

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

  const screenRef = useRef(state.currentScreen);
  screenRef.current = state.currentScreen;

  // ── Telegram WebApp init ──
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    tg.ready();
    tg.expand();

    // Apply Telegram theme colors to CSS variables
    const tp = tg.themeParams;
    const root = document.documentElement;

    if (tp.bg_color) {
      root.style.setProperty('--tg-bg', tp.bg_color);
    }
    if (tp.header_bg_color) {
      tg.setHeaderColor(tp.header_bg_color);
    }
    if (tp.bg_color) {
      tg.setBackgroundColor(tp.bg_color);
    }
  }, []);

  // ── Telegram BackButton ──
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

    if (state.currentScreen === 'WELCOME') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }

    tg.BackButton.onClick(handleBack);
    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [state.currentScreen]);

  const navigateTo = (screen: Screen) => {
    haptic.light();
    setState(prev => ({ ...prev, currentScreen: screen }));
  };

  const handleMoodSelect = (mood: MoodType) => {
    haptic.medium();
    setState(prev => ({ ...prev, selectedMood: mood, currentScreen: 'AI_PROCESSING' }));
  };

  const fetchMovies = useCallback(async (mood: MoodType) => {
    const movies = await getMovieRecommendations(mood);
    haptic.success();
    setState(prev => ({
      ...prev,
      movies: movies.length > 0 ? movies : [],
      currentMovieIndex: 0,
      currentScreen: 'DISCOVERY'
    }));
    setIsRefreshing(false);
  }, []);

  const handleRefresh = useCallback(() => {
    if (state.selectedMood && !isRefreshing) {
      setIsRefreshing(true);
      fetchMovies(state.selectedMood);
    }
  }, [state.selectedMood, isRefreshing, fetchMovies]);

  useEffect(() => {
    if (state.currentScreen === 'AI_PROCESSING' && state.selectedMood) {
      fetchMovies(state.selectedMood);
    }
  }, [state.currentScreen, state.selectedMood, fetchMovies]);

  const handleLike = (movie: Movie) => {
    haptic.success();
    const isAlreadyIn = state.watchlist.some(m => m.id === movie.id);
    setState(prev => ({
      ...prev,
      watchlist: isAlreadyIn ? prev.watchlist : [...prev.watchlist, movie],
      currentMovieIndex: prev.currentMovieIndex + 1
    }));
  };

  const handlePass = () => {
    haptic.light();
    setState(prev => ({
      ...prev,
      currentMovieIndex: prev.currentMovieIndex + 1
    }));
  };

  const handleToggleWatchlist = (movie: Movie) => {
    haptic.medium();
    setState(prev => {
      const isAdded = prev.watchlist.some(m => m.id === movie.id);
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
            isRefreshing={isRefreshing}
          />
        );
      case 'WATCHLIST':
        return <WatchlistScreen movies={state.watchlist} onBack={() => navigateTo('DISCOVERY')} onNavigate={navigateTo} />;
      case 'PROFILE':
        return <ProfileScreen watchlistCount={state.watchlist.length} onNavigate={navigateTo} />;
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
