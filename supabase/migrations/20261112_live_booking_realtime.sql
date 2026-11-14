-- Live booking: authentication, authorization, atomic reservation, and Realtime.
-- Apply after 20261111_grit_interview_hub.sql.

-- Auth accounts are mapped explicitly so the existing institutional user IDs
-- and seed data remain valid.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Every self-service account starts as a student. Administrators create the
-- corresponding student record after institutional verification.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- Correct the original policies to use the Auth-to-profile mapping.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = auth.uid()
      AND role = 'ADMIN'
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

CREATE POLICY user_view_own_profile ON public.users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS student_view_own_journey ON public.student_badge_journeys;
CREATE POLICY student_view_own_journey ON public.student_badge_journeys
  FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT student.id
    FROM public.students AS student
    JOIN public.users AS profile ON profile.id = student.user_id
    WHERE profile.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS student_view_own_interviews ON public.interviews;
CREATE POLICY student_view_own_interviews ON public.interviews
  FOR SELECT TO authenticated
  USING (student_badge_journey_id IN (
    SELECT journey.id
    FROM public.student_badge_journeys AS journey
    JOIN public.students AS student ON student.id = journey.student_id
    JOIN public.users AS profile ON profile.id = student.user_id
    WHERE profile.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS student_view_feedback ON public.interview_evaluations;
CREATE POLICY student_view_feedback ON public.interview_evaluations
  FOR SELECT TO authenticated
  USING (interview_id IN (
    SELECT interview.id
    FROM public.interviews AS interview
    JOIN public.student_badge_journeys AS journey ON journey.id = interview.student_badge_journey_id
    JOIN public.students AS student ON student.id = journey.student_id
    JOIN public.users AS profile ON profile.id = student.user_id
    WHERE profile.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS interviewer_manage_assigned_interviews ON public.interviews;
CREATE POLICY interviewer_manage_assigned_interviews ON public.interviews
  FOR ALL TO authenticated
  USING (interviewer_id IN (
    SELECT interviewer.id
    FROM public.interviewers AS interviewer
    JOIN public.users AS profile ON profile.id = interviewer.user_id
    WHERE profile.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS interviewer_manage_evaluations ON public.interview_evaluations;
CREATE POLICY interviewer_manage_evaluations ON public.interview_evaluations
  FOR ALL TO authenticated
  USING (interviewer_id IN (
    SELECT interviewer.id
    FROM public.interviewers AS interviewer
    JOIN public.users AS profile ON profile.id = interviewer.user_id
    WHERE profile.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS admin_full_access_users ON public.users;
DROP POLICY IF EXISTS admin_full_access_journeys ON public.student_badge_journeys;
DROP POLICY IF EXISTS admin_full_access_interviews ON public.interviews;
DROP POLICY IF EXISTS admin_full_access_evaluations ON public.interview_evaluations;
DROP POLICY IF EXISTS admin_full_access_malpractice ON public.malpractice_cases;
DROP POLICY IF EXISTS admin_full_access_audit ON public.audit_logs;
CREATE POLICY admin_full_access_users ON public.users FOR ALL TO authenticated USING (public.is_platform_admin());
CREATE POLICY admin_full_access_journeys ON public.student_badge_journeys FOR ALL TO authenticated USING (public.is_platform_admin());
CREATE POLICY admin_full_access_interviews ON public.interviews FOR ALL TO authenticated USING (public.is_platform_admin());
CREATE POLICY admin_full_access_evaluations ON public.interview_evaluations FOR ALL TO authenticated USING (public.is_platform_admin());
CREATE POLICY admin_full_access_malpractice ON public.malpractice_cases FOR ALL TO authenticated USING (public.is_platform_admin());
CREATE POLICY admin_full_access_audit ON public.audit_logs FOR SELECT TO authenticated USING (public.is_platform_admin());

-- Profile and scheduling reads needed by the student booking screen.
CREATE POLICY student_read_own_profile ON public.students
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY authenticated_read_interviewers ON public.interviewers
  FOR SELECT TO authenticated
  USING (active = TRUE);

ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY authenticated_read_interview_slots ON public.interview_slots
  FOR SELECT TO authenticated
  USING (TRUE);

-- This narrowly scoped view provides evaluator names without exposing emails
-- or full user profiles to other students.
CREATE OR REPLACE VIEW public.booking_slots
WITH (security_invoker = false)
AS
SELECT
  slot.id,
  slot.interviewer_id,
  evaluator.full_name AS interviewer_name,
  slot.start_at,
  slot.end_at,
  slot.status
FROM public.interview_slots AS slot
JOIN public.interviewers AS interviewer ON interviewer.id = slot.interviewer_id
JOIN public.users AS evaluator ON evaluator.id = interviewer.user_id
WHERE interviewer.active = TRUE;

REVOKE ALL ON public.booking_slots FROM PUBLIC;
GRANT SELECT ON public.booking_slots TO authenticated;

-- This is the only student path that changes booking records. It locks both
-- the journey and the slot, so two concurrent requests cannot claim one slot.
CREATE OR REPLACE FUNCTION public.book_interview_slot(
  p_journey_id uuid,
  p_slot_id uuid
)
RETURNS TABLE (
  interview_id uuid,
  scheduled_start timestamptz,
  scheduled_end timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_student_id uuid;
  v_badge_status text;
  v_eligibility_status text;
  v_attempt_number integer;
  v_slot interview_slots%ROWTYPE;
  v_interview_id uuid := extensions.uuid_generate_v4();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to reserve an interview slot.' USING ERRCODE = '28000';
  END IF;

  SELECT journey.student_id, journey.badge_status, journey.eligibility_status, journey.current_attempt_number
  INTO v_student_id, v_badge_status, v_eligibility_status, v_attempt_number
  FROM public.student_badge_journeys AS journey
  JOIN public.students AS student ON student.id = journey.student_id
  JOIN public.users AS profile ON profile.id = student.user_id
  WHERE journey.id = p_journey_id
    AND profile.auth_user_id = auth.uid()
  FOR UPDATE OF journey;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Badge journey was not found for the signed-in student.' USING ERRCODE = 'P0001';
  END IF;

  IF v_eligibility_status <> 'ELIGIBLE' OR v_badge_status = 'AWARDED' THEN
    RAISE EXCEPTION 'This badge journey is not eligible for interview booking.' USING ERRCODE = 'P0001';
  END IF;

  IF v_attempt_number >= 3 THEN
    RAISE EXCEPTION 'All interview attempts for this badge journey have been used.' USING ERRCODE = 'P0001';
  END IF;

  SELECT *
  INTO v_slot
  FROM public.interview_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected interview slot no longer exists.' USING ERRCODE = 'P0001';
  END IF;

  IF v_slot.status <> 'AVAILABLE' THEN
    RAISE EXCEPTION 'This slot has just been reserved. Please select another time.' USING ERRCODE = 'P0001';
  END IF;

  IF v_slot.start_at <= NOW() THEN
    RAISE EXCEPTION 'Past interview slots cannot be reserved.' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.interviews AS existing
    WHERE existing.student_badge_journey_id = p_journey_id
      AND existing.booking_status = 'BOOKED'
      AND existing.interview_status IN ('SCHEDULED', 'STUDENT_CHECKED_IN', 'IN_PROGRESS')
  ) THEN
    RAISE EXCEPTION 'You already have an active interview booked for this badge.' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.interviews AS existing
    JOIN public.student_badge_journeys AS existing_journey
      ON existing_journey.id = existing.student_badge_journey_id
    WHERE existing_journey.student_id = v_student_id
      AND existing.booking_status = 'BOOKED'
      AND existing.interview_status IN ('SCHEDULED', 'STUDENT_CHECKED_IN', 'IN_PROGRESS')
      AND v_slot.start_at < existing.scheduled_end
      AND v_slot.end_at > existing.scheduled_start
  ) THEN
    RAISE EXCEPTION 'This time overlaps another active interview booking.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.interview_slots
  SET status = 'BOOKED'
  WHERE id = v_slot.id;

  INSERT INTO public.interviews (
    id,
    student_badge_journey_id,
    interviewer_id,
    slot_id,
    attempt_number,
    booking_status,
    interview_status,
    scheduled_start,
    scheduled_end
  ) VALUES (
    v_interview_id,
    p_journey_id,
    v_slot.interviewer_id,
    v_slot.id,
    v_attempt_number + 1,
    'BOOKED',
    'SCHEDULED',
    v_slot.start_at,
    v_slot.end_at
  );

  UPDATE public.student_badge_journeys
  SET current_attempt_number = current_attempt_number + 1,
      updated_at = NOW()
  WHERE id = p_journey_id;

  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  SELECT
    student.user_id,
    'INTERVIEW_BOOKED',
    'Your interview is confirmed!',
    format('Your interview is scheduled for %s.', to_char(v_slot.start_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY HH12:MI AM')),
    'INTERVIEW',
    v_interview_id
  FROM public.students AS student
  WHERE student.id = v_student_id;

  INSERT INTO public.audit_logs (actor_id, actor_name, actor_role, action, entity_type, entity_id, previous_value, new_value, reason)
  SELECT
    profile.id,
    profile.full_name,
    profile.role,
    'INTERVIEW_BOOKED',
    'INTERVIEW',
    v_interview_id,
    to_jsonb('AVAILABLE'::text),
    to_jsonb('BOOKED'::text),
    'Student reserved an available interview slot.'
  FROM public.users AS profile
  WHERE profile.auth_user_id = auth.uid();

  RETURN QUERY SELECT v_interview_id, v_slot.start_at, v_slot.end_at;
END;
$$;

REVOKE ALL ON FUNCTION public.book_interview_slot(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_interview_slot(uuid, uuid) TO authenticated;

-- The app receives slot, interview, and notification changes without polling.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'interview_slots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_slots;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'interviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.interviews;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;
