CREATE TABLE public.friend_group_managers (user_id uuid PRIMARY KEY);
GRANT SELECT ON public.friend_group_managers TO authenticated;
GRANT ALL ON public.friend_group_managers TO service_role;
ALTER TABLE public.friend_group_managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own group management permission" ON public.friend_group_managers FOR SELECT TO authenticated USING (user_id = auth.uid());
INSERT INTO public.friend_group_managers(user_id) SELECT id FROM auth.users WHERE lower(email) = 'sangapudesushant@gmail.com';
CREATE TABLE public.friend_group_removals (owner_id uuid NOT NULL REFERENCES public.friend_group_managers(user_id), member_id uuid NOT NULL, removed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner_id, member_id), CHECK(owner_id <> member_id));
GRANT SELECT ON public.friend_group_removals TO authenticated;
GRANT ALL ON public.friend_group_removals TO service_role;
ALTER TABLE public.friend_group_removals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads group removals" ON public.friend_group_removals FOR SELECT TO authenticated USING(owner_id = auth.uid());
CREATE OR REPLACE FUNCTION public.can_manage_friend_group() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS(SELECT 1 FROM public.friend_group_managers WHERE user_id = auth.uid()) $$;
REVOKE ALL ON FUNCTION public.can_manage_friend_group() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_friend_group() TO authenticated;
CREATE OR REPLACE FUNCTION public.remove_friend_from_group(_member_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid := auth.uid();
BEGIN
 IF _me IS NULL OR NOT EXISTS (SELECT 1 FROM public.friend_group_managers WHERE user_id = _me) THEN RAISE EXCEPTION 'Only the group owner can remove members' USING ERRCODE = '42501'; END IF;
 IF _member_id IS NULL OR _member_id = _me THEN RAISE EXCEPTION 'Choose another group member'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.friendships f WHERE f.user_id = _me AND f.friend_id = _member_id UNION ALL SELECT 1 FROM public.friendships f JOIN public.friendships d ON d.friend_id = f.user_id WHERE d.user_id = _me AND f.friend_id = _member_id) THEN RAISE EXCEPTION 'This person is not in your group'; END IF;
 INSERT INTO public.friend_group_removals(owner_id, member_id) VALUES (_me, _member_id) ON CONFLICT DO NOTHING;
 DELETE FROM public.friendships WHERE (user_id = _me AND friend_id = _member_id) OR (user_id = _member_id AND friend_id = _me);
END $$;
REVOKE ALL ON FUNCTION public.remove_friend_from_group(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_friend_from_group(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.friend_leaderboard(_days integer) RETURNS TABLE(user_id uuid, display_name text, total bigint, is_me boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 WITH direct AS (SELECT friend_id AS uid FROM public.friendships WHERE friendships.user_id = auth.uid()),
 people AS (SELECT auth.uid() AS uid UNION SELECT uid FROM direct UNION SELECT f.friend_id FROM public.friendships f JOIN direct d ON f.user_id = d.uid),
 managed_people AS (
 SELECT m.user_id AS owner_id, m.user_id AS uid FROM public.friend_group_managers m
 UNION SELECT m.user_id, f.friend_id FROM public.friend_group_managers m JOIN public.friendships f ON f.user_id=m.user_id
 UNION SELECT m.user_id, f.friend_id FROM public.friend_group_managers m JOIN public.friendships d ON d.user_id=m.user_id JOIN public.friendships f ON f.user_id=d.friend_id
 ), visible AS (
 SELECT p.uid FROM people p WHERE p.uid = auth.uid() OR NOT EXISTS (
 SELECT 1 FROM public.friend_group_removals r WHERE
 (r.member_id=p.uid AND EXISTS(SELECT 1 FROM managed_people g WHERE g.owner_id=r.owner_id AND g.uid=auth.uid()))
 OR (r.member_id=auth.uid() AND EXISTS(SELECT 1 FROM managed_people g WHERE g.owner_id=r.owner_id AND g.uid=p.uid))
 ))
 SELECT p.uid, COALESCE(pr.display_name, 'Friend'), COALESCE((SELECT SUM(q.count) FROM public.question_logs q WHERE q.user_id=p.uid AND (_days <= 0 OR q.logged_on >= (now() AT TIME ZONE 'UTC')::date - (_days - 1))),0)::bigint, p.uid=auth.uid()
 FROM visible p LEFT JOIN public.profiles pr ON pr.id=p.uid WHERE auth.uid() IS NOT NULL AND p.uid IS NOT NULL ORDER BY 3 DESC
 $$;