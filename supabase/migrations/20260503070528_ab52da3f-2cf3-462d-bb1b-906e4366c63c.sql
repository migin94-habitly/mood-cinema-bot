
-- 1. Daily streaks
CREATE TABLE public.daily_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 1,
  longest_streak integer NOT NULL DEFAULT 1,
  last_active_date date NOT NULL DEFAULT CURRENT_DATE,
  total_days integer NOT NULL DEFAULT 1,
  late_night_sessions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to daily_streaks" ON public.daily_streaks FOR ALL USING (true) WITH CHECK (true);

-- 2. Mood history (unique per user+mood — first usage)
CREATE TABLE public.mood_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL,
  mood text NOT NULL,
  use_count integer NOT NULL DEFAULT 1,
  first_used_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (telegram_user_id, mood)
);
ALTER TABLE public.mood_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to mood_history" ON public.mood_history FOR ALL USING (true) WITH CHECK (true);

-- 3. Cinema clicks counter
CREATE TABLE public.cinema_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL,
  movie_title text,
  movie_url text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cinema_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to cinema_clicks" ON public.cinema_clicks FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_cinema_clicks_user ON public.cinema_clicks(telegram_user_id);

-- 4. Watched movies
CREATE TABLE public.watched_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL,
  movie_id text NOT NULL,
  movie_title text,
  rating integer, -- optional 1-5 future
  watched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (telegram_user_id, movie_id)
);
ALTER TABLE public.watched_movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to watched_movies" ON public.watched_movies FOR ALL USING (true) WITH CHECK (true);

-- 5. Subscriptions (Pro)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'free', -- 'free' | 'pro'
  status text NOT NULL DEFAULT 'inactive', -- 'inactive' | 'active' | 'expired' | 'cancelled'
  expires_at timestamptz,
  last_payment_charge_id text,
  last_payment_payload text,
  stars_paid integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Service role can write subscriptions" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Daily usage (free limit tracking)
CREATE TABLE public.daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  recommendation_count integer NOT NULL DEFAULT 0,
  UNIQUE (telegram_user_id, usage_date)
);
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to daily_usage" ON public.daily_usage FOR ALL USING (true) WITH CHECK (true);

-- Helper: increment streak on session
CREATE OR REPLACE FUNCTION public.touch_streak(p_user_id text)
RETURNS TABLE(current_streak integer, longest_streak integer, total_days integer, last_active_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_row daily_streaks%ROWTYPE;
  v_new_streak integer;
  v_new_total integer;
  v_late boolean := EXTRACT(HOUR FROM now()) >= 23 OR EXTRACT(HOUR FROM now()) < 4;
BEGIN
  SELECT * INTO v_row FROM daily_streaks WHERE telegram_user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO daily_streaks(telegram_user_id, current_streak, longest_streak, last_active_date, total_days, late_night_sessions)
    VALUES (p_user_id, 1, 1, v_today, 1, CASE WHEN v_late THEN 1 ELSE 0 END)
    RETURNING daily_streaks.current_streak, daily_streaks.longest_streak, daily_streaks.total_days, daily_streaks.last_active_date
      INTO current_streak, longest_streak, total_days, last_active_date;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_row.last_active_date = v_today THEN
    -- already counted today, just maybe increment late_night
    UPDATE daily_streaks
      SET late_night_sessions = late_night_sessions + CASE WHEN v_late THEN 1 ELSE 0 END,
          updated_at = now()
      WHERE telegram_user_id = p_user_id;
    current_streak := v_row.current_streak;
    longest_streak := v_row.longest_streak;
    total_days := v_row.total_days;
    last_active_date := v_row.last_active_date;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_row.last_active_date = v_today - INTERVAL '1 day' THEN
    v_new_streak := v_row.current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;
  v_new_total := v_row.total_days + 1;

  UPDATE daily_streaks
    SET current_streak = v_new_streak,
        longest_streak = GREATEST(v_row.longest_streak, v_new_streak),
        last_active_date = v_today,
        total_days = v_new_total,
        late_night_sessions = late_night_sessions + CASE WHEN v_late THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE telegram_user_id = p_user_id
    RETURNING daily_streaks.current_streak, daily_streaks.longest_streak, daily_streaks.total_days, daily_streaks.last_active_date
      INTO current_streak, longest_streak, total_days, last_active_date;
  RETURN NEXT;
END;
$$;
