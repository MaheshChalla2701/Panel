# Panel Interview Hub — NIAT Engineering

> *"Your next milestone starts with one conversation."*

**Panel Interview Hub** is a production-grade web application built for the **NIAT Panel** upskilling program. It automates and coordinates the live online interview milestone required for engineering students to earn official **Track Badges** across specialized technology tracks (*AI Models Mastery, Applied Generative AI Development, UI Engineering, and Data Science & Machine Learning*).

---

## 🌟 Key Product Capabilities

### 1. Student Experience
- **Automated Eligibility Auditing:** Verifies candidate completion of all mandatory track skill contests against minimum scoring thresholds (80%) before unlocking scheduling.
- **Atomic Slot Reservation:** Real-time calendar booking with zero double-booking risk and instant slot lockouts.
- **Safe Transactional Rescheduling:** Re-allocates sessions atomically; old slots are released only after new slots are reserved.
- **Transparent Evaluation Insights:** Candidates inspect structured rubric scores and constructive evaluator feedback without exposing confidential reviewer notes.
- **Credential Lifecycle:** Tracks badge progression across `NOT_EARNED`, `PENDING_AWARD`, `AWARDED`, `UNDER_REVIEW`, `NULLIFIED`, and `REINSTATED` statuses.

### 2. Interviewer Experience
- **Self-Service Availability:** Define recurring weekly working hours, adjust session duration (45 mins) and buffers (15 mins), and preview generated slots.
- **Existing Appointment Protection:** Modifying availability windows protects existing confirmed student bookings from accidental deletion.
- **Evaluator Scoping:** Strictly restricts view to assigned sessions; prevents unauthorized tampering with peer calendars.
- **Structured Assessment:** Evaluation form enforcing official outcomes (`PASS`, `FAIL`, `RETAKE_LATER`), rubric sliders (1–5), student feedback, and private reviewer notes with confirmation modal.

### 3. Admin & Interview Operations
- **Live Pipeline Analytics:** Mathematically calculates unique eligible candidates, booking conversion rates, upcoming sessions, and evaluator throughput.
- **Unbooked Student Identification:** Instantly isolate qualified students who have not yet scheduled an interview and dispatch targeted in-app reminders.
- **Evaluator Capacity Oversight:** Reassign sessions dynamically to balance workloads.
- **Academic Integrity Board:** Formally investigate reported malpractice cases with documented justification; authorize badge nullification while preserving complete historical attempt audits.
- **Append-Only System Audit Log:** Comprehensive record of every state transition, booking, evaluation submission, and administrative action.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, TypeScript 5.7, Tailwind CSS 3.4 |
| **Icons & UI** | Lucide React, Custom Tailwind Design System |
| **Routing & State** | React Router 6, TanStack Query 5 |
| **Analytics & Charts** | Recharts 2.15 |
| **Database & ORM** | PostgreSQL 15, Supabase (RLS, Migrations, Seed) |
| **Repository Pattern** | Dual-mode: LocalStorage Persistent Demo Repo & Supabase Client |
| **Testing** | Vitest 2.1, React Testing Library, Playwright E2E |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22 LTS recommended)
- **npm** or **pnpm**

### Installation
```bash
# Clone or navigate to the project directory
cd "Panel-interview-hub"

# Install dependencies
npm install
```

### Running Locally (Zero-Config Demo Mode)
The application works immediately out of the box with realistic seed data and zero third-party API dependencies:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👥 Demo User Personas & Switching

Use the **interactive role switcher bar** at the top of the screen or test with these accounts:

| Role | Persona Name | Demo Email | Focus Scenario |
| :--- | :--- | :--- | :--- |
| **Student** | Aarav Sharma | `student@Panel.demo` | Eligible candidate; ready to book interview. |
| **Interviewer** | Dr. Priya Ramanathan | `interviewer@Panel.demo` | Senior Evaluator; manages availability & grades sessions. |
| **Admin** | Vikram Roy | `admin@Panel.demo` | Operations Lead; tracks unbooked students & reviews malpractice. |

### Resetting Demo Data
Click the **"Reset Demo"** button on the top banner at any time to restore all seed records, slots, and journeys to their pristine initial state.

### Interactive Before/After Scenarios (Part 6)
Click the **"Before/After Scenarios"** dropdown on the top banner to instantly preview student dashboard transformations across Scenarios A through H:
- **Scenario A:** Incomplete Skills (Booking Locked)
- **Scenario B:** All Skills Complete (Eligible, Unbooked)
- **Scenario C:** Interview Confirmed & Booked
- **Scenario D:** Interview Completed (Evaluation Pending)
- **Scenario E:** Passed & Track Badge Awarded
- **Scenario F:** Retake Required (7-Day Cooldown Active)
- **Scenario G:** Badge Under Administrative Review
- **Scenario H:** Badge Nullified (Integrity Sanction)

---

## 🗄️ PostgreSQL & Supabase Integration

When deploying to Supabase:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Execute the migration script in `supabase/migrations/20261111_Panel_interview_hub.sql` via Supabase SQL Editor.
3. Execute the seed script in `supabase/seed.sql`.
4. Configure environment variables in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🧪 Testing & Quality Assurance

### Run Unit & Integration Tests (Vitest)
```bash
npm run test
```
Executes 14 automated tests covering eligibility scoring, state transitions, double-booking prevention, cooldown timers, evaluation persistence, and malpractice resolution.

### Run End-to-End Tests (Playwright)
```bash
npm run test:e2e
```

### Production Build & Typecheck
```bash
npm run build
```

---

## 📄 Submission Materials Directory
- **Two-Page Product Design PDF:** [`docs/submission/Panel_Interview_Hub_Product_Design.pdf`](./submission/Panel_Interview_Hub_Product_Design.pdf)
- **Editable Design Source:** [`docs/submission/Panel_Interview_Hub_Product_Design.md`](./submission/Panel_Interview_Hub_Product_Design.md)
- **Loom Walkthrough Script:** [`docs/submission/LOOM_WALKTHROUGH_SCRIPT.md`](./submission/LOOM_WALKTHROUGH_SCRIPT.md)
- **Data Model Schema:** [`docs/architecture/DATA_MODEL.md`](./architecture/DATA_MODEL.md)
- **State Machine Spec:** [`docs/architecture/STATE_MACHINE.md`](./architecture/STATE_MACHINE.md)
- **Edge Cases & Assumptions:** [`docs/submission/EDGE_CASES_AND_ASSUMPTIONS.md`](./submission/EDGE_CASES_AND_ASSUMPTIONS.md)
- **Demo Verification Checklist:** [`docs/submission/DEMO_CHECKLIST.md`](./submission/DEMO_CHECKLIST.md)

