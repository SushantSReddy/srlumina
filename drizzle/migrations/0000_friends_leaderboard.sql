ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 10);
UPDATE public.profiles SET invite_code = substr(md5(random()::text || id::text), 1, 10) WHERE invite_code IS NULL;

CREATE TABLE public.friendships (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);
GRANT SELECT, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own friendships read" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own friendships delete" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.add_friend_by_code(_code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid := auth.uid(); _other uuid; _name text;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id, display_name INTO _other, _name FROM profiles WHERE invite_code = _code;
  IF _other IS NULL THEN RAISE EXCEPTION 'Invalid invite link'; END IF;
  IF _other = _me THEN RETURN NULL; END IF;
  INSERT INTO friendships(user_id, friend_id) VALUES (_me, _other), (_other, _me) ON CONFLICT DO NOTHING;
  RETURN _name;
END $$;

CREATE OR REPLACE FUNCTION public.my_invite_code()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT invite_code FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.friend_leaderboard(_days int)
RETURNS TABLE(user_id uuid, display_name text, total bigint, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH people AS (
    SELECT auth.uid() AS uid
    UNION SELECT friend_id FROM friendships WHERE friendships.user_id = auth.uid()
  )
  SELECT p.uid, COALESCE(pr.display_name, 'Friend'),
    COALESCE((SELECT SUM(q.count) FROM question_logs q WHERE q.user_id = p.uid
      AND (_days <= 0 OR q.logged_on >= (now() AT TIME ZONE 'UTC')::date - (_days - 1))), 0)::bigint,
    p.uid = auth.uid()
  FROM people p LEFT JOIN profiles pr ON pr.id = p.uid
  WHERE auth.uid() IS NOT NULL
  ORDER BY 3 DESC
$$;

REVOKE EXECUTE ON FUNCTION public.add_friend_by_code(text), public.my_invite_code(), public.friend_leaderboard(int) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.add_friend_by_code(text), public.my_invite_code(), public.friend_leaderboard(int) TO authenticated;