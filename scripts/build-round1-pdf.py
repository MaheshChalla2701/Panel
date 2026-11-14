from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUT = Path('output/pdf/Panel_Interview_Hub_Round_1_Writeup.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)

styles = getSampleStyleSheet()
title = ParagraphStyle('Title', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=16, leading=18, alignment=TA_CENTER, textColor=colors.HexColor('#111827'), spaceAfter=5)
subtitle = ParagraphStyle('Subtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=10, alignment=TA_CENTER, textColor=colors.HexColor('#64748b'), spaceAfter=8)
h = ParagraphStyle('Heading', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=10, leading=12, textColor=colors.HexColor('#312e81'), spaceBefore=5, spaceAfter=4)
body = ParagraphStyle('Body', parent=styles['BodyText'], fontName='Helvetica', fontSize=7.35, leading=9, textColor=colors.HexColor('#1f2937'))
small = ParagraphStyle('Small', parent=body, fontSize=6.55, leading=7.7)
cell = ParagraphStyle('Cell', parent=body, fontSize=6.35, leading=7.5)
head_cell = ParagraphStyle('HeadCell', parent=cell, fontName='Helvetica-Bold', textColor=colors.white)


def p(text, style=body):
    return Paragraph(text, style)


def table(headers, rows, widths):
    data = [[p(v, head_cell) for v in headers]] + [[p(v, cell) for v in row] for row in rows]
    value = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    value.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#312e81')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))
    return value


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(colors.HexColor('#64748b'))
    canvas.drawString(15 * mm, 12 * mm, 'Panel Interview Hub - NIAT AI Product Engineer Round 1')
    canvas.drawRightString(195 * mm, 12 * mm, f'Page {doc.page}')
    canvas.restoreState()


doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=13 * mm, bottomMargin=17 * mm)
story = [
    p('Panel Interview Hub', title),
    p('AI Product Engineer - Round 1 | Product, policy, and data design', subtitle),
    p('1. Student interview journey', h),
    table(['State', 'What changes it', 'Student experience'], [
        ('Not eligible', 'Mandatory skill level is incomplete.', 'See missing requirements; booking stays locked.'),
        ('Eligible and unbooked', 'All mandatory skills are verified.', 'See available slots and a clear booking call to action.'),
        ('Booked / scheduled', 'Student commits an open slot.', 'See date, evaluator, meeting details, cancellation and reschedule rules.'),
        ('Interview completed', 'Evaluator concludes the session.', 'See evaluation-pending status, never a blank result.'),
        ('Pass', 'Evaluator submits a pass.', 'See badge award, result and student-facing feedback.'),
        ('Retake later / fail', 'Evaluator records an outcome.', 'See feedback, attempt history and cooldown/retry guidance.'),
        ('Under review / nullified', 'An integrity case is opened/resolved.', 'See neutral review notice, then a confirmed outcome or reinstatement.'),
    ], [30 * mm, 60 * mm, 75 * mm]),
    Spacer(1, 5),
    p('Design principle: eligibility, booking, interview, evaluation and badge validity are separate state dimensions. A later integrity review can revoke a badge without destroying the original interview record.', small),
    p('2. Edge cases and assumptions', h),
    table(['Case', 'Handling / assumption'], [
        ('Concurrent booking', 'The booking transaction locks the slot. First commit wins; the second student safely reselects.'),
        ('Eligibility disputed after booking', 'Journey moves to review and operations pauses the booking without deleting history.'),
        ('Interviewer unavailable', 'Preserve the booking, flag administration for reassignment, and notify the student after replacement.'),
        ('Retake later', 'Prototype uses a 7-day cooldown and a maximum of three attempts; both are configurable policy.'),
        ('Late cancellation or reschedule', 'Student self-service closes two hours before start. Overrides need an admin reason and audit entry.'),
        ('No show / delayed evaluation', 'Attempt is retained, evaluator/admin queues show the exception, and the student sees a clear pending status.'),
        ('Malpractice after award', 'Open a review; only an authorized admin can nullify or reinstate; preserve evidence and audit history.'),
        ('Privacy', 'Students see public feedback only. Private notes and case evidence are role-scoped by row-level access.'),
    ], [46 * mm, 119 * mm]),
    PageBreak(),
    Spacer(1, 13 * mm),
    p('Panel Interview Hub', title),
    p('AI Product Engineer - Round 1 | Data model and prototype evidence', subtitle),
    p('3. Data model', h),
    p('<b>Identity and roles:</b> <i>users</i> maps Supabase Auth identities to STUDENT, INTERVIEWER, and ADMIN. <i>students</i> and <i>interviewers</i> carry role-specific profile and capacity fields.', body),
    p('<b>Eligibility:</b> <i>tracks</i> -> <i>badges</i> -> <i>badge_requirements</i>, plus <i>student_skill_progress</i>, feed <i>student_badge_journeys</i>. The journey stores eligibility, badge validity, and attempt count.', body),
    p('<b>Scheduling:</b> <i>interviewer_availability</i>, <i>interviewer_unavailability</i>, and <i>interview_slots</i> describe capacity. <i>interviews</i> is one historical attempt per reservation, with scheduled times and evaluator.', body),
    p('<b>Assessment and integrity:</b> <i>interview_evaluations</i> stores Pass / Fail / Retake Later plus rubric, public feedback, and private notes. <i>malpractice_cases</i>, <i>badge_events</i>, <i>notifications</i>, and append-only <i>audit_logs</i> preserve the institutional record.', body),
    Spacer(1, 5),
    table(['Guard', 'Implementation'], [
        ('No double booking', 'Filtered unique index on active interview slots, plus SELECT FOR UPDATE inside the booking RPC.'),
        ('No overlapping active attempt', 'Filtered unique index on active journeys and overlap validation before insert.'),
        ('Role protection', 'Auth-to-profile mapping, row-level policies, security-definer RPCs, and scoped student/interviewer/admin reads.'),
        ('Auditability', 'Booking, evaluation, status, and integrity actions create immutable operational records.'),
    ], [55 * mm, 110 * mm]),
    p('4. Working prototype', h),
    p('The sign-in page has an <b>Assignment demo</b> path with seeded scenarios. It demonstrates: student eligibility and slot booking; interviewer availability, daily schedule, and outcome recording; student status/result screens; an admin eligible/booked/unbooked pipeline with reminders; and malpractice adjudication. The live student path uses Supabase Auth, PostgreSQL slots, realtime updates, and an atomic booking RPC.', body),
    p('5. Three important student messages', h),
    table(['Moment', 'Exact message'], [
        ('Eligible', 'You have completed the requirements for this badge. Choose an available interview slot to continue.'),
        ('Booked', 'Your interview is confirmed. Your evaluator, joining details, and preparation guidance are available in My Interviews.'),
        ('Result / review', 'Your interview result is available. If your badge is under review, we will show the official decision here when the review is complete.'),
    ], [34 * mm, 131 * mm]),
    p('Before and after: the student home and badge-result views switch among incomplete, eligible, booked, evaluation pending, awarded, under review, and nullified states. The demo scenario switch makes each state visible during the walkthrough.', small),
]

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
