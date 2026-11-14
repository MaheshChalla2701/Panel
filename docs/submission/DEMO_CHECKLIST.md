# Evaluator Demo Guide & Verification Checklist
**Platform:** Panel Interview Hub  
**Target Audience:** Round 1 Assignment Evaluator & NIAT Product Leadership

This document provides a recommended, sequential walkthrough to verify all 19 screens, 5 state lifecycles, and edge cases implemented in the application.

---

## 🚀 Getting Started

1. Start the application locally:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.
3. Verify the top banner displays: **"Simulated Prototype Environment"** with quick role switchers and the **"Before/After Scenarios"** menu.
4. If you have made prior edits, click **"Reset Demo"** on the top right to ensure pristine seed data.

---

## 📋 Recommended Evaluation Walkthrough

### Part 1: Student Experience (Screens 1 to 8)
- [ ] **Step 1: Student Home (`/`)**
  - Verify candidate name: **Aarav Sharma** (`NIAT-2026-0101`).
  - Verify Track: **AI Models Mastery** &bull; Badge: **AI Foundations & Prompting**.
  - Notice the green notification banner displaying **Exact Message 1**: *"You're eligible for your interview!"*.
  - Notice dynamic CTA button: *"Book Interview Now"*.

- [ ] **Step 2: Badge Eligibility Breakdown (`/badge-eligibility`)**
  - Inspect the 4 mandatory skill contests: Prompt Engineering (92%), LLM Architecture (88%), Model Evaluation (85%), Tokenization (90%).
  - Notice the eligibility determination box: *"All 4 mandatory skills verified (100%)"*.
  - Switch tabs to another badge (e.g., *Modern Design Systems*) to see how requirements dynamically adapt.

- [ ] **Step 3: Book an Interview Slot (`/book-interview`)**
  - Verify filters: Date buttons (11 Nov, 12 Nov, 13 Nov), Evaluator dropdown.
  - Select tomorrow's date (**12 Nov 2026**).
  - Click an **Available** slot (e.g. 10:00 AM or 14:00 PM with Dr. Priya Ramanathan).
  - Click **"Confirm & Reserve Slot"**.

- [ ] **Step 4: Booking Confirmation Screen (`Screen 4`)**
  - Verify **Exact Message 2**: *"Your interview is confirmed!"*.
  - Verify session details: Date, Time (IST), Assigned Evaluator, Meeting link, Passcode (`Panel2026`).
  - Click **"View Interview Details"** to transition to My Interviews.

- [ ] **Step 5: My Interviews & Rescheduling (`/my-interviews`)**
  - Verify the booked interview appears under Upcoming.
  - Click **"View Details"** to open the session inspection modal.
  - Click **"Reschedule"**: select an alternate slot and click **"Confirm Reschedule"**. Notice the atomic swap.

- [ ] **Step 6: Badge Status & Historical Attempts (`/badge-status`)**
  - Inspect candidate credential status.
  - Review historical interview attempt records.
  - Verify that private evaluator notes are strictly hidden from the candidate view.

---

### Part 2: Interactive Before/After Scenarios (Part 6 Requirement)
Use the **"Before/After Scenarios"** bar at the very top of the screen to quickly test how the student dashboard dynamically transforms:
- [ ] **Scenario A (Incomplete):** Click button **"A: Incomplete"**. Return to Student Home. Notice booking locks and CTA changes to *"Complete your remaining skills"*.
- [ ] **Scenario B (Eligible):** Click **"B: Eligible"**. Notice eligibility achieved and CTA changes to *"Book your interview"*.
- [ ] **Scenario C (Booked):** Click **"C: Booked"**. Dashboard displays upcoming interview card with video room link.
- [ ] **Scenario D (In Review):** Click **"D: In Review"**. Shows interview completed, evaluation pending.
- [ ] **Scenario E (Passed):** Click **"E: Passed"**. Displays **Exact Message 3** banner, awarded badge tier, and 4.8/5.0 score breakdown.
- [ ] **Scenario F (Retake):** Click **"F: Retake"**. Shows 7-day preparation cooldown active and attempt 1 of 3 recorded.
- [ ] **Scenario G (Under Review):** Click **"G: Under Review"**. Shows neutral, respectful administrative review notice.
- [ ] **Scenario H (Nullified):** Click **"H: Nullified"**. Shows academic integrity revocation notice while preserving past attempt history.

---

