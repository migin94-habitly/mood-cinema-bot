import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Movie } from '@/types/movie';
import { getTelegramWebApp } from '@/lib/telegram';

function getTelegramUserId(): string | null {
  const tg = getTelegramWebApp();
  const id = tg?.initDataUnsafe?.user?.id;
  return id ? String(id) : null;
}

// Fallback for non-Telegram environment (preview/dev)
function getUserId(): string {
  const tgId = getTelegramUserId();
  if (tgId) return tgId;
  let devId = localStorage.getItem('dev_user_id');
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('dev_user_id', devId);
  }
  return devId;
}

interface PersistenceData {
  watchlist: Movie[];
  swipeCount: number;
  watchedCount: number;
}

export function usePersistence(onDataLoaded: (data: PersistenceData) => void) {
  const userId = useRef(getUserId());
  const loaded = useRef(false);

  // Load data on mount
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const load = async () => {
      const uid = userId.current;

      const [statsRes, watchlistRes] = await Promise.all([
        supabase.from('user_stats').select('*').eq('telegram_user_id', uid).maybeSingle(),
        supabase.from('watchlist_items').select('*').eq('telegram_user_id', uid).order('created_at', { ascending: true }),
      ]);

      const stats = statsRes.data;
      const watchlistRows = watchlistRes.data ?? [];

      onDataLoaded({
        watchlist: watchlistRows.map((r: any) => r.movie_data as Movie),
        swipeCount: stats?.swipe_count ?? 0,
        watchedCount: stats?.watched_count ?? 0,
      });
    };

    load();
  }, [onDataLoaded]);

  const saveStats = useCallback(async (swipeCount: number, watchedCount: number) => {
    const uid = userId.current;
    await supabase.from('user_stats').upsert(
      { telegram_user_id: uid, swipe_count: swipeCount, watched_count: watchedCount, updated_at: new Date().toISOString() },
      { onConflict: 'telegram_user_id' }
    );
  }, []);

  const addToWatchlist = useCallback(async (movie: Movie) => {
    const uid = userId.current;
    await supabase.from('watchlist_items').upsert(
      { telegram_user_id: uid, movie_data: movie as any },
      { onConflict: 'telegram_user_id,movie_data->>id' }
    ).then(() => {}); // ignore duplicate errors
  }, []);

  const removeFromWatchlist = useCallback(async (movieId: string) => {
    const uid = userId.current;
    // We need to delete by telegram_user_id and movie id inside jsonb
    const { data } = await supabase
      .from('watchlist_items')
      .select('id, movie_data')
      .eq('telegram_user_id', uid);
    
    const toDelete = data?.find((r: any) => (r.movie_data as any)?.id === movieId);
    if (toDelete) {
      await supabase.from('watchlist_items').delete().eq('id', toDelete.id);
    }
  }, []);

  return { saveStats, addToWatchlist, removeFromWatchlist };
}
