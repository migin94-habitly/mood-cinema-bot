CREATE TABLE public.cinema_movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  age_rating TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cinema_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cinema movies"
ON public.cinema_movies FOR SELECT
TO anon, authenticated
USING (true);