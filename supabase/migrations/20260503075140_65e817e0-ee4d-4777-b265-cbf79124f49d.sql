
-- Notification preferences (per user)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL UNIQUE,
  telegram_chat_id text,
  cinema_alerts boolean NOT NULL DEFAULT true,
  weekly_digest boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to notification_preferences"
  ON public.notification_preferences FOR ALL
  USING (true) WITH CHECK (true);

-- Log of sent notifications (dedupe)
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL,
  kind text NOT NULL,
  ref_key text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_notif_log_user_kind_ref
  ON public.notifications_log (telegram_user_id, kind, ref_key);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notifications_log"
  ON public.notifications_log FOR SELECT USING (true);

CREATE POLICY "Service role can write notifications_log"
  ON public.notifications_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);
