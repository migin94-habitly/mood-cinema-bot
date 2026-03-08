import { supabase } from '@/integrations/supabase/client';
import { Movie, MoodType } from '@/types/movie';

export async function getMovieRecommendations(
  mood: MoodType,
  type?: string,
  genre?: string | null
): Promise<Movie[]> {
  try {
    const { data, error } = await supabase.functions.invoke('movie-recommendations', {
      body: { mood, type, genre },
    });

    if (error) {
      console.error('Edge function error:', error);
      return [];
    }

    if (data?.movies && Array.isArray(data.movies)) {
      return data.movies;
    }

    return [];
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
}
