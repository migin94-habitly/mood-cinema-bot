
CREATE TABLE public.recommendation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL,
  movie_title text NOT NULL,
  movie_title_original text,
  recommended_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_rec_history_user_date ON public.recommendation_history (telegram_user_id, recommended_at);

ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to recommendation_history" ON public.recommendation_history
  FOR ALL USING (true) WITH CHECK (true);
