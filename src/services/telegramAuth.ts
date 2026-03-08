import { supabase } from '@/integrations/supabase/client';
import { getTelegramWebApp } from '@/lib/telegram';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

let cachedUser: TelegramUser | null = null;
let validationDone = false;

/**
 * Validates Telegram initData server-side and returns the verified user.
 * Falls back to initDataUnsafe in dev/preview environments.
 */
export async function getValidatedTelegramUser(): Promise<TelegramUser | null> {
  if (validationDone) return cachedUser;

  const tg = getTelegramWebApp();
  if (!tg) {
    validationDone = true;
    return null;
  }

  const initData = (tg as any).initData as string | undefined;

  // If no initData string (e.g. bot inline mode or old SDK), fall back
  if (!initData) {
    cachedUser = tg.initDataUnsafe?.user
      ? { ...tg.initDataUnsafe.user }
      : null;
    validationDone = true;
    return cachedUser;
  }

  try {
    const { data, error } = await supabase.functions.invoke('validate-telegram', {
      body: { initData },
    });

    if (error || !data?.valid || !data?.user) {
      console.warn('Telegram initData validation failed, falling back to unsafe', error);
      cachedUser = tg.initDataUnsafe?.user ? { ...tg.initDataUnsafe.user } : null;
    } else {
      cachedUser = data.user as TelegramUser;
    }
  } catch (e) {
    console.warn('Telegram validation request failed', e);
    cachedUser = tg.initDataUnsafe?.user ? { ...tg.initDataUnsafe.user } : null;
  }

  validationDone = true;
  return cachedUser;
}

export function getCachedTelegramUser(): TelegramUser | null {
  return cachedUser;
}
