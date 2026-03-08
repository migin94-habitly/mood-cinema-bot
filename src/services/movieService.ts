import { supabase } from '@/integrations/supabase/client';
import { Movie, MoodType } from '@/types/movie';

export async function getRecentlyRecommended(userId: string): Promise<string[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data } = await supabase
    .from('recommendation_history')
    .select('movie_title_original')
    .eq('telegram_user_id', userId)
    .gte('recommended_at', weekAgo.toISOString());

  return (data ?? []).map((r: any) => r.movie_title_original).filter(Boolean);
}

export async function saveRecommendationHistory(userId: string, movies: Movie[]) {
  const rows = movies.map(m => ({
    telegram_user_id: userId,
    movie_title: m.title,
    movie_title_original: m.titleOriginal,
  }));
  await supabase.from('recommendation_history').insert(rows);
}

export async function getMovieRecommendations(
  mood: MoodType,
  type?: string,
  genre?: string | null,
  excludeTitles?: string[]
): Promise<Movie[]> {
  try {
    const { data, error } = await supabase.functions.invoke('movie-recommendations', {
      body: { mood, type, genre, excludeTitles },
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
