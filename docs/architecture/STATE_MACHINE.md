# State Machine & Business Logic Specification
**Platform:** GRIT Interview Hub  
**Engine File:** `src/domain/state-machines/transitions.ts`

---

## 1. Architectural Philosophy

Candidate progress through the GRIT Track Badge interview milestone is governed by **decoupled state machines** rather than a single monolithic status field. Collapsing eligibility, booking, attendance, evaluation outcomes, and institutional badge awards into one field causes severe state collisions (e.g., losing interview attempt history if a badge is later investigated for malpractice).

The system maintains 5 independent lifecycles:
1. **Eligibility Status**
2. **Booking Status**
3. **Interview Status**
4. **Evaluation Outcome**
5. **Badge Validity Status**
*(Plus the auxiliary Malpractice Investigation lifecycle).*

---

## 2. State Lifecycles & Transition Rules

### 2.1 Eligibility Lifecycle
Governs whether a candidate is authorized to view bookable slots and schedule an interview.

```
NOT_ELIGIBLE ──(All mandatory skills complete)──► ELIGIBLE
      ▲                                               │
      │                                       (Contest Disputed)
      │                                               ▼
      └─────────◄── REQUIRES_ADMIN_REVIEW ◄── ELIGIBILITY_REVOKED
```

- `NOT_ELIGIBLE`: Mandatory skill requirements incomplete or below score threshold.
- `ELIGIBLE`: All mandatory requirements verified against the rubric.
- `ELIGIBILITY_REVOKED`: A previously qualifying skill milestone was invalidated or challenged.
- `REQUIRES_ADMIN_REVIEW`: A booked candidate's eligibility became disputed; interview on administrative hold.

**Permitted Transitions:**
- `NOT_ELIGIBLE` &rarr; `ELIGIBLE` (Triggered automatically by contest verification)
- `ELIGIBLE` &rarr; `ELIGIBILITY_REVOKED` (Integrity flag or milestone revocation)
- `ELIGIBILITY_REVOKED` &rarr; `REQUIRES_ADMIN_REVIEW` (Admin investigation)
- `REQUIRES_ADMIN_REVIEW` &rarr; `ELIGIBLE` (Admin clears dispute)
- `REQUIRES_ADMIN_REVIEW` &rarr; `NOT_ELIGIBLE` (Dispute sustained)

---

### 2.2 Booking Lifecycle
Governs the reservation, locking, and release of interviewer time slots.

```
AVAILABLE ──► BOOKED ──┬──► CANCELLATION_REQUESTED ──► CANCELLED ──► AVAILABLE
                       │
                       └──► RESCHEDULE_REQUESTED ──► BOOKED (New Slot)
```

- `AVAILABLE`: Slot is open in interviewer availability window.
- `BOOKED`: Slot reserved by candidate; locked via database constraint.
- `CANCELLATION_REQUESTED`: Candidate initiated cancellation.
- `RESCHEDULE_REQUESTED`: Transactional swap in progress.
- `CANCELLED`: Released back into open pool.
- `EXPIRED`: Unbooked slot whose scheduled start time has passed.
- `COMPLETED`: Session concluded.

---

### 2.3 Interview Lifecycle
Governs day-of-event attendance and session completion.

```
SCHEDULED ──► STUDENT_CHECKED_IN ──► IN_PROGRESS ──► COMPLETED
      │                                                  │
      └──► NO_SHOW                                       ▼
                                                Evaluation Pending
```

- `SCHEDULED`: Confirmed booking; meeting link generated.
- `STUDENT_CHECKED_IN`: Candidate joined waiting room.
- `IN_PROGRESS`: Evaluator admitted candidate; video session active.
- `COMPLETED`: 45-minute discussion concluded.
- `NO_SHOW`: Candidate failed to attend within grace period (15 mins).
- `CANCELLED` / `RESCHEDULED`: Handled prior to session start.

---

### 2.4 Evaluation Outcomes
Official grading recorded by the evaluator.
- `PASS`: Candidate demonstrated conceptual and practical proficiency.
- `FAIL`: Candidate did not meet minimum benchmark; attempt recorded.
- `RETAKE_LATER`: Candidate has strong potential; 7-day preparation cooldown enforced before re-booking.

---

### 2.5 Badge Validity Lifecycle
Governs the institutional credential issued to the student.

```
NOT_EARNED ──(Passed Interview)──► PENDING_AWARD ──► AWARDED
                                                        │
                                               (Malpractice Inquiry)
                                                        ▼
                                                   UNDER_REVIEW
                                                   ┌────┴────┐
                                      (Confirmed) ▼         ▼ (Dismissed)
                                              NULLIFIED  REINSTATED
```

- `NOT_EARNED`: Default state before clearing interview.
- `PENDING_AWARD`: Passed interview; undergoing formal award batching.
- `AWARDED`: Official Track Badge verified and published to profile.
- `UNDER_REVIEW`: Routine administrative integrity inquiry active.
- `NULLIFIED`: Credential revoked following confirmed malpractice.
- `REINSTATED`: Exonerated after inquiry; credential restored.

---

## 3. State Transition Matrix & Permissions Table

| Entity | Current State | Target State | Actor: Student | Actor: Interviewer | Actor: Admin | Business Rule / Guard |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Eligibility** | `NOT_ELIGIBLE` | `ELIGIBLE` | ❌ | ❌ | ✅ (Or System) | Requires 100% mandatory skills complete. |
| **Eligibility** | `ELIGIBLE` | `ELIGIBILITY_REVOKED` | ❌ | ❌ | ✅ | Disciplinary or contest contestation. |
| **Booking** | `AVAILABLE` | `BOOKED` | ✅ | ❌ | ✅ | Atomic lock on slot; student must be ELIGIBLE. |
| **Booking** | `BOOKED` | `CANCELLED` | ✅ | ❌ | ✅ | Permitted &gt; 2 hrs before session start. |
| **Interview** | `SCHEDULED` | `IN_PROGRESS` | ❌ | ✅ | ✅ | Evaluator admitted candidate to room. |
| **Interview** | `IN_PROGRESS` | `COMPLETED` | ❌ | ✅ | ✅ | Session ended; unlocks evaluation form. |
| **Evaluation** | — | `PASS` / `RETAKE` / `FAIL` | ❌ | ✅ | ✅ | Immutable after submission. |
| **Badge** | `PENDING_AWARD` | `AWARDED` | ❌ | ❌ | ✅ (Or System) | Triggered by passing interview outcome. |
| **Badge** | `AWARDED` | `UNDER_REVIEW` | ❌ | ❌ | ✅ | Inquiry opened; candidate receives neutral notice. |
| **Badge** | `UNDER_REVIEW` | `NULLIFIED` | ❌ | ❌ | ✅ | Disciplinary committee confirmed violation. |
| **Badge** | `UNDER_REVIEW` | `REINSTATED` | ❌ | ❌ | ✅ | Inquiry dismissed; badge restored. |

---

## 4. Centralized Transition Engine Guard

All state transitions are validated by centralized pure functions in `src/domain/state-machines/transitions.ts`:
- `canTransitionEligibility(from, to, actorRole)`
- `canTransitionBooking(from, to, actorRole)`
- `canTransitionInterview(from, to, actorRole)`
- `canTransitionBadge(from, to, actorRole)`
- `canTransitionMalpractice(from, to, actorRole)`

Any attempt by a UI component or unauthorized user to bypass business logic is rejected with a descriptive error message and recorded in the append-only audit log.

