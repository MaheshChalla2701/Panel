# Critical Product Edge Cases & Assumptions
**Platform:** GRIT Interview Hub  
**Document Classification:** Product Reliability & QA Specifications

---

## 1. Critical Product Edge Cases Analysis (Part 10)

| # | Edge Case Scenario | Expected Behavior | Validation & Guard | Resulting State & Audit | User-Facing Notification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Simultaneous Booking Contention:** Two candidates click confirm on the same slot at the identical millisecond. | First request reserves slot atomically. Second request is safely aborted without data corruption. | Database unique exclusion constraint `idx_interviews_unique_active_slot`. | 1st: `BOOKED`<br>2nd: Remains unbooked. | "This slot has just been reserved by another candidate. Please select another time." |
| **2** | **Slot Becomes Unavailable Between Selection & Confirmation:** Slot reserved by another student while candidate is on the page. | Re-validates slot availability at submission time before reserving. | `validateBookingRequest` checks `slot.status === 'AVAILABLE'`. | Aborted transaction. | Toast: "The selected slot is no longer available. Please select another slot." |
| **3** | **Student Attempts to Book Without Eligibility:** Ineligible candidate accesses booking URL directly. | Booking UI disables slot selection. Backend validation rejects request. | `journey.eligibilityStatus === 'ELIGIBLE'`. | Request rejected. | Banner: "Booking Currently Inaccessible: Incomplete mandatory skill contests." |
| **4** | **Candidate Becomes Ineligible After Booking:** Contest victory challenged prior to interview. | Eligibility moves to review. Active booking placed on administrative hold. | `canTransitionEligibility` & admin flag. | `REQUIRES_ADMIN_REVIEW` | "Your badge eligibility is under routine verification. Interview on hold." |
| **5** | **Evaluator Becomes Unavailable After Booking:** Evaluator emergency block. | Existing candidate bookings are protected and preserved. Admin notified to reassign. | Availability engine checks existing bookings before applying blocks. | Admin flagged for reassignment. | Candidate notified only after reassignment with new evaluator profile. |
| **6** | **Overlapping Availability Windows:** Evaluator creates overlapping working hours. | Form rejects overlapping ranges. | Validation: `s.startTime < s.endTime` and no window collisions. | Rejected on client & API. | "Overlapping availability windows detected. Adjust your start/end hours." |
| **7** | **Admin Assigns Evaluator Outside Availability:** Admin manually assigns evaluator to a conflicting timeslot. | System prompts warning; admin can force override with documented reason. | Logged with mandatory reason field. | Reassigned with audit event. | "Interviewer reassigned by admin. Reason: [Admin Reason]." |
| **8** | **Student Requests Reschedule:** Candidate needs a different time. | Transactional atomic swap: verify new slot &rarr; reserve new slot &rarr; release old slot. | Requires &gt; 2 hours notice without admin approval. | Old slot `AVAILABLE`<br>New slot `BOOKED`. | Exact Message: "Interview Rescheduled Successfully for [Date] at [Time]." |
| **9** | **Student Cancels Interview:** Candidate cancels booked slot. | Booking cancelled; slot freed into pool. Student can rebook when ready. | Requires cancellation reason. | Booking `CANCELLED`<br>Slot `AVAILABLE`. | "Your interview has been cancelled. You may book another slot when ready." |
| **10** | **Student Misses Interview (No-Show):** Candidate does not join within 15 minutes. | Evaluator marks `NO_SHOW`. Attempt counted; student must seek admin reschedule. | Evaluator attendance controls. | Interview `NO_SHOW` | "Interview marked as No-Show. Please contact administration to reschedule." |
| **11** | **Evaluator Delays Evaluation Submission:** Session concludes without evaluation. | Session flagged as `Pending Evaluation`. Surfaced on Evaluator Dashboard and Admin KPIs. | Highlighted in amber on dashboard with direct action button. | Interview `COMPLETED`<br>Outcome pending. | Periodic evaluator reminder generated. |
| **12** | **Interview Completed But Evaluation Pending:** Candidate checks result immediately after call. | Shows clean status: "Interview concluded. Evaluator is finalizing rubric scores." | Prevents showing blank or default scores. | Journey `PENDING_EVALUATION` | "Your interview concluded recently. The interviewer is finalizing your evaluation." |
| **13** | **Evaluator Attempts to Change Submitted Result:** Evaluator tries to edit scores after submission. | Evaluations are immutable once committed. Changes require formal admin correction workflow. | API rejects subsequent updates if evaluation exists. | Preserves original audit trail. | "Evaluation has already been submitted and is immutable." |
| **14** | **Candidate Receives Retake Later Decision:** Evaluator marks `RETAKE_LATER`. | Mandatory 7-day preparation cooldown enforced before re-booking unlocks. | `evaluateRetakeEligibility` calculates cooldown expiry. | Journey `NOT_EARNED`<br>Cooldown active. | "Your interview evaluation was marked Retake Later. Cooldown active until [Date]." |
| **15** | **Student Reaches Maximum Attempts:** Candidate fails 3rd attempt. | Re-booking permanently locked for this badge tier. | `attemptCount >= maxAttempts` (3). | Journey `NOT_ELIGIBLE` | "Maximum attempts limit (3) reached. Contact program administrators." |
| **16** | **Awarded Badge Reported for Malpractice:** Integrity flag raised on contest submission. | Badge moves to `UNDER_REVIEW`. Candidate notified with neutral, non-accusatory language. | Case created in `malpractice_cases`. | Badge `UNDER_REVIEW` | "Your badge is currently under routine administrative verification." |
| **17** | **Malpractice Case Rejected / Dismissed:** Investigation finds no wrongdoing (e.g. router glitch). | Badge restored to `REINSTATED` or `AWARDED`. Full exoneration documented. | Admin authorized decision. | Badge `REINSTATED` | "The review for your badge has concluded. Your badge is fully reinstated." |
| **18** | **Malpractice Case Confirmed:** Disciplinary board confirms code plagiarism. | Badge transitions to `NULLIFIED`. Historical interview attempts remain preserved! | Admin authorized decision with evidence link. | Badge `NULLIFIED`<br>Eligibility `REVOKED`. | "Official Notice: Following formal verification, your badge has been nullified." |
| **19** | **Unauthorized Privilege Escalation:** Student attempts to call admin endpoints or inspect private notes. | Supabase RLS and API middleware block access; attempts logged to security audit. | Role permission checks. | Access Denied (HTTP 403) | Security warning toast. |
| **20** | **Duplicate Notification Suppression:** Rapid state events triggered. | Notification engine deduplicates based on entity ID and event hash. | Deduplication logic. | Clean notification feed. | Single clean notification delivered. |
| **21** | **Database Failure Mid-Transaction:** Network drop during booking commit. | PostgreSQL transaction rollback ensures all-or-nothing atomicity. | SQL `BEGIN...COMMIT` block. | Clean rollback. | "Booking could not be finalized. Please retry." |

