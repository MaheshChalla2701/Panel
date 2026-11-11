# GRIT Interview Hub — Product Design & Technical Approach
**Author:** Senior Product Engineering Team  
**Program:** NIAT GRIT (Global Readiness Immersion Trips)  
**Document Classification:** Product Architecture & Engineering Submission &bull; Round 1 Assignment

---

## PAGE 1

### 1. Problem Understanding & User Context
GRIT is a competitive year-long engineering upskilling ecosystem at NIAT. Students complete intensive skill contests and advance through structured track badge tiers (*AI Models Mastery, Applied GenAI Development, UI Engineering, Data Science & Machine Learning*). To earn a verified Track Badge—a prerequisite for Qualiflyer leaderboard rankings and fully funded international immersion trips—a candidate must clear a 45-minute live technical interview with an expert evaluator.

Prior to this system, interview scheduling suffered from fragmented coordination:
1. **Students** lacked clarity on whether skill contest completions translated to interview eligibility.
2. **Interviewers** faced manual scheduling conflicts, unbuffered sessions, and informal note-taking.
3. **Operations Admins** had no consolidated visibility into eligible candidates who failed to book slots, causing high drop-off before international selections.

**GRIT Interview Hub** addresses this challenge through three unified roles:
- **Student Portal:** Real-time contest audit, atomic slot reservation, cancellation/rescheduling within policy, structured feedback review, and badge credential tracking.
- **Interviewer Workspace:** Recurring availability configuration, buffered slot generation, isolated candidate dossiers, and structured rubric evaluations with strict separation between public student feedback and private reviewer notes.
- **Admin Command Center:** Real-time conversion analytics, unbooked student identification and automated nudges, evaluator workload balancing, auditable malpractice adjudication, and append-only event logging.

---

### 2. Multi-Dimensional State Machine Architecture
To prevent state pollution, candidate progression is decoupled across five distinct state dimensions rather than collapsed into a single status field:

```
[CONTEST PROGRESSION] 
       │ 
       ▼
ELIGIBILITY: NOT_ELIGIBLE ──(All mandatory skills verified)──► ELIGIBLE ──(Disputed)──► REQUIRES_ADMIN_REVIEW
                                                                   │
                                                            (Slot Reserved)
                                                                   ▼
BOOKING:                                                       AVAILABLE ──► BOOKED ──► COMPLETED / CANCELLED
                                                                               │
                                                                         (Meeting Time)
                                                                               ▼
INTERVIEW:                                                   SCHEDULED ──► IN_PROGRESS ──► COMPLETED / NO_SHOW
                                                                                                 │
                                                                                           (Rubric Eval)
                                                                                                 ▼
EVALUATION:                                                                        PASS / RETAKE_LATER / FAIL
                                                                                                 │
                                                                           ┌─────────────────────┴──────────────────┐
                                                                           ▼                                        ▼
BADGE VALIDITY:                                                (Pass) AWARDED                          (Retake) NOT_EARNED
                                                                           │                                 (7-Day Cooldown)
                                                                  (Inquiry Opened)                                  │
                                                                           ▼                                        ▼
                                                                     UNDER_REVIEW                              Re-booking
                                                                     ┌─────┴─────┐                             Unlocked
                                                       (Confirmed)  ▼           ▼  (Dismissed)
                                                                NULLIFIED   REINSTATED
```

#### Compact State Transition Matrix
| Entity Dimension | Initial State | Transition Event | Permitted Actors | Resulting State | Business Rules & Invariants |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Eligibility** | `NOT_ELIGIBLE` | Verify all mandatory skills | System / Admin | `ELIGIBLE` | Automated audit against badge rubric; min. 80% score required. |
| **Booking** | `AVAILABLE` | Candidate slot confirmation | Student / Admin | `BOOKED` | Atomic reservation. Target slot immediately blocked for all other users. |
| **Booking** | `BOOKED` | Cancellation requested | Student / Admin | `CANCELLED` | Permitted up to 2 hours before start. Slot released to pool. |
| **Interview** | `SCHEDULED` | Evaluator marks attendance | Interviewer / Admin | `IN_PROGRESS` | Evaluator accesses candidate dossier & live video room. |
| **Interview** | `IN_PROGRESS` | Session concludes | Interviewer / Admin | `COMPLETED` | Evaluator required to submit official evaluation form. |
| **Evaluation** | `COMPLETED` | Submit assessment | Assigned Evaluator | `PASS` / `RETAKE` / `FAIL` | Immutable after submission. Rubric scores (1-5) recorded. |
| **Badge** | `PENDING` | Passing interview | System / Admin | `AWARDED` | Candidate issued credential. Generates official success notice. |
| **Badge** | `AWARDED` | Integrity flag raised | Admin / Evaluator | `UNDER_REVIEW` | Candidate notified with neutral notice. Evidence dossier compiled. |
| **Badge** | `UNDER_REVIEW` | Plagiarism verified | Admin (Authorized) | `NULLIFIED` | Credential revoked. Historical interview records preserved. |

---

