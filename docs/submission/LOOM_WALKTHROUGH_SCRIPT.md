# GRIT Interview Hub — Loom Video Walkthrough Script
**Target Duration:** 5–7 Minutes  
**Speaker:** Senior Product Engineer / Full-Stack Architect  
**Audience:** Assignment Evaluator & NIAT Product Engineering Leadership

---

## Screen-by-Screen Recording Checklist
Before hitting Record on Loom, verify:
- [ ] Application running on `http://localhost:5173`
- [ ] Top banner: "Simulated Prototype Environment" visible with quick role switcher
- [ ] Browser zoom set to 100%, fullscreen 1080p recording
- [ ] Reset Demo Data executed so initial seed cohort is fresh
- [ ] Three browser tabs or quick role switcher handy (Student: Aarav Sharma, Evaluator: Dr. Priya Ramanathan, Admin: Chief Coordinator Vikram Roy)

---

## Spoken Presentation Script

### [0:00 – 0:45] Introduction: Problem & Proposed Solution
**Visual:** Student Home (`/`) showing candidate Aarav Sharma. Highlight the tagline: *"Your next milestone starts with one conversation."*

> **"Hello everyone! My name is [Your Name], and I'm presenting the GRIT Interview Hub for the Round 1 AI Product Engineer assignment.**
>
> **At NIAT, GRIT is a year-long skilling competition where engineering students master futuristic tech tracks—like AI Models, GenAI, and UI Engineering. Earning a Track Badge is a hard prerequisite for Qualiflyer leaderboard rankings and fully funded international immersion trips.**
>
> **However, previously there was a broken handoff: students didn’t know when their contest wins made them eligible, evaluators struggled with fragmented schedules without buffer times, and program coordinators couldn't easily track qualified candidates who hadn't booked their interviews.**
>
> **We designed GRIT Interview Hub as an end-to-end operational platform connecting students, evaluators, and the interview management team through an atomic, multi-dimensional state machine."**

---

### [0:45 – 1:30] Student Eligibility & Contest Audit
**Visual:** Click into "Badge Eligibility" (`/badge-eligibility`). Show the 4 mandatory skills with scores (Prompt Engineering 92%, LLM Architecture 88%, Model Evaluation 85%, Tokenization 90%).

> **"A critical product principle is that eligibility is never assumed or hardcoded. An interview unlocks only when every mandatory skill contest of a Track Badge tier is completed and verified against the rubric.**
>
> **Here on Aarav Sharma's dashboard for the 'AI Foundations & Prompting' badge, our domain rules engine audits all 4 mandatory contests. Because all four exceed the 80% passing bar, his status dynamically resolves to ELIGIBLE. If even one contest were pending—which you can test with Scenario A in our demo bar—the booking CTA immediately locks, explaining exactly which skills remain incomplete.**
>
> **Notice our prominent notification banner: it surfaces the exact official eligibility text required by the assignment."**

---

### [1:30 – 2:30] Student Interview Booking Flow & Concurrency Protection
**Visual:** Navigate to "Book Interview" (`/book-interview`). Filter slots by date (12 Nov 2026), select a 45-min slot with Dr. Priya Ramanathan, click "Confirm & Reserve Slot", and transition to Booking Confirmation (`Screen 4`).

> **"Now let's book an interview. The candidate sees only valid, future slots with qualified evaluators. Each session is structured as a 45-minute live interview with a mandatory 15-minute post-session buffer.**
>
> **I’ll select tomorrow’s 10:00 AM slot with Dr. Priya Ramanathan. When I click 'Confirm & Reserve Slot', the system executes an atomic transaction. This slot is immediately marked BOOKED and locked out from every other candidate.**
>
> **Here is the official confirmation screen, displaying the exact prompt message, meeting URL, passcode, and clear cancellation policies.**
>
> **If another student attempted to click this exact same slot at the same millisecond, our database exclusion constraint rejects the race condition, ensuring zero double-booking."**

---

### [2:30 – 3:30] Evaluator Availability & Daily Schedule
**Visual:** Use top role switcher to toggle to **Interviewer (Dr. Priya Ramanathan)**. Show `/interviewer` and click `/interviewer/availability`.

