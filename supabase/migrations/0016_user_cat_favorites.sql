-- Create user_cat_favorites table for persisting favorite cats.
-- (Renumbered from a duplicate 0014_ prefix to keep migration ordering clean.)
CREATE TABLE IF NOT EXISTS public.user_cat_favorites (
  user_id    uuid        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  capture_id uuid        NOT NULL REFERENCES public.captures(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, capture_id)
);

-- Enable RLS
ALTER TABLE public.user_cat_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read/write their own favorites
DROP POLICY IF EXISTS "Users manage their own favorites" ON public.user_cat_favorites;
CREATE POLICY "Users manage their own favorites"
  ON public.user_cat_favorites
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_cat_favorites_user_id
  ON public.user_cat_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_user_cat_favorites_capture_id
  ON public.user_cat_favorites(capture_id);
