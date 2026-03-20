-- Fix handle_new_user trigger to read role from signup metadata
-- instead of hardcoding 'student' for everyone.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (user_id) DO NOTHING;

  -- Read role from sign-up metadata; default to 'student' if not set or invalid
  BEGIN
    _role := (NEW.raw_user_meta_data ->> 'role')::public.app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    _role := 'student';
  END;

  IF _role IS NULL THEN
    _role := 'student';
  END IF;

  -- Insert role (or update if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Also fix existing teacher accounts that were given the wrong role.
-- This updates any user whose metadata says 'teacher' but whose user_roles
-- row says 'student' (the common case caused by the old broken trigger).
UPDATE public.user_roles ur
SET role = 'teacher'
FROM auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'student'
  AND (u.raw_user_meta_data ->> 'role') = 'teacher';

-- Insert missing teacher rows for users who had no user_roles row at all
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'teacher'::public.app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL
  AND (u.raw_user_meta_data ->> 'role') = 'teacher'
ON CONFLICT DO NOTHING;
