CREATE OR REPLACE FUNCTION public.start_pyq_revision(_questions uuid[], _collection text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _me uuid := auth.uid(); _id uuid; _valid integer;
BEGIN
 IF _me IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE='42501'; END IF;
 IF _collection NOT IN ('all','bookmarked','incorrect') OR _collection IS NULL THEN RAISE EXCEPTION 'Invalid revision collection'; END IF;
 IF _questions IS NULL OR cardinality(_questions) < 1 OR cardinality(_questions) > 100 THEN RAISE EXCEPTION 'Choose between 1 and 100 revision questions'; END IF;
 IF EXISTS (SELECT 1 FROM unnest(_questions) q GROUP BY q HAVING count(*) > 1) THEN RAISE EXCEPTION 'Repeated revision question'; END IF;
 SELECT count(*) INTO _valid FROM public.pyq_collections c JOIN public.pyq_questions q ON q.id=c.question_id JOIN public.pyq_answer_keys k ON k.question_id=q.id
 WHERE c.user_id=_me AND q.verified AND q.id=ANY(_questions) AND (c.bookmarked OR c.incorrect)
 AND (_collection='all' OR (_collection='bookmarked' AND c.bookmarked) OR (_collection='incorrect' AND c.incorrect));
 IF _valid<>cardinality(_questions) THEN RAISE EXCEPTION 'Questions are not in your revision collection' USING ERRCODE='42501'; END IF;
 INSERT INTO public.pyq_sessions(user_id,question_ids,filters) VALUES (_me,_questions,jsonb_build_object('mode','revision','collection',_collection)) RETURNING id INTO _id;
 RETURN _id;
END $function$;
REVOKE ALL ON FUNCTION public.start_pyq_revision(uuid[],text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_pyq_revision(uuid[],text) TO authenticated, service_role;