
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject public.app_subject NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapters TO authenticated;
GRANT ALL ON public.chapters TO service_role;

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own chapters all" ON public.chapters
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.question_logs
  ADD COLUMN chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;

CREATE INDEX question_logs_chapter_id_idx ON public.question_logs(chapter_id);
