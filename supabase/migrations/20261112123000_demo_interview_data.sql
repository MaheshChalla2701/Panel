-- Demo data for local/product walkthroughs. This is intentionally idempotent
-- so rerunning deployments does not duplicate people, journeys, or slots.

DO $$
DECLARE
  v_track_id uuid;
  v_badge_id uuid;
  v_priya_user_id uuid;
  v_priya_interviewer_id uuid;
  v_rahul_user_id uuid;
  v_rahul_interviewer_id uuid;
BEGIN
  INSERT INTO public.tracks (name, code, description, icon_name, color)
  VALUES (
    'AI Models Mastery',
    'AI-MODELS-MASTERY-DEMO',
    'Demo learning track for the Panel interview workflow.',
    'brain',
    '#4f46e5'
  )
  ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description
  RETURNING id INTO v_track_id;

  SELECT id INTO v_badge_id
  FROM public.badges
  WHERE track_id = v_track_id
    AND name = 'AI Foundations & Prompting'
  ORDER BY created_at
  LIMIT 1;

  IF v_badge_id IS NULL THEN
    INSERT INTO public.badges (track_id, name, level, display_order, description, criteria_summary)
    VALUES (
      v_track_id,
      'AI Foundations & Prompting',
      'Novice',
      1,
      'Demonstrates core AI model and prompting knowledge.',
      'Complete the track requirements and pass a live badge interview.'
    )
    RETURNING id INTO v_badge_id;
  END IF;

  INSERT INTO public.users (full_name, email, role)
  VALUES ('Dr. Priya Ramanathan', 'demo.priya.ramanathan@Panel.local', 'INTERVIEWER')
  ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = TRUE,
      updated_at = NOW()
  RETURNING id INTO v_priya_user_id;

  INSERT INTO public.interviewers (user_id, title, bio, specialization, max_interviews_per_day)
  SELECT
    v_priya_user_id,
    'Senior AI Evaluator',
    'Evaluates AI foundations, reasoning, and prompt design.',
    ARRAY['AI Foundations', 'Prompt Engineering'],
    6
  WHERE NOT EXISTS (
    SELECT 1 FROM public.interviewers WHERE user_id = v_priya_user_id
  );

  SELECT id INTO v_priya_interviewer_id
  FROM public.interviewers
  WHERE user_id = v_priya_user_id
  ORDER BY created_at
  LIMIT 1;

  INSERT INTO public.users (full_name, email, role)
  VALUES ('Rahul Menon', 'demo.rahul.menon@Panel.local', 'INTERVIEWER')
  ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = TRUE,
      updated_at = NOW()
  RETURNING id INTO v_rahul_user_id;

  INSERT INTO public.interviewers (user_id, title, bio, specialization, max_interviews_per_day)
  SELECT
    v_rahul_user_id,
    'Interview Evaluator',
    'Evaluates AI model literacy and practical applications.',
    ARRAY['AI Models', 'Responsible AI'],
    6
  WHERE NOT EXISTS (
    SELECT 1 FROM public.interviewers WHERE user_id = v_rahul_user_id
  );

  SELECT id INTO v_rahul_interviewer_id
  FROM public.interviewers
  WHERE user_id = v_rahul_user_id
  ORDER BY created_at
  LIMIT 1;

  INSERT INTO public.interview_slots (interviewer_id, start_at, end_at, status)
  VALUES
    (v_priya_interviewer_id, ((CURRENT_DATE + 7) + TIME '15:30') AT TIME ZONE 'Asia/Kolkata', ((CURRENT_DATE + 7) + TIME '16:15') AT TIME ZONE 'Asia/Kolkata', 'AVAILABLE'),
    (v_priya_interviewer_id, ((CURRENT_DATE + 7) + TIME '16:30') AT TIME ZONE 'Asia/Kolkata', ((CURRENT_DATE + 7) + TIME '17:15') AT TIME ZONE 'Asia/Kolkata', 'AVAILABLE'),
    (v_priya_interviewer_id, ((CURRENT_DATE + 8) + TIME '19:30') AT TIME ZONE 'Asia/Kolkata', ((CURRENT_DATE + 8) + TIME '20:15') AT TIME ZONE 'Asia/Kolkata', 'AVAILABLE'),
    (v_rahul_interviewer_id, ((CURRENT_DATE + 8) + TIME '20:30') AT TIME ZONE 'Asia/Kolkata', ((CURRENT_DATE + 8) + TIME '21:15') AT TIME ZONE 'Asia/Kolkata', 'AVAILABLE'),
    (v_rahul_interviewer_id, ((CURRENT_DATE + 9) + TIME '18:30') AT TIME ZONE 'Asia/Kolkata', ((CURRENT_DATE + 9) + TIME '19:15') AT TIME ZONE 'Asia/Kolkata', 'AVAILABLE')
  ON CONFLICT (interviewer_id, start_at) DO NOTHING;

  -- Every signed-in student receives a demo badge journey. This is suitable
  -- only for the requested demo environment; real eligibility remains an
  -- administrator-controlled academic decision.
  INSERT INTO public.student_badge_journeys (
    student_id,
    badge_id,
    eligibility_status,
    badge_status,
    eligible_at,
    current_attempt_number
  )
  SELECT
    student.id,
    v_badge_id,
    'ELIGIBLE',
    'NOT_EARNED',
    NOW(),
    0
  FROM public.students AS student
  JOIN public.users AS profile ON profile.id = student.user_id
  WHERE profile.auth_user_id IS NOT NULL
  ON CONFLICT (student_id, badge_id) DO NOTHING;

  INSERT INTO public.users (full_name, email, role)
  VALUES
    ('Aarav Sharma', 'demo.aarav.sharma@Panel.local', 'STUDENT'),
    ('Meera Iyer', 'demo.meera.iyer@Panel.local', 'STUDENT'),
    ('Dev Patel', 'demo.dev.patel@Panel.local', 'STUDENT')
  ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = TRUE,
      updated_at = NOW();

  INSERT INTO public.students (user_id, student_code, batch, academic_year, college)
  SELECT profile.id, profile_data.student_code, 'Cohort 2026', '2026-2027', 'NIAT Hyderabad'
  FROM (
    VALUES
      ('demo.aarav.sharma@Panel.local', 'DEMO-2026-001'),
      ('demo.meera.iyer@Panel.local', 'DEMO-2026-002'),
      ('demo.dev.patel@Panel.local', 'DEMO-2026-003')
  ) AS profile_data(email, student_code)
  JOIN public.users AS profile ON profile.email = profile_data.email
  WHERE NOT EXISTS (
    SELECT 1 FROM public.students AS student WHERE student.user_id = profile.id
  );

  INSERT INTO public.student_badge_journeys (
    student_id,
    badge_id,
    eligibility_status,
    badge_status,
    eligible_at,
    current_attempt_number
  )
  SELECT student.id, v_badge_id, 'ELIGIBLE', 'NOT_EARNED', NOW(), 0
  FROM public.students AS student
  JOIN public.users AS profile ON profile.id = student.user_id
  WHERE profile.email LIKE 'demo.%@Panel.local'
  ON CONFLICT (student_id, badge_id) DO NOTHING;
END;
$$;
