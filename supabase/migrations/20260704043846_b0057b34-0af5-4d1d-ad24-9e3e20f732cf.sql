
-- Enums
CREATE TYPE public.app_stream AS ENUM ('jee', 'neet');
CREATE TYPE public.app_subject AS ENUM ('physics', 'chemistry', 'math', 'biology');
CREATE TYPE public.app_exam_level AS ENUM ('main', 'advanced', 'section_a', 'section_b');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  stream public.app_stream,
  daily_goal INT NOT NULL DEFAULT 50 CHECK (daily_goal > 0 AND daily_goal <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Sources
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sources all" ON public.sources FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX sources_user_idx ON public.sources(user_id);

-- Question logs
CREATE TABLE public.question_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  subject public.app_subject NOT NULL,
  count INT NOT NULL CHECK (count > 0 AND count <= 10000),
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  exam_level public.app_exam_level,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_logs TO authenticated;
GRANT ALL ON public.question_logs TO service_role;
ALTER TABLE public.question_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs all" ON public.question_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX logs_user_date_idx ON public.question_logs(user_id, logged_on DESC);
CREATE INDEX logs_user_subject_idx ON public.question_logs(user_id, subject);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Signup handler: create profile + default sources
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.sources (user_id, name, is_default) VALUES
    (NEW.id, 'Coaching Modules', true),
    (NEW.id, 'PYQs', true),
    (NEW.id, 'Reference Books', true),
    (NEW.id, 'NCERT', true),
    (NEW.id, 'Mock Tests', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