### Part 3: Interviewer Experience (Screens 9 to 13)
- [ ] **Step 7: Switch to Interviewer Portal**
  - Click **"Interviewer (Dr. Priya)"** on the top role switcher.
  - Navigate to `/interviewer`.
  - Notice top KPIs: Today's Interviews, Upcoming Bookings, Pending Evaluations.
  - Notice the amber alert banner: *"Action Required: Pending Candidate Evaluations (Sneha Kulkarni)"*.

- [ ] **Step 8: Manage Availability (`/interviewer/availability`)**
  - Toggle working days (e.g., Monday through Friday).
  - Adjust slot duration (45 mins) and buffer time (15 mins).
  - Observe the live **Slot Generation Preview** panel.
  - Click **"Save Schedule Changes"** to commit to the repository.

- [ ] **Step 9: Daily & Weekly Schedule (`/interviewer/schedule`)**
  - Toggle between **List View**, **Day View**, and **Week View**.
  - Notice status badges: `SCHEDULED`, `COMPLETED`, `NO_SHOW`.

- [ ] **Step 10: Interview Workspace & Rubric Evaluation (`/interviewer/workspace/intv-2`)**
  - Click on candidate **Sneha Kulkarni** (intv-2).
  - Review candidate profile: Qualiflyer rank, Panel miles, verified skills.
  - Test attendance buttons: *Checked In*, *In Progress*, *Mark Completed*, *Mark No Show*.
  - In the evaluation form:
    - Select **Pass**.
    - Adjust rubric sliders: Problem Solving (5.0), Conceptual (4.5), Communication (5.0).
    - Fill Student-Facing Feedback: *"Excellent grasp of LLM attention and token costs."*
    - Fill Private Reviewer Notes: *"Top tier candidate, recommended for international qualifiers."*
    - Click **"Review & Submit Official Evaluation"**.
    - Confirm submission in the modal dialog.
  - Notice the badge changes to *"Evaluation Immutable & Saved"*.

---

### Part 4: Admin / Operations Team Experience (Screens 14 to 19)
- [ ] **Step 11: Operations Dashboard (`/admin`)**
  - Switch to **Admin / Team** on the top role switcher.
  - Verify metrics are mathematically computed: Total Eligible Students, Booked Students, Unbooked Students, Conversion %, Pass Rate.
  - Inspect visual charts: Track Progression Bar Chart and Outcome Distribution Pie Chart.

- [ ] **Step 12: Identify Unbooked Students (`/admin/eligible-students`)**
  - Click **"Eligible & Unbooked ⚡"** filter button.
  - Identify candidates who completed skills but haven't reserved slots (e.g., Tanvi Hegde, Devansh Gupta).
  - Click **"Nudge to Book"** on a student row &bull; Notice in-app reminder dispatched toast.
  - Click **"Export CSV Report"** to download the clean comma-separated audit file.

- [ ] **Step 13: Interview Operations & Reassignment (`/admin/interviews`)**
  - Filter by `UPCOMING`, `NO_SHOW`, `COMPLETED`.
  - On an upcoming session, click **"Reassign"**.
  - Select an alternate evaluator (e.g. Karan Verma), enter reason, and confirm.

- [ ] **Step 14: Evaluator Capacity Oversight (`/admin/interviewers`)**
  - Inspect evaluator utilization meters, active days, and completed interview throughput.

- [ ] **Step 15: Academic Integrity & Malpractice Board (`/admin/malpractice`)**
  - Review Case **#MAL-1** (Meera Nair) under investigation.
  - Click **"Adjudicate Case"**:
    - Choose **Confirm Malpractice** to nullify badge, OR
    - Choose **Dismiss (Unsubstantiated)** to reinstate badge.
    - Enter mandatory committee justification and commit decision.
  - Verify candidate badge journey updates immediately in accordance with the decision.

- [ ] **Step 16: Append-Only System Audit Log (`/admin/audit-logs`)**
  - Search by action (e.g. `INTERVIEW_BOOKED`, `EVALUATION_SUBMITTED`, `MALPRACTICE_CONFIRMED`).
  - Filter by entity type (`INTERVIEW`, `STUDENT_BADGE_JOURNEY`, `MALPRACTICE_CASE`).
  - Verify every single action taken during your walkthrough is chronologically recorded with actor name, timestamps, and state transitions.

---

### Part 5: Quality & Reliability Checklist
- [ ] Production build succeeds without errors (`npm run build`).
- [ ] All 14 unit and integration tests pass cleanly (`npm run test`).
- [ ] Responsive navigation works across desktop and mobile screen sizes.
- [ ] In-app notification centre reflects state updates with read/unread flags.
- [ ] Zero dead buttons, placeholder strings, or broken links across the entire app.

