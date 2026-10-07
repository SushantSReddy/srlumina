CREATE OR REPLACE FUNCTION public.friend_leaderboard(_days integer)
 RETURNS TABLE(user_id uuid, display_name text, total bigint, is_me boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH direct AS (
    SELECT friend_id AS uid FROM friendships WHERE friendships.user_id = auth.uid()
  ), people AS (
    SELECT auth.uid() AS uid
    UNION SELECT uid FROM direct
    UNION SELECT f.friend_id FROM friendships f JOIN direct d ON f.user_id = d.uid
  )
  SELECT p.uid, COALESCE(pr.display_name, 'Friend'),
    COALESCE((SELECT SUM(q.count) FROM question_logs q WHERE q.user_id = p.uid
      AND (_days <= 0 OR q.logged_on >= (now() AT TIME ZONE 'UTC')::date - (_days - 1))), 0)::bigint,
    p.uid = auth.uid()
  FROM people p LEFT JOIN profiles pr ON pr.id = p.uid
  WHERE auth.uid() IS NOT NULL AND p.uid IS NOT NULL
  ORDER BY 3 DESC
$function$;
GRANT EXECUTE ON FUNCTION public.friend_leaderboard(integer) TO authenticated;