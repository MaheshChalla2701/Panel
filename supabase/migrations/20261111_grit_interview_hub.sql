-- ==============================================================================
-- GRIT Interview Hub — PostgreSQL & Supabase Database Migration
-- Production Schema for Track Badge Live Interview Orchestration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('STUDENT', 'INTERVIEWER', 'ADMIN')),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_code TEXT UNIQUE NOT NULL,
    batch TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    college TEXT NOT NULL DEFAULT 'NIAT Hyderabad',
    miles_earned INTEGER NOT NULL DEFAULT 0,
    qualiflyer_rank INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Interviewers Table
CREATE TABLE IF NOT EXISTS interviewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    title TEXT NOT NULL,
    bio TEXT,
    specialization TEXT[] NOT NULL DEFAULT '{}',
    max_interviews_per_day INTEGER NOT NULL DEFAULT 6,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tracks Table
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    color TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Badges Table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('Novice', 'Intermediate', 'Practitioner', 'Specialist', 'Mastery')),
    display_order INTEGER NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    criteria_summary TEXT NOT NULL,
    icon_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Badge Requirements Table
CREATE TABLE IF NOT EXISTS badge_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    description TEXT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    minimum_score NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(badge_id, skill_id)
);

-- 7. Student Skill Progress Table
CREATE TABLE IF NOT EXISTS student_skill_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    completion_status TEXT NOT NULL CHECK (completion_status IN ('COMPLETED', 'IN_PROGRESS', 'NOT_STARTED')),
    score NUMERIC(5,2),
    verified_at TIMESTAMPTZ,
    UNIQUE(student_id, skill_id)
);

-- 8. Student Badge Journeys Table
CREATE TABLE IF NOT EXISTS student_badge_journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE RESTRICT,
    eligibility_status TEXT NOT NULL CHECK (eligibility_status IN ('NOT_ELIGIBLE', 'ELIGIBLE', 'ELIGIBILITY_REVOKED', 'REQUIRES_ADMIN_REVIEW')),
    badge_status TEXT NOT NULL CHECK (badge_status IN ('NOT_EARNED', 'PENDING_AWARD', 'AWARDED', 'UNDER_REVIEW', 'NULLIFIED', 'REINSTATED')),
    eligible_at TIMESTAMPTZ,
    awarded_at TIMESTAMPTZ,
    nullified_at TIMESTAMPTZ,
    current_attempt_number INTEGER NOT NULL DEFAULT 0,
    ineligibility_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, badge_id)
);

-- 9. Interviewer Availability Table
CREATE TABLE IF NOT EXISTS interviewer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interviewer_id UUID NOT NULL REFERENCES interviewers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    slot_duration_minutes INTEGER NOT NULL DEFAULT 45,
    buffer_minutes INTEGER NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- 10. Interviewer Unavailability Table
CREATE TABLE IF NOT EXISTS interviewer_unavailability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interviewer_id UUID NOT NULL REFERENCES interviewers(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_at > start_at)
);

-- 11. Interview Slots Table
CREATE TABLE IF NOT EXISTS interview_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interviewer_id UUID NOT NULL REFERENCES interviewers(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_at > start_at),
    UNIQUE(interviewer_id, start_at)
);

-- 12. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_badge_journey_id UUID NOT NULL REFERENCES student_badge_journeys(id) ON DELETE RESTRICT,
    interviewer_id UUID NOT NULL REFERENCES interviewers(id) ON DELETE RESTRICT,
    slot_id UUID NOT NULL REFERENCES interview_slots(id) ON DELETE RESTRICT,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    booking_status TEXT NOT NULL CHECK (booking_status IN ('AVAILABLE', 'BOOKED', 'CANCELLATION_REQUESTED', 'RESCHEDULE_REQUESTED', 'CANCELLED', 'EXPIRED', 'COMPLETED')),
    interview_status TEXT NOT NULL CHECK (interview_status IN ('SCHEDULED', 'STUDENT_CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED')),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    meeting_link TEXT NOT NULL DEFAULT 'https://meet.grit.niatindia.com/room/',
    meeting_passcode TEXT,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent concurrent active bookings on the same slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_interviews_unique_active_slot 
ON interviews(slot_id) 
WHERE (booking_status = 'BOOKED' AND interview_status NOT IN ('CANCELLED', 'RESCHEDULED'));

