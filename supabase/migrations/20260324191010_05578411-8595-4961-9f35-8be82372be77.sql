
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  total_classes bigint,
  attended_classes bigint,
  attendance_pct numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ur.user_id,
    COALESCE(p.full_name, 'Student') AS full_name,
    p.avatar_url,
    COUNT(a.id) AS total_classes,
    COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS attended_classes,
    CASE WHEN COUNT(a.id) > 0
      THEN ROUND((COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::numeric / COUNT(a.id)) * 100)
      ELSE 0
    END AS attendance_pct
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  LEFT JOIN public.attendance a ON a.student_id = ur.user_id
  WHERE ur.role = 'student'
  GROUP BY ur.user_id, p.full_name, p.avatar_url
  ORDER BY attendance_pct DESC, attended_classes DESC;
$$;
