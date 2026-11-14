# Panel Interview Hub - Loom Recording Script (about 3 minutes)

## 0:00-0:25 - Problem and approach
“Panel students complete the required skills for a track badge, then need a live interview before the badge is awarded. I designed the Interview Hub around three roles: student, interviewer, and operations admin. The key decision was to keep eligibility, booking, interview, evaluation, and badge validity as separate states, so later malpractice reviews do not erase an interview record.”

## 0:25-1:10 - Student flow
“I’ll start in the Student portal. The eligibility screen explains which skill requirements are complete and when booking unlocks. An eligible student can filter real evaluator slots and reserve one. The booking action is atomic: the database locks the slot so two students cannot receive the same time. After booking, the student sees the date, evaluator, interview status, and later the result. The important student messages are: eligibility achieved, booking confirmed, and the official result or review notice.”

## 1:10-1:55 - Interviewer flow
“Next is the Interviewer workspace. An evaluator sets working windows, duration, and buffer time, then uses the daily schedule to open the candidate workspace. After the call, the evaluator selects Pass, Fail, or Retake Later, completes structured rubric feedback, and adds private reviewer notes. The submitted evaluation is immutable, while badge award and integrity decisions remain controlled by policy and administration.”

## 1:55-2:35 - Admin flow and integrity
“The Admin pipeline separates eligible students who booked from those who have not. Operations can filter the unbooked group and send a booking reminder. The malpractice board demonstrates why badge validity is independent from evaluation: an awarded badge can go under review, be nullified after a confirmed case, or be reinstated after dismissal, while the original interview history remains intact.”

## 2:35-3:00 - Technical decisions
“The backend uses Supabase Auth, PostgreSQL, row-level access control, an atomic booking RPC, audit logs, and realtime slot updates. I seeded a safe demo cohort so every state is demonstrable. For the submission, I would show the Assignment Demo mode for the complete role-based prototype, then show the live booking path to demonstrate that the concurrency protection is not only visual.”
