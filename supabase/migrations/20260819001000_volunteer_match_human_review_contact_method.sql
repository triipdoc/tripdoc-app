-- Phase 2 hardening: store the user's preferred human-review contact method separately.
-- This migration is intentionally small and should be applied before launching Volunteer Match UI.

alter table public.volunteer_human_review_requests
  add column if not exists preferred_contact_method text;

-- There should be no production review records before launch. This keeps non-production
-- test rows migratable while the application moves to the explicit column.
update public.volunteer_human_review_requests
set preferred_contact_method = 'email'
where preferred_contact_method is null;

alter table public.volunteer_human_review_requests
  alter column preferred_contact_method set not null,
  alter column preferred_contact_method drop default;

alter table public.volunteer_human_review_requests
  drop constraint if exists volunteer_human_review_requests_preferred_contact_method_check;

alter table public.volunteer_human_review_requests
  add constraint volunteer_human_review_requests_preferred_contact_method_check
  check (preferred_contact_method in ('email', 'whatsapp', 'either'));

create index if not exists volunteer_human_review_requests_preferred_contact_method_idx
  on public.volunteer_human_review_requests(preferred_contact_method);

comment on column public.volunteer_human_review_requests.preferred_contact_method is
  'Controlled contact preference for Volunteer Match human review requests. Allowed values: email, whatsapp, either.';

notify pgrst, 'reload schema';
