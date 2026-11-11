# Database Architecture & Data Model Specification
**Platform:** GRIT Interview Hub  
**Database Engine:** PostgreSQL 15 / Supabase  
**Schema File:** `supabase/migrations/20261111_grit_interview_hub.sql`

---

## 1. Relational Schema Overview

The database is designed with normalized tables, foreign keys, index optimization, and database-side integrity constraints.

```
users (1) ──── (1) students (1) ──── (*) student_badge_journeys
  │                                           │ (1)
  │ (1)                                       ▼
  └─────── (1) interviewers (1) ──────── (*) interviews (*) ──── (1) interview_slots
                                              │ (1)
                                              ▼
                                       interview_evaluations
```

---

## 2. Table Definitions & Entity Relationships

### 2.1 `users`
Core user identity for students, evaluators, and system coordinators.
- `id` (UUID, Primary Key): Unique account identifier.
- `full_name` (TEXT, NOT NULL): Candidate or staff member name.
- `email` (TEXT, UNIQUE, NOT NULL): Official email.
- `role` (TEXT, NOT NULL): `'STUDENT' | 'INTERVIEWER' | 'ADMIN'`.
- `avatar_url` (TEXT): Profile photo link.
- `is_active` (BOOLEAN, DEFAULT TRUE): Account status.
- `created_at`, `updated_at` (TIMESTAMPTZ).

### 2.2 `students`
GRIT candidate demographic and Qualiflyer leaderboard profile.
- `id` (UUID, Primary Key).
- `user_id` (UUID, UNIQUE, FK &rarr; `users.id` ON DELETE CASCADE).
- `student_code` (TEXT, UNIQUE, NOT NULL): Format `NIAT-YYYY-XXXX`.
- `batch` (TEXT, NOT NULL): e.g., `2023-2027`.
- `academic_year` (TEXT, NOT NULL): e.g., `3rd Year`.
- `college` (TEXT, NOT NULL): Campus name (e.g., `NIAT Hyderabad Main Campus`).
- `miles_earned` (INTEGER, DEFAULT 0): Total GRIT Miles scored in contests.
- `qualiflyer_rank` (INTEGER, DEFAULT 0): Dynamic leaderboard ranking.

### 2.3 `interviewers`
Evaluator profile, specializations, and daily bandwidth.
- `id` (UUID, Primary Key).
- `user_id` (UUID, UNIQUE, FK &rarr; `users.id` ON DELETE CASCADE).
- `active` (BOOLEAN, DEFAULT TRUE): Active evaluator flag.
- `timezone` (TEXT, DEFAULT `'Asia/Kolkata'`).
- `title` (TEXT, NOT NULL): Job title (e.g., `Principal AI Scientist & Senior Evaluator`).
- `bio` (TEXT): Evaluator background.
- `specialization` (TEXT[], DEFAULT `'{}'`): Array of track names.
- `max_interviews_per_day` (INTEGER, DEFAULT 6): Hard limit on daily bookings.

### 2.4 `tracks`
Technology tracks for NIAT engineering students.
- `id` (UUID, Primary Key).
- `name` (TEXT, NOT NULL): e.g., `AI Models Mastery`.
- `code` (TEXT, UNIQUE, NOT NULL): e.g., `AI_MODELS`.
- `description` (TEXT).
- `icon_name` (TEXT).
- `color` (TEXT).
- `is_active` (BOOLEAN, DEFAULT TRUE).

### 2.5 `badges`
Milestone credential tiers within each track.
- `id` (UUID, Primary Key).
- `track_id` (UUID, FK &rarr; `tracks.id` ON DELETE CASCADE).
- `name` (TEXT, NOT NULL): e.g., `AI Foundations & Prompting`.
- `level` (TEXT, NOT NULL): `'Novice' | 'Intermediate' | 'Practitioner' | 'Specialist' | 'Mastery'`.
- `display_order` (INTEGER, NOT NULL).
- `description` (TEXT).
- `criteria_summary` (TEXT).
- `is_active` (BOOLEAN, DEFAULT TRUE).