> **"Let's switch into the shoes of our evaluator, Dr. Priya Ramanathan. Interviewers have an isolated workspace. They cannot modify peer calendars or change permissions.**
>
> **Under 'Manage Availability', evaluators configure their recurring weekly working days, start and end windows, and buffer times. The live generator below previews bookable slots in real time.**
>
> **Importantly, any change in working hours protects already confirmed candidate bookings—the system will never silently cancel an existing appointment.**
>
> **In the Daily Schedule calendar, Dr. Priya sees today’s booked sessions. Notice Sneha Kulkarni's interview, which concluded earlier today and is flagged as 'Evaluation Pending'."**

---

### [3:30 – 4:30] Structured Rubric Evaluation: Pass / Fail / Retake Outcomes
**Visual:** Open candidate workspace (`/interviewer/workspace/intv-2`) for Sneha Kulkarni. Demonstrate attendance controls, rubric sliders (Problem Solving, Conceptual Understanding, Communication), and fill the assessment. Show confirmation modal and submit PASS.

> **"Opening Sneha's workspace, the evaluator has immediate access to her verified contest scores, Qualiflyer rank, and attempt number.**
>
> **Here is our structured evaluation form. It supports exactly the three official GRIT outcomes: PASS, FAIL, or RETAKE LATER.**
>
> **Notice the strict separation between Student-Facing Feedback and Private Reviewer Notes. What the evaluator writes here in private notes is strictly confidential and protected by backend Row Level Security—candidates never see internal committee notes.**
>
> **When I click 'Submit Official Evaluation', a confirmation modal reminds the evaluator that this is an immutable institutional record. Upon confirmation, three things happen atomically: the interview marks completed, the student's badge status moves to AWARDED, and the candidate receives the official passing notification."**

---

### [4:30 – 5:30] Admin Operations: Tracking the "Eligible but Unbooked" Delta
**Visual:** Switch to **Admin Portal** (`/admin`). Show the top KPI cards and click into `/admin/eligible-students`. Click the "Eligible & Unbooked" filter button.

> **"Now let’s look at the Admin Command Center. Every statistic here is mathematically computed from live application records—no mock arrays or static metrics.**
>
> **The most vital operational metric is identifying students who have earned eligibility but haven’t booked their interview. Out of our cohort, 10 students are eligible, but several haven’t reserved slots.**
>
> **With one click on 'Eligible & Unbooked', the table filters to candidates like Tanvi Hegde and Devansh Gupta. As an admin, I can immediately click 'Nudge to Book' to dispatch a targeted in-app reminder, or use 'Export CSV' to brief campus coordinators. This direct operational pipeline prevents qualifying students from slipping through the cracks."**

---

### [5:30 – 6:15] Academic Integrity: Malpractice Review & Badge Nullification
**Visual:** Navigate to "Malpractice Inquiries" (`/admin/malpractice`). Show case #MAL-2 (Arjun Reddy) and case #MAL-1 (Meera Nair). Demonstrate adjudicating a case.

> **"A critical enterprise requirement is handling suspected malpractice after a badge has already been awarded.**
>
> **A malpractice flag does not automatically assume guilt. When an inquiry is opened, the badge moves to UNDER REVIEW with a respectful, non-accusatory notification to the candidate.**
>
> **Only authorized administrators can resolve inquiries. If the disciplinary committee confirms plagiarism—as happened with Arjun Reddy—the badge is NULLIFIED. But notice our core architecture: historical interview scores and attempt records remain 100% intact. We never overwrite or delete history. If an inquiry is dismissed, the badge is gracefully REINSTATED with a permanent audit trail."**

---

### [6:15 – 7:00] Data Architecture & Product Decisions Summary
**Visual:** Open "System Audit Log" (`/admin/audit-logs`) showing append-only chronological history.

> **"To conclude, let’s highlight the core engineering decisions behind GRIT Interview Hub:**
>
> **First, we decoupled Interview Outcomes from Badge Credential Validity, preserving forensic history even if a credential is later nullified.**
>
> **Second, we log every interview attempt as an independent immutable row, respecting a 7-day cooldown and 3-attempt ceiling.**
>
> **Third, our repository architecture runs seamlessly in local demo mode with full localStorage persistence and instant reset, while mirroring production PostgreSQL schemas and RLS policies.**
>
> **GRIT Interview Hub turns what used to be a scheduling bottleneck into an engaging, transparent, and rigorous milestone experience for thousands of engineering students. Thank you!"**

---
*End of Walkthrough Script*

