-- Shared Google Meet room used only for the requested prototype walkthrough.
-- Production should create a distinct room per confirmed interview via a
-- calendar/video provider integration.

ALTER TABLE public.interviews
  ALTER COLUMN meeting_link SET DEFAULT 'https://meet.google.com/bot-yiqe-yne';

UPDATE public.interviews
SET meeting_link = 'https://meet.google.com/bot-yiqe-yne'
WHERE meeting_link LIKE 'https://meet.grit.niatindia.com/room/%';
