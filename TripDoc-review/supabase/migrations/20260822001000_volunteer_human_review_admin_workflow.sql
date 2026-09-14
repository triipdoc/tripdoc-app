-- Human Review admin workflow fields for Volunteer Match.
-- Keeps the public table private under the existing RLS setup.

alter table public.volunteer_human_review_requests
  add column if not exists contacted_at timestamp with time zone,
  add column if not exists reviewed_at timestamp with time zone,
  add column if not exists closed_at timestamp with time zone,
  add column if not exists admin_notes text;

update public.volunteer_human_review_requests
set status = case
  when status in ('new', 'contacted', 'reviewed', 'closed') then status
  when status = 'reviewing' then 'new'
  when status = 'spam' then 'closed'
  else 'new'
end
where status is distinct from case
  when status in ('new', 'contacted', 'reviewed', 'closed') then status
  when status = 'reviewing' then 'new'
  when status = 'spam' then 'closed'
  else 'new'
end;

alter table public.volunteer_human_review_requests
  alter column status set default 'new';

alter table public.volunteer_human_review_requests
  drop constraint if exists volunteer_human_review_requests_status_check;

alter table public.volunteer_human_review_requests
  add constraint volunteer_human_review_requests_status_check
  check (status in ('new', 'contacted', 'reviewed', 'closed'));

create index if not exists volunteer_human_review_requests_status_idx
  on public.volunteer_human_review_requests(status);

create index if not exists volunteer_human_review_requests_created_at_idx
  on public.volunteer_human_review_requests(created_at desc);

comment on column public.volunteer_human_review_requests.admin_notes is
  'Private admin-only notes for TripDoc human review workflow.';

notify pgrst, 'reload schema';