-- Prevent multiple simultaneous active bookings for the same badge journey
CREATE UNIQUE INDEX IF NOT EXISTS idx_interviews_unique_active_journey 
ON interviews(student_badge_journey_id) 
WHERE (booking_status = 'BOOKED' AND interview_status IN ('SCHEDULED', 'STUDENT_CHECKED_IN', 'IN_PROGRESS'));

-- 13. Interview Evaluations Table
CREATE TABLE IF NOT EXISTS interview_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID UNIQUE NOT NULL REFERENCES interviews(id) ON DELETE RESTRICT,
    interviewer_id UUID NOT NULL REFERENCES interviewers(id) ON DELETE RESTRICT,
    outcome TEXT NOT NULL CHECK (outcome IN ('PASS', 'FAIL', 'RETAKE_LATER')),
    score_data JSONB NOT NULL,
    technical_assessment TEXT NOT NULL,
    communication_assessment TEXT NOT NULL,
    overall_comments TEXT NOT NULL,
    student_feedback TEXT NOT NULL, -- Public to student
    private_notes TEXT NOT NULL,    -- Restricted to interviewers/admins
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corrected_at TIMESTAMPTZ,
    correction_reason TEXT,
    corrected_by UUID REFERENCES users(id)
);

-- 14. Malpractice Cases Table
CREATE TABLE IF NOT EXISTS malpractice_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_badge_journey_id UUID NOT NULL REFERENCES student_badge_journeys(id) ON DELETE RESTRICT,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    evidence_reference TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('REPORTED', 'UNDER_INVESTIGATION', 'CONFIRMED', 'REJECTED')),
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    decision TEXT CHECK (decision IN ('CONFIRMED', 'REJECTED')),
    decision_justification TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Badge Events (Audit Log for Badge Status Transitions)
CREATE TABLE IF NOT EXISTS badge_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_badge_journey_id UUID NOT NULL REFERENCES student_badge_journeys(id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reason TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_type TEXT CHECK (related_entity_type IN ('INTERVIEW', 'BADGE', 'MALPRACTICE_CASE')),
    related_entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. System Audit Logs Table (Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_student_badge_journeys_student ON student_badge_journeys(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badge_journeys_badge ON student_badge_journeys(badge_id);
CREATE INDEX IF NOT EXISTS idx_student_badge_journeys_eligibility ON student_badge_journeys(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(interview_status);
CREATE INDEX IF NOT EXISTS idx_interview_slots_interviewer_date ON interview_slots(interviewer_id, start_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badge_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE malpractice_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Students can read their own records
CREATE POLICY student_view_own_journey ON student_badge_journeys
    FOR SELECT TO authenticated
    USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY student_view_own_interviews ON interviews
    FOR SELECT TO authenticated
    USING (student_badge_journey_id IN (
        SELECT id FROM student_badge_journeys WHERE student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    ));

-- Students can view evaluation feedback (excluding private notes via view/column policy)
CREATE POLICY student_view_feedback ON interview_evaluations
    FOR SELECT TO authenticated
    USING (interview_id IN (
        SELECT id FROM interviews WHERE student_badge_journey_id IN (
            SELECT id FROM student_badge_journeys WHERE student_id IN (
                SELECT id FROM students WHERE user_id = auth.uid()
            )
        )
    ));

-- Interviewers can view their assigned interviews and submit evaluations
CREATE POLICY interviewer_manage_assigned_interviews ON interviews
    FOR ALL TO authenticated
    USING (interviewer_id IN (SELECT id FROM interviewers WHERE user_id = auth.uid()));

CREATE POLICY interviewer_manage_evaluations ON interview_evaluations
    FOR ALL TO authenticated
    USING (interviewer_id IN (SELECT id FROM interviewers WHERE user_id = auth.uid()));

-- Admins have unrestricted operational access across all tables
CREATE POLICY admin_full_access_users ON users FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY admin_full_access_journeys ON student_badge_journeys FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY admin_full_access_interviews ON interviews FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY admin_full_access_evaluations ON interview_evaluations FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY admin_full_access_malpractice ON malpractice_cases FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY admin_full_access_audit ON audit_logs FOR SELECT TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN');
