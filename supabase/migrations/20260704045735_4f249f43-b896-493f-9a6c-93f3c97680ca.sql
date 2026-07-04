CREATE TYPE public.app_class_level AS ENUM ('class_9','class_10','class_11','class_12','dropper');
ALTER TABLE public.profiles ADD COLUMN class_level public.app_class_level;
ALTER TABLE public.profiles ADD COLUMN target_year integer;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_target_year_range CHECK (target_year IS NULL OR (target_year >= 2025 AND target_year <= 2035));