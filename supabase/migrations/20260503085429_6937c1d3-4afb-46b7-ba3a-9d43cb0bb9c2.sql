ALTER TABLE public.cinema_movies ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'almaty';
CREATE INDEX IF NOT EXISTS idx_cinema_movies_city ON public.cinema_movies(city);