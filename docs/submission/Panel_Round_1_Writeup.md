# Panel Interview Hub - Round 1 Write-up

## 1. Student interview journey

| State | What the student sees | Trigger / next state |
|---|---|---|
| Not eligible | Missing skill checklist and locked booking | All mandatory skill levels are verified -> Eligible |
| Eligible, unbooked | “You’re eligible” banner and available slots | Student reserves an open slot -> Booked |
| Booked / scheduled | Interview date, evaluator and joining details | Student cancels/reschedules within policy, or interview begins |
| Interview completed | “Evaluation pending” status | Evaluator submits one official outcome |
| Pass | Badge awarded and student-facing feedback | Badge can later enter integrity review |
| Retake later | Feedback, cooldown date and next-attempt guidance | Cooldown ends -> eligible to rebook |
| Fail | Outcome and attempt history | Admin policy determines whether another attempt is allowed |
| Under review | Neutral integrity-review notice | Admin rejects case -> reinstated, or confirms -> nullified |
| Nullified | Official status and appeal/contact guidance | Admin may reinstate after a later review |

The design separates eligibility, booking, interview, evaluation and badge-validity state. This preserves interview history even if an earned badge is reviewed later.

## 2. Edge cases and assumptions

| Case | Handling |
|---|---|
| Two students choose the same slot | The booking transaction locks the slot; the first commit succeeds and the other student is prompted to choose again. |
| Student is no longer eligible after booking | Set the journey to `REQUIRES_ADMIN_REVIEW`; keep the history and pause operational action. |
| Evaluator becomes unavailable | Keep confirmed interviews, flag operations for reassignment, and notify the student only after a replacement is confirmed. |
| Retake later | Apply a 7-day preparation cooldown and limit the prototype to three attempts. |
| Late cancellation / reschedule | Student self-service closes two hours before the start; admin override requires an audit reason. |
| No-show or evaluation delayed | Preserve the attempt, show a pending state, and surface it to interviewer/admin queues. |
| Malpractice after award | Open an investigation without deleting the result; only an authorized admin can nullify or reinstate the badge. |
| Privacy | Students receive only student feedback. Private evaluator notes and investigation evidence are role-scoped. |

Assumptions: interviews are 45 minutes in IST with a 15-minute buffer; eligibility comes from verified skill-contest data; Pass, Fail and Retake Later are the evaluator outcomes; the exact cooldown and attempt limit are configurable institutional policies.

## 3. Data model

`users` maps Supabase Auth users to application roles. `students` and `interviewers` extend a user with role-specific fields. `tracks`, `badges`, `badge_requirements`, and `student_skill_progress` determine eligibility. `student_badge_journeys` stores the student-to-badge lifecycle and attempt count.

`interviewer_availability`, `interviewer_unavailability`, and `interview_slots` model supply. `interviews` is one immutable attempt per booking. `interview_evaluations` holds the official outcome, public feedback, private notes and rubric data. `malpractice_cases`, `badge_events`, `notifications`, and append-only `audit_logs` preserve the operational record.

Key safeguards: a unique active-booking index prevents two bookings for one slot; a unique active-journey index prevents a student booking overlapping active attempts; the booking RPC locks the journey and slot before creating an interview; row-level policies scope student, interviewer, and admin access.

## Prototype coverage

The Assignment Demo opens from the sign-in page and contains: student eligibility and booking, interviewer availability and daily schedule, outcome recording, student results, an admin eligible/booked/unbooked pipeline, booking reminders, and malpractice adjudication. The live Supabase student path uses real Auth, database slots, and atomic booking. Seeded demo records are included for walkthroughs.
