ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_timezone text NOT NULL DEFAULT 'UTC';
CREATE TABLE public.pyq_chapters (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subject public.app_subject NOT NULL, name text NOT NULL, UNIQUE(subject,name));
GRANT SELECT ON public.pyq_chapters TO authenticated; GRANT ALL ON public.pyq_chapters TO service_role;
ALTER TABLE public.pyq_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read PYQ chapters" ON public.pyq_chapters FOR SELECT TO authenticated USING (true);
CREATE TABLE public.pyq_questions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), chapter_id uuid NOT NULL REFERENCES public.pyq_chapters(id), exam text NOT NULL CHECK (exam IN ('jee_main','jee_advanced','neet')), year integer NOT NULL CHECK(year BETWEEN 1980 AND 2100), difficulty text NOT NULL CHECK(difficulty IN ('easy','medium','hard')), question_type text NOT NULL CHECK(question_type IN ('single','multiple','numerical','integer','matching')), prompt text NOT NULL, options jsonb NOT NULL DEFAULT '[]', diagram_url text, source_url text NOT NULL CHECK(source_url LIKE 'https://%'), source_label text NOT NULL, source_question text NOT NULL, verified boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(exam,year,source_url,source_question));
GRANT SELECT ON public.pyq_questions TO authenticated; GRANT ALL ON public.pyq_questions TO service_role;
ALTER TABLE public.pyq_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read verified PYQs" ON public.pyq_questions FOR SELECT TO authenticated USING (verified);
CREATE INDEX pyq_question_filters ON public.pyq_questions(exam,chapter_id,year,difficulty) WHERE verified;
CREATE TABLE public.pyq_answer_keys (question_id uuid PRIMARY KEY REFERENCES public.pyq_questions(id), answer jsonb NOT NULL, tolerance numeric NOT NULL DEFAULT 0 CHECK(tolerance>=0), explanation text NOT NULL, steps jsonb NOT NULL DEFAULT '[]', verified_by_source text NOT NULL CHECK(verified_by_source LIKE 'https://%'));
GRANT ALL ON public.pyq_answer_keys TO service_role;
ALTER TABLE public.pyq_answer_keys ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.pyq_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, question_ids uuid[] NOT NULL, filters jsonb NOT NULL DEFAULT '{}', current_index integer NOT NULL DEFAULT 0 CHECK(current_index>=0), drafts jsonb NOT NULL DEFAULT '{}', finished boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,UPDATE ON public.pyq_sessions TO authenticated; GRANT ALL ON public.pyq_sessions TO service_role;
ALTER TABLE public.pyq_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own PYQ sessions" ON public.pyq_sessions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Update own PYQ sessions" ON public.pyq_sessions FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
REVOKE UPDATE ON public.pyq_sessions FROM authenticated;
GRANT UPDATE(current_index,drafts,finished,updated_at) ON public.pyq_sessions TO authenticated;
CREATE INDEX pyq_session_owner ON public.pyq_sessions(user_id,created_at DESC);
CREATE TABLE public.pyq_attempts (id uuid PRIMARY KEY, user_id uuid NOT NULL, session_id uuid NOT NULL REFERENCES public.pyq_sessions(id), question_id uuid NOT NULL REFERENCES public.pyq_questions(id), answer jsonb NOT NULL, correct boolean NOT NULL, counted boolean NOT NULL DEFAULT false, logged_on date NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.pyq_attempts TO authenticated; GRANT ALL ON public.pyq_attempts TO service_role;
ALTER TABLE public.pyq_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own PYQ attempts" ON public.pyq_attempts FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE INDEX pyq_attempt_owner_question ON public.pyq_attempts(user_id,question_id,created_at DESC);
CREATE TABLE public.pyq_daily_credits (user_id uuid NOT NULL, question_id uuid NOT NULL REFERENCES public.pyq_questions(id), logged_on date NOT NULL, PRIMARY KEY(user_id,question_id,logged_on));
GRANT SELECT ON public.pyq_daily_credits TO authenticated; GRANT ALL ON public.pyq_daily_credits TO service_role;
ALTER TABLE public.pyq_daily_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own PYQ credits" ON public.pyq_daily_credits FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.pyq_collections (user_id uuid NOT NULL, question_id uuid NOT NULL REFERENCES public.pyq_questions(id), bookmarked boolean NOT NULL DEFAULT false, incorrect boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,question_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.pyq_collections TO authenticated; GRANT ALL ON public.pyq_collections TO service_role;
ALTER TABLE public.pyq_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own PYQ collections" ON public.pyq_collections FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE INDEX IF NOT EXISTS question_logs_user_day_subject ON public.question_logs(user_id,logged_on,subject);
CREATE OR REPLACE FUNCTION public.start_pyq_session(_exam text, _subject public.app_subject DEFAULT NULL, _chapter uuid DEFAULT NULL, _year integer DEFAULT NULL, _difficulty text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _ids uuid[]; _id uuid; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE='42501'; END IF;
SELECT array_agg(id) INTO _ids FROM (SELECT q.id FROM public.pyq_questions q JOIN public.pyq_chapters c ON c.id=q.chapter_id JOIN public.pyq_answer_keys k ON k.question_id=q.id WHERE q.verified AND q.exam=_exam AND (_subject IS NULL OR c.subject=_subject) AND (_chapter IS NULL OR c.id=_chapter) AND (_year IS NULL OR q.year=_year) AND (_difficulty IS NULL OR q.difficulty=_difficulty) ORDER BY q.year DESC,q.source_question,q.id LIMIT 100) matched;
IF _ids IS NULL THEN RAISE EXCEPTION 'No verified questions match these filters'; END IF;
INSERT INTO public.pyq_sessions(user_id,question_ids,filters) VALUES(auth.uid(),_ids,jsonb_build_object('exam',_exam,'subject',_subject,'chapter',_chapter,'year',_year,'difficulty',_difficulty)) RETURNING id INTO _id; RETURN _id; END $$;
REVOKE ALL ON FUNCTION public.start_pyq_session(text,public.app_subject,uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.start_pyq_session(text,public.app_subject,uuid,integer,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.pyq_solution(_question uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _result jsonb; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE='42501'; END IF;
SELECT jsonb_build_object('answer',k.answer,'explanation',k.explanation,'steps',k.steps) INTO _result FROM public.pyq_answer_keys k JOIN public.pyq_questions q ON q.id=k.question_id WHERE q.id=_question AND q.verified;
IF _result IS NULL THEN RAISE EXCEPTION 'Question unavailable'; END IF;
RETURN _result; END $$;
REVOKE ALL ON FUNCTION public.pyq_solution(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.pyq_solution(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.submit_pyq_attempt(_request uuid,_session uuid,_question uuid,_answer jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _me uuid:=auth.uid(); _q record; _key record; _old record; _correct boolean; _day date; _tz text; _counted boolean:=false; _rows integer; _chapter uuid; _source uuid; _answer_normal jsonb;
BEGIN
IF _me IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE='42501'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(_me::text,0));
SELECT * INTO _old FROM public.pyq_attempts WHERE id=_request;
IF FOUND THEN IF _old.user_id<>_me OR _old.session_id<>_session OR _old.question_id<>_question OR _old.answer<>_answer THEN RAISE EXCEPTION 'Request does not match original attempt'; END IF; RETURN jsonb_build_object('correct',_old.correct,'counted',_old.counted,'attempt_id',_old.id,'solution',public.pyq_solution(_question)); END IF;
IF NOT EXISTS(SELECT 1 FROM public.pyq_sessions WHERE id=_session AND user_id=_me AND _question=ANY(question_ids)) THEN RAISE EXCEPTION 'Question is not in your session' USING ERRCODE='42501'; END IF;
SELECT q.*,c.subject,c.name AS chapter_name INTO _q FROM public.pyq_questions q JOIN public.pyq_chapters c ON c.id=q.chapter_id WHERE q.id=_question AND q.verified;
IF NOT FOUND THEN RAISE EXCEPTION 'Question unavailable'; END IF;
SELECT * INTO _key FROM public.pyq_answer_keys WHERE question_id=_question;
IF NOT FOUND THEN RAISE EXCEPTION 'Answer unavailable'; END IF;
IF _q.question_type IN ('numerical','integer') THEN
IF jsonb_typeof(_answer)<>'string' OR (_answer#>>'{}') !~ '^[-+]?[0-9]+([.][0-9]+)?$' OR length(_answer#>>'{}')>40 THEN RAISE EXCEPTION 'Enter a valid number'; END IF;
IF _q.question_type='integer' AND mod((_answer#>>'{}')::numeric,1)<>0 THEN RAISE EXCEPTION 'Enter an integer'; END IF;
_correct:=abs((_answer#>>'{}')::numeric-(_key.answer#>>'{}')::numeric)<=_key.tolerance;
ELSIF _q.question_type IN ('single','multiple','matching') THEN
IF jsonb_typeof(_answer)<>'array' OR jsonb_array_length(_answer)=0 OR jsonb_array_length(_answer)>20 THEN RAISE EXCEPTION 'Choose an answer'; END IF;
IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(_answer) a WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_q.options) o WHERE o->>'id'=a)) THEN RAISE EXCEPTION 'Invalid option'; END IF;
IF (SELECT count(*)<>count(DISTINCT a) FROM jsonb_array_elements_text(_answer) a) THEN RAISE EXCEPTION 'Repeated option'; END IF;
IF _q.question_type='single' AND jsonb_array_length(_answer)<>1 THEN RAISE EXCEPTION 'Choose one option'; END IF;
SELECT jsonb_agg(a ORDER BY a) INTO _answer_normal FROM jsonb_array_elements_text(_answer) a;
_correct:=_answer_normal=(SELECT jsonb_agg(a ORDER BY a) FROM jsonb_array_elements_text(_key.answer) a);
ELSE RAISE EXCEPTION 'Unsupported question type'; END IF;
SELECT study_timezone INTO _tz FROM public.profiles WHERE id=_me;
IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=_tz) THEN RAISE EXCEPTION 'Invalid study timezone'; END IF;
_day:=(now() AT TIME ZONE _tz)::date;
INSERT INTO public.pyq_daily_credits(user_id,question_id,logged_on) VALUES(_me,_question,_day) ON CONFLICT DO NOTHING;
GET DIAGNOSTICS _rows=ROW_COUNT; _counted:=_rows=1;
IF _counted THEN
SELECT id INTO _chapter FROM public.chapters WHERE user_id=_me AND subject=_q.subject AND lower(trim(name))=lower(trim(_q.chapter_name)) ORDER BY created_at LIMIT 1;
IF _chapter IS NULL THEN INSERT INTO public.chapters(user_id,subject,name) VALUES(_me,_q.subject,_q.chapter_name) RETURNING id INTO _chapter; END IF;
SELECT id INTO _source FROM public.sources WHERE user_id=_me AND name='PYQs' ORDER BY created_at LIMIT 1;
IF _source IS NULL THEN INSERT INTO public.sources(user_id,name,is_default) VALUES(_me,'PYQs',true) RETURNING id INTO _source; END IF;
INSERT INTO public.question_logs(user_id,logged_on,subject,count,source_id,chapter_id,exam_level) VALUES(_me,_day,_q.subject,1,_source,_chapter,CASE _q.exam WHEN 'jee_main' THEN 'main'::public.app_exam_level WHEN 'jee_advanced' THEN 'advanced'::public.app_exam_level ELSE 'section_a'::public.app_exam_level END);
END IF;
INSERT INTO public.pyq_attempts(id,user_id,session_id,question_id,answer,correct,counted,logged_on) VALUES(_request,_me,_session,_question,_answer,_correct,_counted,_day);
INSERT INTO public.pyq_collections(user_id,question_id,incorrect) VALUES(_me,_question,NOT _correct) ON CONFLICT(user_id,question_id) DO UPDATE SET incorrect=public.pyq_collections.incorrect OR NOT _correct,updated_at=now();
RETURN jsonb_build_object('correct',_correct,'counted',_counted,'attempt_id',_request,'solution',public.pyq_solution(_question)); END $$;
REVOKE ALL ON FUNCTION public.submit_pyq_attempt(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_pyq_attempt(uuid,uuid,uuid,jsonb) TO authenticated;