import { supabase } from '@/integrations/supabase/client';
import { getUserId } from '@/hooks/usePersistence';

type EventType =
  | 'mood_select'
  | 'swipe_like'
  | 'swipe_pass'
  | 'watchlist_add'
  | 'watchlist_remove'
  | 'session_start';

export function trackEvent(eventType: EventType, data: Record<string, unknown> = {}) {
  const userId = getUserId();
  // Fire-and-forget — don't block UI
  supabase
    .from('analytics_events')
    .insert({ telegram_user_id: userId, event_type: eventType, event_data: data })
    .then();
}