### 2.6 `badge_requirements`
Contest and skill prerequisites mandatory for unlocking an interview.
- `id` (UUID, Primary Key).
- `badge_id` (UUID, FK &rarr; `badges.id` ON DELETE CASCADE).
- `skill_id` (TEXT, NOT NULL): Unique skill identifier.
- `skill_name` (TEXT, NOT NULL): Display name.
- `description` (TEXT).
- `is_mandatory` (BOOLEAN, DEFAULT TRUE): Must be complete to trigger eligibility.
- `minimum_score` (NUMERIC(5,2)): Minimum score (e.g. 80.00).
- `UNIQUE(badge_id, skill_id)`: Prevents duplicate requirements.

### 2.7 `student_skill_progress`
Verified contest milestone achievements.
- `id` (UUID, Primary Key).
- `student_id` (UUID, FK &rarr; `students.id` ON DELETE CASCADE).
- `skill_id` (TEXT, NOT NULL).
- `skill_name` (TEXT, NOT NULL).
- `completion_status` (TEXT): `'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'`.
- `score` (NUMERIC(5,2)).
- `verified_at` (TIMESTAMPTZ).
- `UNIQUE(student_id, skill_id)`.

### 2.8 `student_badge_journeys`
Lifecycle record binding each student to each badge credential.
- `id` (UUID, Primary Key).
- `student_id` (UUID, FK &rarr; `students.id` ON DELETE CASCADE).
- `badge_id` (UUID, FK &rarr; `badges.id` ON DELETE RESTRICT).
- `eligibility_status` (TEXT, NOT NULL): `'NOT_ELIGIBLE' | 'ELIGIBLE' | 'ELIGIBILITY_REVOKED' | 'REQUIRES_ADMIN_REVIEW'`.
- `badge_status` (TEXT, NOT NULL): `'NOT_EARNED' | 'PENDING_AWARD' | 'AWARDED' | 'UNDER_REVIEW' | 'NULLIFIED' | 'REINSTATED'`.
- `eligible_at`, `awarded_at`, `nullified_at` (TIMESTAMPTZ).
- `current_attempt_number` (INTEGER, DEFAULT 0).
- `ineligibility_reason` (TEXT).
- `UNIQUE(student_id, badge_id)`: Ensures 1 journey per student per badge tier.

### 2.9 `interviewer_availability`
Weekly recurring schedule rules.
- `id` (UUID, Primary Key).
- `interviewer_id` (UUID, FK &rarr; `interviewers.id` ON DELETE CASCADE).
- `day_of_week` (INTEGER, 0–6).
- `start_time`, `end_time` (TIME, `end_time > start_time`).
- `slot_duration_minutes` (INTEGER, DEFAULT 45).
- `buffer_minutes` (INTEGER, DEFAULT 15).
- `is_active` (BOOLEAN, DEFAULT TRUE).

### 2.10 `interview_slots`
Generated bookable intervals.
- `id` (UUID, Primary Key).
- `interviewer_id` (UUID, FK &rarr; `interviewers.id`).
- `start_at`, `end_at` (TIMESTAMPTZ).
- `status` (TEXT): `'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED'`.
- `UNIQUE(interviewer_id, start_at)`: Protects interviewer from duplicate slot creation.

### 2.11 `interviews`
Historical and active interview bookings.
- `id` (UUID, Primary Key).
- `student_badge_journey_id` (UUID, FK &rarr; `student_badge_journeys.id`).
- `interviewer_id` (UUID, FK &rarr; `interviewers.id`).
- `slot_id` (UUID, FK &rarr; `interview_slots.id`).
- `attempt_number` (INTEGER, DEFAULT 1).
- `booking_status` (TEXT): `'AVAILABLE' | 'BOOKED' | 'CANCELLATION_REQUESTED' | 'RESCHEDULE_REQUESTED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED'`.
- `interview_status` (TEXT): `'SCHEDULED' | 'STUDENT_CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'RESCHEDULED'`.
- `scheduled_start`, `scheduled_end` (TIMESTAMPTZ).
- `meeting_link` (TEXT).
- `cancelled_at`, `cancellation_reason`, `completed_at` (TIMESTAMPTZ).

