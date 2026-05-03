import { supabase } from '@/integrations/supabase/client';
import { getUserId } from '@/hooks/usePersistence';

export interface EngagementStats {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lateNightSessions: number;
  uniqueMoods: number;
  cinemaClicks: number;
  watchedCount: number;
  todayUsage: number;
}

const EMPTY: EngagementStats = {
  currentStreak: 0, longestStreak: 0, totalDays: 0, lateNightSessions: 0,
  uniqueMoods: 0, cinemaClicks: 0, watchedCount: 0, todayUsage: 0,
};

/** Bumps streak — call once per session. */
export async function touchStreak(): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  await supabase.rpc('touch_streak', { p_user_id: userId });
}

export async function trackMoodUsage(mood: string): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  // upsert with increment
  const { data: existing } = await supabase
    .from('mood_history')
    .select('id, use_count')
    .eq('telegram_user_id', userId)
    .eq('mood', mood)
    .maybeSingle();
  if (existing) {
    await supabase.from('mood_history')
      .update({ use_count: (existing.use_count ?? 0) + 1, last_used_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('mood_history').insert({ telegram_user_id: userId, mood, use_count: 1 });
  }
}

export async function trackCinemaClick(movieTitle: string, movieUrl: string): Promise<void> {
  const userId = getUserId();
  await supabase.from('cinema_clicks').insert({
    telegram_user_id: userId, movie_title: movieTitle, movie_url: movieUrl,
  });
}

export async function markWatched(movieId: string, movieTitle: string): Promise<void> {
  const userId = getUserId();
  await supabase.from('watched_movies').upsert(
    { telegram_user_id: userId, movie_id: movieId, movie_title: movieTitle },
    { onConflict: 'telegram_user_id,movie_id' }
  );
}

export async function unmarkWatched(movieId: string): Promise<void> {
  const userId = getUserId();
  await supabase.from('watched_movies').delete()
    .eq('telegram_user_id', userId).eq('movie_id', movieId);
}

export async function incrementDailyUsage(): Promise<number> {
  const userId = getUserId();
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, recommendation_count')
    .eq('telegram_user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();
  const newCount = (existing?.recommendation_count ?? 0) + 1;
  if (existing) {
    await supabase.from('daily_usage')
      .update({ recommendation_count: newCount }).eq('id', existing.id);
  } else {
    await supabase.from('daily_usage')
      .insert({ telegram_user_id: userId, usage_date: today, recommendation_count: newCount });
  }
  return newCount;
}

export async function getTodayUsage(): Promise<number> {
  const userId = getUserId();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from('daily_usage')
    .select('recommendation_count')
    .eq('telegram_user_id', userId).eq('usage_date', today).maybeSingle();
  return data?.recommendation_count ?? 0;
}

export async function fetchEngagementStats(): Promise<EngagementStats> {
  const userId = getUserId();
  if (!userId) return EMPTY;
  const today = new Date().toISOString().slice(0, 10);
  const [streakRes, moodRes, cinemaRes, watchedRes, usageRes] = await Promise.all([
    supabase.from('daily_streaks').select('*').eq('telegram_user_id', userId).maybeSingle(),
    supabase.from('mood_history').select('mood').eq('telegram_user_id', userId),
    supabase.from('cinema_clicks').select('id', { count: 'exact', head: true }).eq('telegram_user_id', userId),
    supabase.from('watched_movies').select('id', { count: 'exact', head: true }).eq('telegram_user_id', userId),
    supabase.from('daily_usage').select('recommendation_count').eq('telegram_user_id', userId).eq('usage_date', today).maybeSingle(),
  ]);
  return {
    currentStreak: streakRes.data?.current_streak ?? 0,
    longestStreak: streakRes.data?.longest_streak ?? 0,
    totalDays: streakRes.data?.total_days ?? 0,
    lateNightSessions: streakRes.data?.late_night_sessions ?? 0,
    uniqueMoods: moodRes.data?.length ?? 0,
    cinemaClicks: cinemaRes.count ?? 0,
    watchedCount: watchedRes.count ?? 0,
    todayUsage: usageRes.data?.recommendation_count ?? 0,
  };
}