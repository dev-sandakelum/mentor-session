-- Demo data for the Mentor Session application.
-- Run database/schema.sql first, then run this file in Supabase SQL Editor.
-- It is safe to run multiple times: all demo participants use DEMO-* student IDs.

begin;

with current_session as (
  select id from public.mentor_sessions where year = 2026
)
insert into public.mentors (
  session_id, full_name, student_id, email, phone, batch, communication_method,
  capacity, profile_photo_url
)
select
  current_session.id, source.full_name, source.student_id, source.email, source.phone,
  '9th Batch · BICT', source.communication_method, 2, source.profile_photo_url
from current_session
cross join (
  values
    ('Tharindu Jayasooriya', 'DEMO-M-001', 'tharindu.demo@fot.ruh.ac.lk', '071 234 5678', 'WhatsApp', '/profile/mentor/1.jpg'),
    ('Ishara Gunawardena', 'DEMO-M-002', 'ishara.demo@fot.ruh.ac.lk', '071 234 5679', 'WhatsApp', '/profile/mentor/2.jpg'),
    ('Dulani Rathnayake', 'DEMO-M-003', 'dulani.demo@fot.ruh.ac.lk', '071 234 5680', 'Email', '/profile/mentor/3.jpg'),
    ('Kasun Weerasinghe', 'DEMO-M-004', 'kasun.demo@fot.ruh.ac.lk', '071 234 5681', 'Phone Call', '/profile/mentor/4.jpg'),
    ('Sanduni Fernando', 'DEMO-M-005', 'sanduni.demo@fot.ruh.ac.lk', '071 234 5682', 'WhatsApp', '/profile/mentor/5.jpg'),
    ('Pasindu Amarasinghe', 'DEMO-M-006', 'pasindu.demo@fot.ruh.ac.lk', '071 234 5683', 'In-Person', '/profile/mentor/6.jpg'),
    ('Nadeesha Silva', 'DEMO-M-007', 'nadeesha.demo@fot.ruh.ac.lk', '071 234 5684', 'Email', '/profile/mentor/7.jpg'),
    ('Ashen Kumarasinghe', 'DEMO-M-008', 'ashen.demo@fot.ruh.ac.lk', '071 234 5685', 'WhatsApp', null)
) as source(full_name, student_id, email, phone, communication_method, profile_photo_url)
on conflict (session_id, student_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  profile_photo_url = excluded.profile_photo_url;

with current_session as (
  select id from public.mentor_sessions where year = 2026
)
insert into public.mentees (
  session_id, full_name, student_id, email, phone, batch, preference_submitted_at
)
select
  current_session.id, source.full_name, source.student_id, source.email, source.phone,
  '10th Batch · BICT', source.submitted_at
from current_session
cross join (
  values
    ('Kavindi Wickramasinghe', 'DEMO-E-001', 'kavindi.demo@fot.ruh.ac.lk', '077 100 0001', '2026-08-20 04:31:42+00'::timestamptz),
    ('Sahan Dissanayake', 'DEMO-E-002', 'sahan.demo@fot.ruh.ac.lk', '077 100 0002', '2026-08-20 04:31:48+00'::timestamptz),
    ('Nimesha Herath', 'DEMO-E-003', 'nimesha.demo@fot.ruh.ac.lk', '077 100 0003', '2026-08-20 04:32:05+00'::timestamptz),
    ('Ravindu Peris', 'DEMO-E-004', 'ravindu.demo@fot.ruh.ac.lk', '077 100 0004', '2026-08-20 04:32:11+00'::timestamptz),
    ('Chamodi Senanayake', 'DEMO-E-005', 'chamodi.demo@fot.ruh.ac.lk', '077 100 0005', '2026-08-20 04:33:27+00'::timestamptz),
    ('Isuru Bandara', 'DEMO-E-006', 'isuru.demo@fot.ruh.ac.lk', '077 100 0006', '2026-08-20 04:34:02+00'::timestamptz),
    ('Hiruni Madushani', 'DEMO-E-007', 'hiruni.demo@fot.ruh.ac.lk', '077 100 0007', '2026-08-20 04:34:40+00'::timestamptz),
    ('Dineth Kulasekara', 'DEMO-E-008', 'dineth.demo@fot.ruh.ac.lk', '077 100 0008', '2026-08-20 04:35:16+00'::timestamptz)
) as source(full_name, student_id, email, phone, submitted_at)
on conflict (session_id, student_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  preference_submitted_at = excluded.preference_submitted_at;

insert into public.mentor_preferences (mentee_id, mentor_id, priority, submitted_at)
select mentee.id, mentor.id, source.priority, mentee.preference_submitted_at
from (
  values
    ('DEMO-E-001', 'DEMO-M-001', 1), ('DEMO-E-001', 'DEMO-M-008', 2), ('DEMO-E-001', 'DEMO-M-002', 3),
    ('DEMO-E-002', 'DEMO-M-001', 1), ('DEMO-E-002', 'DEMO-M-002', 2), ('DEMO-E-002', 'DEMO-M-006', 3),
    ('DEMO-E-003', 'DEMO-M-002', 1), ('DEMO-E-003', 'DEMO-M-007', 2), ('DEMO-E-003', 'DEMO-M-001', 3),
    ('DEMO-E-004', 'DEMO-M-003', 1), ('DEMO-E-004', 'DEMO-M-008', 2), ('DEMO-E-004', 'DEMO-M-001', 3),
    ('DEMO-E-005', 'DEMO-M-004', 1), ('DEMO-E-005', 'DEMO-M-006', 2), ('DEMO-E-005', 'DEMO-M-003', 3),
    ('DEMO-E-006', 'DEMO-M-005', 1), ('DEMO-E-006', 'DEMO-M-008', 2), ('DEMO-E-006', 'DEMO-M-004', 3),
    ('DEMO-E-007', 'DEMO-M-006', 1), ('DEMO-E-007', 'DEMO-M-001', 2), ('DEMO-E-007', 'DEMO-M-002', 3),
    ('DEMO-E-008', 'DEMO-M-008', 1), ('DEMO-E-008', 'DEMO-M-003', 2), ('DEMO-E-008', 'DEMO-M-005', 3)
) as source(mentee_student_id, mentor_student_id, priority)
join public.mentees as mentee on mentee.student_id = source.mentee_student_id
join public.mentors as mentor on mentor.student_id = source.mentor_student_id
on conflict (mentee_id, priority) do update set mentor_id = excluded.mentor_id, submitted_at = excluded.submitted_at;

insert into public.allocations (session_id, mentee_id, mentor_id, method, matched_priority)
select session.id, mentee.id, mentor.id, source.method::public.allocation_method, source.matched_priority
from (
  values
    ('DEMO-E-001', 'DEMO-M-001', 'preference', 1),
    ('DEMO-E-002', 'DEMO-M-001', 'preference', 1),
    ('DEMO-E-003', 'DEMO-M-002', 'preference', 1),
    ('DEMO-E-004', 'DEMO-M-003', 'preference', 1),
    ('DEMO-E-005', 'DEMO-M-004', 'preference', 1),
    ('DEMO-E-006', 'DEMO-M-005', 'preference', 1),
    ('DEMO-E-007', 'DEMO-M-006', 'preference', 1),
    ('DEMO-E-008', 'DEMO-M-008', 'preference', 1)
) as source(mentee_student_id, mentor_student_id, method, matched_priority)
join public.mentees as mentee on mentee.student_id = source.mentee_student_id
join public.mentors as mentor on mentor.student_id = source.mentor_student_id
join public.mentor_sessions as session on session.year = 2026
on conflict (mentee_id) do update set
  mentor_id = excluded.mentor_id,
  method = excluded.method,
  matched_priority = excluded.matched_priority,
  allocated_at = now();

insert into public.feedback (session_id, participant_type, participant_id, rating, comment)
select session.id, source.participant_type::public.participant_type,
  case when source.participant_type = 'mentor' then mentor.id else mentee.id end,
  source.rating, source.comment
from (
  values
    ('mentee', 'DEMO-E-001', 5, 'The mentor was helpful and gave a clear study plan.'),
    ('mentee', 'DEMO-E-003', 4, 'A very useful first session.'),
    ('mentor', 'DEMO-M-001', 5, 'The group was engaged and easy to guide.')
) as source(participant_type, student_id, rating, comment)
join public.mentor_sessions as session on session.year = 2026
left join public.mentees as mentee on source.participant_type = 'mentee' and mentee.student_id = source.student_id
left join public.mentors as mentor on source.participant_type = 'mentor' and mentor.student_id = source.student_id
on conflict (session_id, participant_type, participant_id) do update set rating = excluded.rating, comment = excluded.comment;

insert into public.allocation_logs (session_id, action, detail)
select id, '[Demo] FCFS allocation seeded', '8 demo mentees allocated to approved demo mentors.'
from public.mentor_sessions where year = 2026
and not exists (
  select 1 from public.allocation_logs where action = '[Demo] FCFS allocation seeded'
);

commit;
