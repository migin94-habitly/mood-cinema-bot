import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Movie } from '@/types/movie';
import { getValidatedTelegramUser } from '@/services/telegramAuth';
import { isTelegramEnvironment } from '@/lib/telegram';

function getDevUserId(): string {
  let devId = localStorage.getItem('dev_user_id');
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('dev_user_id', devId);
  }
  return devId;
}

export function getUserId(): string {
  // Synchronous fallback — used where async isn't possible
  if (!isTelegramEnvironment()) return getDevUserId();
  const tg = window.Telegram?.WebApp;
  const id = tg?.initDataUnsafe?.user?.id;
  return id ? String(id) : getDevUserId();
}

interface PersistenceData {
  watchlist: Movie[];
  swipeCount: number;
  watchedCount: number;
}

export function usePersistence(onDataLoaded: (data: PersistenceData) => void) {
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const loaded = useRef(false);

  // Resolve user ID asynchronously with server validation
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isTelegramEnvironment()) {
        const user = await getValidatedTelegramUser();
        if (!cancelled) {
          setResolvedUserId(user ? String(user.id) : getDevUserId());
        }
      } else {
        if (!cancelled) setResolvedUserId(getDevUserId());
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load data once user ID is resolved
  useEffect(() => {
    if (!resolvedUserId || loaded.current) return;
    loaded.current = true;

    const load = async () => {
      const [statsRes, watchlistRes] = await Promise.all([
        supabase.from('user_stats').select('*').eq('telegram_user_id', resolvedUserId).maybeSingle(),
        supabase.from('watchlist_items').select('*').eq('telegram_user_id', resolvedUserId).order('created_at', { ascending: true }),
      ]);

      onDataLoaded({
        watchlist: (watchlistRes.data ?? []).map((r: any) => r.movie_data as Movie),
        swipeCount: statsRes.data?.swipe_count ?? 0,
        watchedCount: statsRes.data?.watched_count ?? 0,
      });
    };

    load();
  }, [resolvedUserId, onDataLoaded]);

  const saveStats = useCallback(async (swipeCount: number, watchedCount: number) => {
    if (!resolvedUserId) return;
    await supabase.from('user_stats').upsert(
      { telegram_user_id: resolvedUserId, swipe_count: swipeCount, watched_count: watchedCount, updated_at: new Date().toISOString() },
      { onConflict: 'telegram_user_id' }
    );
  }, [resolvedUserId]);

  const addToWatchlist = useCallback(async (movie: Movie) => {
    if (!resolvedUserId) return;
    await supabase.from('watchlist_items').upsert(
      { telegram_user_id: resolvedUserId, movie_id: movie.id, movie_data: movie as any },
      { onConflict: 'telegram_user_id,movie_id' }
    );
  }, [resolvedUserId]);

  const removeFromWatchlist = useCallback(async (movieId: string) => {
    if (!resolvedUserId) return;
    await supabase
      .from('watchlist_items')
      .delete()
      .eq('telegram_user_id', resolvedUserId)
      .eq('movie_id', movieId);
  }, [resolvedUserId]);

  return { saveStats, addToWatchlist, removeFromWatchlist };
}
