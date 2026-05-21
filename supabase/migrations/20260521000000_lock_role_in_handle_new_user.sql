-- Make handle_new_user safe for public PT self-signup.
-- The previous version trusted whatever role was in raw_user_meta_data, which
-- let any client-side signUp({ data: { role: 'admin' } }) create an admin
-- profile. We now whitelist roles: only 'therapist' and 'patient' are honored
-- from user metadata; anything else (including 'admin') falls back to
-- 'patient'. Admin promotion must happen server-side via the service role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
  resolved_role TEXT;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';

  IF requested_role IN ('therapist', 'patient') THEN
    resolved_role := requested_role;
  ELSE
    resolved_role := 'patient';
  END IF;

  INSERT INTO public.profiles (id, role, email, full_name)
  VALUES (
    NEW.id,
    resolved_role,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
