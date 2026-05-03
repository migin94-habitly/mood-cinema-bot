import { supabase } from '@/integrations/supabase/client';
import { getUserId } from '@/hooks/usePersistence';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Унифицированная разметка ключевых событий (key events).
 * Имена в snake_case, совместимы с Mixpanel / Amplitude / GA4 / Telegram Analytics.
 */
export type KeyEvent =
  // Lifecycle
  | 'session_start'
  | 'app_open'
  | 'screen_view'
  // Onboarding
  | 'welcome_start'
  | 'mood_select'
  // Discovery / swipes
  | 'recommendations_loaded'
  | 'swipe_like'
  | 'swipe_pass'
  | 'card_details_open'
  | 'filters_apply'
  | 'recommendations_refresh'
  // Watchlist
  | 'watchlist_add'
  | 'watchlist_remove'
  | 'watchlist_mark_watched'
  | 'watchlist_unmark_watched'
  | 'watch_source_open'
  // Cinema (Ticketon)
  | 'cinema_click'
  | 'cinema_session_open'
  // Monetization
  | 'paywall_view'
  | 'paywall_plan_select'
  | 'paywall_invoice_open'
  | 'pro_activated'
  | 'free_limit_hit'
  // Engagement
  | 'streak_increment'
  | 'achievement_unlock'
  | 'notification_settings_change';

type Props = Record<string, unknown>;

// ---------- Adapters ----------
// Подключаются автоматически если в window есть mixpanel/amplitude/gtag/dataLayer.
// Telegram Mini App: дополнительно отправляем через postEvent('web_app_trigger_haptic')-style? нет — используем sendData / TGAnalytics.

type Adapter = (event: string, props: Props) => void;

const adapters: Adapter[] = [];

function registerAdapter(a: Adapter) { adapters.push(a); }

if (typeof window !== 'undefined') {
  const w = window as any;

  // Mixpanel
  registerAdapter((event, props) => {
    if (w.mixpanel?.track) {
      try { w.mixpanel.track(event, props); } catch {}
    }
  });

  // Amplitude (v2 SDK)
  registerAdapter((event, props) => {
    if (w.amplitude?.track) {
      try { w.amplitude.track(event, props); } catch {}
    }
  });

  // Google Analytics 4 (gtag) + GTM dataLayer
  registerAdapter((event, props) => {
    if (typeof w.gtag === 'function') {
      try { w.gtag('event', event, props); } catch {}
    }
    if (Array.isArray(w.dataLayer)) {
      try { w.dataLayer.push({ event, ...props }); } catch {}
    }
  });

  // PostHog
  registerAdapter((event, props) => {
    if (w.posthog?.capture) {
      try { w.posthog.capture(event, props); } catch {}
    }
  });

  // Telegram Analytics SDK (https://docs.telemetree.io)
  registerAdapter((event, props) => {
    if (w.TelegramAnalytics?.trackEvent) {
      try { w.TelegramAnalytics.trackEvent(event, props); } catch {}
    }
  });
}

// ---------- Public API ----------

function getCommonProps(): Props {
  const tg = getTelegramWebApp() as any;
  const user: any = tg?.initDataUnsafe?.user;
  return {
    user_id: getUserId(),
    platform: tg?.platform ?? 'web',
    is_telegram: !!tg,
    tg_user_id: user?.id ? String(user.id) : undefined,
    tg_language: user?.language_code,
    tg_premium: user?.is_premium,
    ts: new Date().toISOString(),
  };
}

/**
 * Универсальный трекер ключевых событий.
 * Пишет в нашу БД (analytics_events) + рассылает во все обнаруженные SDK
 * (Mixpanel, Amplitude, GA4/GTM, PostHog, Telegram Analytics).
 */
export function trackEvent(eventType: KeyEvent, data: Props = {}) {
  const common = getCommonProps();
  const props = { ...common, ...data };

  // 1. Internal storage (Supabase)
  supabase
    .from('analytics_events')
    .insert([{ telegram_user_id: common.user_id as string, event_type: eventType, event_data: props as any }])
    .then();

  // 2. External adapters (fan-out)
  for (const adapter of adapters) adapter(eventType, props);

  // 3. Dev visibility
  if (typeof window !== 'undefined' && (window as any).__DEBUG_ANALYTICS__) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', eventType, props);
  }
}

/** Регистрация кастомного адаптера (например, кастомного backend'а). */
export function addAnalyticsAdapter(adapter: Adapter) {
  registerAdapter(adapter);
}

/** Идентифицируем пользователя во внешних SDK (вызывается на старте сессии). */
export function identifyUser() {
  if (typeof window === 'undefined') return;
  const w = window as any;
  const common = getCommonProps();
  const id = common.user_id as string;
  const traits = {
    tg_user_id: common.tg_user_id,
    tg_language: common.tg_language,
    tg_premium: common.tg_premium,
    platform: common.platform,
  };
  try { w.mixpanel?.identify?.(id); w.mixpanel?.people?.set?.(traits); } catch {}
  try { w.amplitude?.setUserId?.(id); w.amplitude?.identify?.(traits); } catch {}
  try { w.posthog?.identify?.(id, traits); } catch {}
  try { w.gtag?.('set', { user_id: id }); } catch {}
}
