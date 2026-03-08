import React, { useState, useEffect, useCallback } from 'react';
import { Screen, MoodType, Movie, AppState } from '@/types/movie';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { MoodSelectionScreen } from '@/screens/MoodSelectionScreen';
import { AIProcessingScreen } from '@/screens/AIProcessingScreen';
import { DiscoveryScreen } from '@/screens/DiscoveryScreen';
import { WatchlistScreen } from '@/screens/WatchlistScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { DetailsScreen } from '@/screens/DetailsScreen';
import { getMovieRecommendations } from '@/services/movieService';

const Index: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentScreen: 'WELCOME',
    selectedMood: null,
    watchlist: [],
    movies: [],
    currentMovieIndex: 0,
    selectedMovie: null,
  });

  const navigateTo = (screen: Screen) => {
    setState(prev => ({ ...prev, currentScreen: screen }));
  };

  const handleMoodSelect = (mood: MoodType) => {
    setState(prev => ({ ...prev, selectedMood: mood, currentScreen: 'AI_PROCESSING' }));
  };

  const fetchMovies = useCallback(async (mood: MoodType) => {
    const movies = await getMovieRecommendations(mood);
    setState(prev => ({
      ...prev,
      movies: movies.length > 0 ? movies : [],
      currentMovieIndex: 0,
      currentScreen: 'DISCOVERY'
    }));
  }, []);

  useEffect(() => {
    if (state.currentScreen === 'AI_PROCESSING' && state.selectedMood) {
      fetchMovies(state.selectedMood);
    }
  }, [state.currentScreen, state.selectedMood, fetchMovies]);

  const handleLike = (movie: Movie) => {
    const isAlreadyIn = state.watchlist.some(m => m.id === movie.id);
    setState(prev => ({
      ...prev,
      watchlist: isAlreadyIn ? prev.watchlist : [...prev.watchlist, movie],
      currentMovieIndex: prev.currentMovieIndex + 1
    }));
  };

  const handlePass = () => {
    setState(prev => ({
      ...prev,
      currentMovieIndex: prev.currentMovieIndex + 1
    }));
  };

  const handleToggleWatchlist = (movie: Movie) => {
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
