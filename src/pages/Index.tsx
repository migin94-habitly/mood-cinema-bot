import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Screen, MoodType, Movie, AppState } from '@/types/movie';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { MoodSelectionScreen } from '@/screens/MoodSelectionScreen';
import { AIProcessingScreen } from '@/screens/AIProcessingScreen';
import { DiscoveryScreen, DiscoveryFilters } from '@/screens/DiscoveryScreen';
import { WatchlistScreen } from '@/screens/WatchlistScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { DetailsScreen } from '@/screens/DetailsScreen';
import { PaywallScreen } from '@/screens/PaywallScreen';
import { ScreenTransition } from '@/components/ScreenTransition';
import { DiscoverySkeleton } from '@/components/Skeletons';
import { getMovieRecommendations, getRecentlyRecommended, saveRecommendationHistory } from '@/services/movieService';
import { getTelegramWebApp, haptic } from '@/lib/telegram';
import { usePersistence, getUserId } from '@/hooks/usePersistence';
import { trackEvent, identifyUser } from '@/services/analyticsService';
import { trackMoodUsage, incrementDailyUsage } from '@/services/engagementService';
import { useEngagement } from '@/hooks/useEngagement';
import { FREE_DAILY_LIMIT } from '@/services/proService';
import { useToast } from '@/hooks/use-toast';
import { City, getSavedCity } from '@/constants/cities';

const BACK_MAP: Partial<Record<Screen, Screen>> = {
  MOOD_GRID: 'WELCOME',
  AI_PROCESSING: 'MOOD_GRID',
  DISCOVERY: 'MOOD_GRID',
  WATCHLIST: 'DISCOVERY',
  PROFILE: 'DISCOVERY',
  DETAILS: 'DISCOVERY',
  PAYWALL: 'PROFILE',
};

