
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS movie_id text;

UPDATE public.watchlist_items SET movie_id = movie_data->>'id' WHERE movie_id IS NULL;

ALTER TABLE public.watchlist_items ALTER COLUMN movie_id SET NOT NULL;

ALTER TABLE public.watchlist_items ADD CONSTRAINT watchlist_items_user_movie_unique UNIQUE (telegram_user_id, movie_id);
