-- Provision a complete baseline student record for every self-service signup.
-- Badge eligibility remains an academic/administrative decision; this only
-- creates the profile required to identify the student in Panel.

CREATE UNIQUE INDEX IF NOT EXISTS students_one_profile
  ON public.students (user_id);

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_student_code text := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'student_code', ''),
    'Panel-' || left(replace(NEW.id::text, '-', ''), 12)
  );
BEGIN
  INSERT INTO public.users (auth_user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    'STUDENT'
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = NOW()
  RETURNING id INTO v_profile_id;

  INSERT INTO public.students (user_id, student_code, batch, academic_year, college)
  SELECT
    v_profile_id,
    v_student_code,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'batch', ''), 'Cohort 2026'),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'academic_year', ''), '2026-2027'),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'college', ''), 'NIAT Hyderabad')
  WHERE NOT EXISTS (
    SELECT 1 FROM public.students WHERE user_id = v_profile_id
  );

  RETURN NEW;
END;
$$;

-- Bring previously registered students (including accounts created before
-- this trigger was enhanced) to the same baseline profile state.
INSERT INTO public.students (user_id, student_code, batch, academic_year, college)
SELECT
  profile.id,
  'Panel-' || left(replace(profile.auth_user_id::text, '-', ''), 12),
  'Cohort 2026',
  '2026-2027',
  'NIAT Hyderabad'
FROM public.users AS profile
WHERE profile.role = 'STUDENT'
  AND profile.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.students AS student WHERE student.user_id = profile.id
  );