const Index: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try { return !localStorage.getItem('mm_onboarded_v1'); } catch { return true; }
  });
  const finishOnboarding = useCallback(() => {
    try { localStorage.setItem('mm_onboarded_v1', '1'); } catch {}
    setShowOnboarding(false);
  }, []);

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
  const [city, setCity] = useState<City>(() => getSavedCity());
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleDataLoaded = useCallback((data: { watchlist: Movie[]; swipeCount: number; watchedCount: number }) => {
    setState(prev => ({ ...prev, watchlist: data.watchlist }));
    setSwipeCount(data.swipeCount);
    setWatchedCount(data.watchedCount);
    setDataLoaded(true);
  }, []);

  const { saveStats, addToWatchlist, removeFromWatchlist } = usePersistence(handleDataLoaded);
  const { stats: engagementStats, pro, refresh: refreshEngagement } = useEngagement();
  const { toast } = useToast();
  const [paywallReason, setPaywallReason] = useState<string | undefined>(undefined);

  const screenRef = useRef(state.currentScreen);
  screenRef.current = state.currentScreen;

  useEffect(() => {
    trackEvent('session_start');
    trackEvent('app_open');
    identifyUser();
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
    if (state.currentScreen === 'WELCOME' || showOnboarding) tg.BackButton.hide();
    else tg.BackButton.show();
    tg.BackButton.onClick(handleBack);
    return () => { tg.BackButton.offClick(handleBack); };
  }, [state.currentScreen, showOnboarding]);

  const navigateTo = (screen: Screen) => {
    haptic.light();
    trackEvent('screen_view', { screen });
    setState(prev => ({ ...prev, currentScreen: screen }));
  };

  const handleMoodSelect = (mood: MoodType, selectedCity: City) => {
    haptic.medium();
    trackEvent('mood_select', { mood, city: selectedCity.id });
    trackMoodUsage(mood);
    setCity(selectedCity);
    // Free limit check
    if (!pro.isPro && (engagementStats?.todayUsage ?? 0) >= FREE_DAILY_LIMIT) {
      trackEvent('free_limit_hit', { limit: FREE_DAILY_LIMIT });
      setPaywallReason(`Дневной лимит ${FREE_DAILY_LIMIT} подборов исчерпан. Открой безлимит с Pro.`);
      setState(prev => ({ ...prev, currentScreen: 'PAYWALL' }));
      return;
    }
    setActiveFilters({});
    setState(prev => ({ ...prev, selectedMood: mood, currentScreen: 'AI_PROCESSING' }));
  };

  const fetchMovies = useCallback(async (mood: MoodType, type?: string, genre?: string | null) => {
    const userId = getUserId();
    const excludeTitles = await getRecentlyRecommended(userId);
    const movies = await getMovieRecommendations(mood, type, genre, excludeTitles, city.id);
    if (movies.length > 0) {
      await saveRecommendationHistory(userId, movies);
      incrementDailyUsage().then(() => refreshEngagement());
      trackEvent('recommendations_loaded', { count: movies.length, mood, type, genre, city: city.id });
    }
    haptic.success();
    setState(prev => ({
      ...prev,
      movies: movies.length > 0 ? movies : [],
      currentMovieIndex: 0,
      currentScreen: 'DISCOVERY',
      selectedMood: mood,
    }));
    setIsRefreshing(false);
  }, [refreshEngagement, city.id]);

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
    trackEvent('swipe_like', { movieId: movie.id, title: movie.title });
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
    trackEvent('swipe_pass');
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
        trackEvent('watchlist_remove', { movieId: movie.id, title: movie.title });
        removeFromWatchlist(movie.id);
      } else {
        trackEvent('watchlist_add', { movieId: movie.id, title: movie.title });
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
    const screen = state.currentScreen;
    let content: React.ReactNode;

    switch (screen) {
      case 'WELCOME':
        content = <WelcomeScreen onStart={() => navigateTo('MOOD_GRID')} />;
        break;
      case 'MOOD_GRID':
        content = <MoodSelectionScreen onSelectMood={handleMoodSelect} />;
        break;
      case 'AI_PROCESSING':
        content = <AIProcessingScreen mood={state.selectedMood!} />;
        break;
      case 'DISCOVERY':
        content = !dataLoaded ? <DiscoverySkeleton /> : (
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
        break;
      case 'WATCHLIST':
        content = <WatchlistScreen movies={state.watchlist} onBack={() => navigateTo('DISCOVERY')} onNavigate={navigateTo} onRemove={(movie) => handleToggleWatchlist(movie)} />;
        break;
      case 'PROFILE':
        content = <ProfileScreen
          watchlistCount={state.watchlist.length}
          swipeCount={swipeCount}
          watchedCount={watchedCount}
          engagement={engagementStats}
          isPro={pro.isPro}
          proExpiresAt={pro.expiresAt}
          onNavigate={navigateTo}
          onOpenPaywall={() => { setPaywallReason(undefined); navigateTo('PAYWALL'); }}
        />;
        break;
      case 'DETAILS':
        content = (
          <DetailsScreen 
            movie={state.selectedMovie!} 
            onBack={() => navigateTo('DISCOVERY')}
            isInWatchlist={state.watchlist.some(m => m.id === state.selectedMovie?.id)}
            onToggleWatchlist={() => handleToggleWatchlist(state.selectedMovie!)}
          />
        );
        break;
      case 'PAYWALL':
        content = <PaywallScreen
          reason={paywallReason}
          onClose={() => navigateTo('PROFILE')}
          onActivated={() => {
            toast({ title: '🌟 Pro активирован!', description: 'Спасибо за поддержку. Все возможности открыты.' });
            refreshEngagement();
            navigateTo('DISCOVERY');
          }}
          onNavigate={navigateTo}
        />;
        break;
      default:
        content = <WelcomeScreen onStart={() => navigateTo('MOOD_GRID')} />;
    }

    return (
      <ScreenTransition screenKey={screen}>
        {content}
      </ScreenTransition>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      {showOnboarding ? (
        <OnboardingScreen onFinish={finishOnboarding} />
      ) : (
        renderScreen()
      )}
    </div>
  );
};

export default Index;
