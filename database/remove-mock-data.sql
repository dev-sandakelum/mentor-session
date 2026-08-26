-- Removes only records created by database/mock-data.sql.
-- Run in Supabase SQL Editor when you no longer need the DEMO-* data.

begin;

delete from public.feedback
where participant_type = 'mentee' and participant_id in (select id from public.mentees where student_id like 'DEMO-E-%');

delete from public.feedback
where participant_type = 'mentor' and participant_id in (select id from public.mentors where student_id like 'DEMO-M-%');

delete from public.allocation_logs where action = '[Demo] FCFS allocation seeded';

-- Allocations and preferences for demo participants are removed by foreign-key cascades.
delete from public.mentees where student_id like 'DEMO-E-%';
delete from public.mentors where student_id like 'DEMO-M-%';

commit;
