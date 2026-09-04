create table public.dream_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  image_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dream_images TO authenticated;
GRANT ALL ON public.dream_images TO service_role;

ALTER TABLE public.dream_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dream images"
ON public.dream_images
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);