### 3. Critical Edge Cases & Policy Controls
1. **Simultaneous Booking Contention:** Two candidates attempt to reserve the same slot at the identical millisecond. *Resolution:* Database unique constraint `idx_interviews_unique_active_slot` ensures only the first transaction commits; the second candidate receives a graceful conflict toast prompting slot re-selection.
2. **Ineligibility After Booking:** If a student’s skill contest is flagged after booking, eligibility moves to `REQUIRES_ADMIN_REVIEW`. The interview is paused until admin clearance.
3. **Retake Cooldown Enforcement:** Candidates receiving `RETAKE_LATER` are barred from booking for 7 days to ensure adequate preparation. Max attempt ceiling is capped at 3 attempts per badge tier.
4. **Information Isolation:** Private reviewer notes and malpractice investigative reasoning are strictly hidden from student-facing API payloads via backend field filtering and Supabase Row Level Security.

---

## PAGE 2

### 4. Database Architecture & Entity Relationships
The normalized relational schema is built on PostgreSQL with strict referential integrity, unique constraints, and automated audit triggers:

```
┌──────────────┐         ┌──────────────┐         ┌────────────────────────┐
│    users     │1───────1│   students   │1───────*│ student_badge_journeys │
└──────────────┘         └──────────────┘         └────────────────────────┘
       │1                                                      │1
       │                                                       │
       │1                ┌──────────────┐                      │
       └────────1───────1│ interviewers │1                     │*
                         └──────────────┘                      │
                                │1                             ▼
                                │*                     ┌────────────────────────┐
                         ┌──────────────┐       ┌─────1│       interviews       │
                         │interview_slot│1──────┘      └────────────────────────┘
                         └──────────────┘                          │1
                                                                   │1
                                                       ┌────────────────────────┐
                                                       │  interview_evaluations │
                                                       └────────────────────────┘
```
- **Concurrency Guard:** `CREATE UNIQUE INDEX idx_interviews_unique_active_slot ON interviews(slot_id) WHERE (booking_status = 'BOOKED' AND interview_status NOT IN ('CANCELLED', 'RESCHEDULED'));`
- **Duplicate Journey Prevention:** `CREATE UNIQUE INDEX idx_interviews_unique_active_journey ON interviews(student_badge_journey_id) WHERE (booking_status = 'BOOKED' AND interview_status IN ('SCHEDULED', 'IN_PROGRESS'));`

---

### 5. Architectural & Product Design Decisions

#### Why Interview Outcomes and Badge Validity Are Decoupled
An interview evaluation is an immutable assessment of a candidate’s performance during a 45-minute technical conversation (`PASS`, `FAIL`, `RETAKE_LATER`). A badge award is a institutional credential with administrative lifecycle implications (`AWARDED`, `UNDER_REVIEW`, `NULLIFIED`, `REINSTATED`). Decoupling these states prevents retroactive falsification of interview history if malpractice is confirmed weeks after an interview took place.

#### Independent Attempt Logging (No Overwrites)
Every interview attempt generates a distinct `interviews` row with its own slot reference, evaluator ID, timestamps, and evaluation rubric. This historical record enables interviewers evaluating a retake candidate to inspect previous technical gaps without erasing the initial evaluation.

#### Prevention of Double Booking
Concurrency protection is enforced at both the client and database levels. The application repository performs atomic slot reservation; in Supabase PostgreSQL, transactional row locks (`SELECT FOR UPDATE`) and filtered unique indexes prevent overlapping bookings across candidate journeys and interviewer calendars.

#### Enforcement of Evaluator Scoping
Interviewers have zero access to modify peer availability windows, override permissions, or access candidate evaluations outside their assigned sessions. Evaluators cannot directly issue or nullify badges; they record evaluation scores, leaving institutional issuance to automated policy engines and authorized administrators.

#### Preservation of Malpractice Audits
When an integrity inquiry is initiated, the system does not delete the student’s journey or previous passing evaluation. Instead, a linked `malpractice_cases` record is created, and the badge moves to `UNDER_REVIEW`. If confirmed, the badge transitions to `NULLIFIED` with an immutable entry in `badge_events` and `audit_logs`, documenting the forensic evidence and the approving administrator’s justification.

#### Proactive Monitoring of Unbooked Candidates
To maximize interview completion velocity, the Admin Operations dashboard calculates the exact delta between `Total Eligible Students` and `Active Bookings`. Admins can filter the candidate pipeline by `Eligible & Unbooked` with a single click and trigger targeted in-app booking notifications.

---

### 6. Documented Assumptions

| Area | Confirmed GRIT Official Reference | Engineering Prototype Assumption |
| :--- | :--- | :--- |
| **Track Structure** | 4 primary tracks: AI Models, GenAI Development, UI Engineering, Data Science & ML. | Fictional 20-student cohort across 3 campuses (Hyderabad, Bangalore, Pune) for demonstration. |
| **Badge Criteria** | Mandatory completion of all required track skill contests before interview unlocks. | Minimum passing threshold set to 80% on skill contests; evaluated automatically via rubric. |
| **Interview Duration** | 45-minute live technical discussion with dedicated evaluator. | 15-minute inter-session buffer time configured by default in interviewer availability generator. |
| **Retake Policy** | Permitted outcomes include Pass, Fail, Retake Later. | 7-day preparation cooldown and 3-attempt ceiling configured as default prototype parameters. |
| **Malpractice Process** | Badges can be nullified later following verified malpractice investigation. | Neutral, non-accusatory notifications used during active reviews; formal justification required for nullification. |

---
*GRIT Interview Hub &bull; NIAT Engineering &bull; Production Prototype Documentation*

