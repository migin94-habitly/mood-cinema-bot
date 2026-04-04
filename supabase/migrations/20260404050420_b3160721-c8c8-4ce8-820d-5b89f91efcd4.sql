CREATE POLICY "Service role can delete cinema movies"
ON public.cinema_movies FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Service role can insert cinema movies"
ON public.cinema_movies FOR INSERT
TO service_role
WITH CHECK (true);

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;