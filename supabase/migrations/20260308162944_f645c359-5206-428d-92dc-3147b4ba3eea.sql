
-- User stats table
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id TEXT NOT NULL UNIQUE,
  swipe_count INT NOT NULL DEFAULT 0,
  watched_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Watchlist items table
CREATE TABLE public.watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id TEXT NOT NULL,
  movie_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_watchlist_unique ON public.watchlist_items (telegram_user_id, (movie_data->>'id'));

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- Public access policies (Telegram mini-app, no Supabase auth)
CREATE POLICY "Allow all access to user_stats" ON public.user_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to watchlist_items" ON public.watchlist_items FOR ALL USING (true) WITH CHECK (true);