### 2.12 `interview_evaluations`
Official evaluator rubric outcomes.
- `id` (UUID, Primary Key).
- `interview_id` (UUID, UNIQUE, FK &rarr; `interviews.id`).
- `interviewer_id` (UUID, FK &rarr; `interviewers.id`).
- `outcome` (TEXT): `'PASS' | 'FAIL' | 'RETAKE_LATER'`.
- `score_data` (JSONB): Structured rubric scores.
- `technical_assessment` (TEXT).
- `communication_assessment` (TEXT).
- `overall_comments` (TEXT).
- `student_feedback` (TEXT): Candidate-visible constructive feedback.
- `private_notes` (TEXT): Reviewer-only confidential notes.
- `submitted_at` (TIMESTAMPTZ).

### 2.13 `malpractice_cases`
Academic integrity inquiry dossiers.
- `id` (UUID, Primary Key).
- `student_badge_journey_id` (UUID, FK &rarr; `student_badge_journeys.id`).
- `reported_by` (UUID, FK &rarr; `users.id`).
- `reason` (TEXT).
- `evidence_reference` (TEXT).
- `status` (TEXT): `'REPORTED' | 'UNDER_INVESTIGATION' | 'CONFIRMED' | 'REJECTED'`.
- `reviewer_id` (UUID, FK &rarr; `users.id`).
- `decision` (TEXT): `'CONFIRMED' | 'REJECTED'`.
- `decision_justification` (TEXT).
- `reviewed_at` (TIMESTAMPTZ).

### 2.14 `badge_events`
Audit trail of badge state transitions.
- `id` (UUID, Primary Key).
- `student_badge_journey_id` (UUID, FK &rarr; `student_badge_journeys.id`).
- `previous_status`, `new_status` (TEXT).
- `reason` (TEXT).
- `actor_id` (UUID, FK &rarr; `users.id`).
- `created_at` (TIMESTAMPTZ).

### 2.15 `audit_logs`
System-wide append-only compliance ledger.
- `id` (UUID, Primary Key).
- `actor_id` (UUID).
- `actor_name` (TEXT).
- `actor_role` (TEXT).
- `action` (TEXT).
- `entity_type` (TEXT).
- `entity_id` (UUID).
- `previous_value`, `new_value` (JSONB).
- `reason` (TEXT).
- `created_at` (TIMESTAMPTZ).

---

## 3. Database Safety & Concurrency Protection

### 3.1 Prevention of Double Booking on the Same Slot
```sql
CREATE UNIQUE INDEX idx_interviews_unique_active_slot 
ON interviews(slot_id) 
WHERE (booking_status = 'BOOKED' AND interview_status NOT IN ('CANCELLED', 'RESCHEDULED'));
```

### 3.2 Prevention of Duplicate Active Bookings for Same Student
```sql
CREATE UNIQUE INDEX idx_interviews_unique_active_journey 
ON interviews(student_badge_journey_id) 
WHERE (booking_status = 'BOOKED' AND interview_status IN ('SCHEDULED', 'STUDENT_CHECKED_IN', 'IN_PROGRESS'));
```

---

## 4. Row Level Security (RLS) Policies
- **Students:** Can only read their own journeys, bookings, and public feedback; blocked from seeing other students and private evaluator notes.
- **Interviewers:** Can only access candidate records and submit evaluations for interviews assigned to them. Cannot modify peer availability or award badges directly.
- **Admins:** Full read/write operational access across all tables.
