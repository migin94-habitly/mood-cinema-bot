import { supabase } from '@/integrations/supabase/client';
import { getUserId } from '@/hooks/usePersistence';
import { getTelegramWebApp } from '@/lib/telegram';

export interface NotificationPrefs {
  cinemaAlerts: boolean;
  weeklyDigest: boolean;
  chatId: string | null;
}

const DEFAULTS: NotificationPrefs = {
  cinemaAlerts: true,
  weeklyDigest: true,
  chatId: null,
};

export async function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  const userId = getUserId();
  const { data } = await supabase
    .from('notification_preferences')
    .select('cinema_alerts, weekly_digest, telegram_chat_id')
    .eq('telegram_user_id', userId)
    .maybeSingle();
  if (!data) return DEFAULTS;
  return {
    cinemaAlerts: data.cinema_alerts,
    weeklyDigest: data.weekly_digest,
    chatId: data.telegram_chat_id,
  };
}

export async function upsertNotificationPrefs(patch: Partial<NotificationPrefs>): Promise<void> {
  const userId = getUserId();
  const tg = getTelegramWebApp();
  const chatId = tg?.initDataUnsafe?.user?.id?.toString() ?? null;
  await supabase
    .from('notification_preferences')
    .upsert(
      {
        telegram_user_id: userId,
        telegram_chat_id: patch.chatId ?? chatId,
        cinema_alerts: patch.cinemaAlerts ?? true,
        weekly_digest: patch.weeklyDigest ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_user_id' }
    );
}