---

## 2. Confirmed GRIT Rules vs. Documented Engineering Assumptions

| Dimension | Confirmed GRIT Official Specification | Engineering Prototype Assumption & Trade-Off |
| :--- | :--- | :--- |
| **Tracks** | 4 primary tracks: AI Models Mastery, Applied GenAI Development, UI Engineering, Data Science & Machine Learning. | Implemented as 4 fully configured tracks with custom icons, colors, and descriptions. |
| **Contest Milestones** | Students must earn at least one Track Badge to qualify for international immersion trips. | Designed 7 specific badge tiers across the 4 tracks, with 10 exact skill rubrics. |
| **Eligibility Bar** | An interview becomes available only after completing all mandatory track skill requirements. | Minimum passing threshold set to 80% on skill contests; evaluated automatically via rubric. |
| **Interview Duration** | 45-minute live technical conversation with dedicated evaluator. | 15-minute inter-session buffer time configured by default in interviewer availability generator. |
| **Evaluator Outcomes** | Permitted outcomes are Pass, Fail, Retake Later. | Passing triggers automated badge award issuance; Retake triggers 7-day cooldown. |
| **Attempt Limits** | Cooldown and maximum attempts not quantitatively specified in official guidelines. | Configured 7-day cooldown and 3-attempt ceiling as realistic educational defaults. |
| **Malpractice Policy** | A badge already earned can be nullified later if malpractice is reported and confirmed. | Neutral, non-accusatory notifications used during active reviews; formal justification required for nullification. |
