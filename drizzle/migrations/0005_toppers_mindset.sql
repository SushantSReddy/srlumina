-- Topper's Mindset: user-owned mindset progress data.
-- Additive only; user_id is a plain uuid (no FK to auth.users).

CREATE TABLE public.mindset_code_progress (
  user_id uuid NOT NULL,
  principle_key text NOT NULL,
  challenge_done boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, principle_key)
);

CREATE TABLE public.mindset_mistakes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject app_subject NOT NULL,
  chapter text NOT NULL,
  category text NOT NULL,
  question_ref text,
  reason text NOT NULL,
  should_have_done text NOT NULL,
  prevention text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.mindset_daily_os (
  user_id uuid NOT NULL,
  logged_on date NOT NULL,
  done_items text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, logged_on)
);

CREATE TABLE public.mindset_challenge_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_on date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  completed_days integer[] NOT NULL DEFAULT '{}',
  reflections jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.mindset_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  report jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mindset_code_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mindset_mistakes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mindset_daily_os TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mindset_challenge_runs TO authenticated;
GRANT SELECT, INSERT ON public.mindset_assessments TO authenticated;
GRANT ALL ON public.mindset_code_progress TO service_role;
GRANT ALL ON public.mindset_mistakes TO service_role;
GRANT ALL ON public.mindset_daily_os TO service_role;
GRANT ALL ON public.mindset_challenge_runs TO service_role;
GRANT ALL ON public.mindset_assessments TO service_role;

ALTER TABLE public.mindset_code_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindset_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindset_daily_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindset_challenge_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindset_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_mindset_code ON public.mindset_code_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_mindset_mistakes ON public.mindset_mistakes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_mindset_daily_os ON public.mindset_daily_os
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_mindset_challenge_runs ON public.mindset_challenge_runs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_mindset_assessments ON public.mindset_assessments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY insert_mindset_assessments ON public.mindset_assessments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX mindset_mistakes_user_recent_idx ON public.mindset_mistakes (user_id, created_at DESC);
CREATE INDEX mindset_challenge_runs_user_idx ON public.mindset_challenge_runs (user_id, active);
CREATE INDEX mindset_assessments_user_recent_idx ON public.mindset_assessments (user_id, created_at DESC);

CREATE TRIGGER mindset_code_progress_touch_updated_at
  BEFORE UPDATE ON public.mindset_code_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER mindset_daily_os_touch_updated_at
  BEFORE UPDATE ON public.mindset_daily_os
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER mindset_challenge_runs_touch_updated_at
  BEFORE UPDATE ON public.mindset_challenge_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();