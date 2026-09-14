-- TripDoc opportunity admin/public upgrade.
-- Deployment order:
-- 1. Apply this migration.
-- 2. Deploy the application code that reads/writes the new fields.
-- 3. Review legacy records in the admin before changing slugs or archival state.

alter table public.programs
  add column if not exists organisation text,
  add column if not exists publishing_status text,
  add column if not exists availability_status text,
  add column if not exists deadline_mode text,
  add column if not exists deadline_time time without time zone,
  add column if not exists deadline_timezone text,
  add column if not exists additional_application_steps jsonb not null default '[]'::jsonb,
  add column if not exists image_alt text,
  add column if not exists funding_amount numeric(12, 2),
  add column if not exists funding_currency text,
  add column if not exists funding_coverage text,
  add column if not exists applicant_costs text,
  add column if not exists official_source_links jsonb not null default '[]'::jsonb,
  add column if not exists reviewer_name text,
  add column if not exists verified_at timestamp with time zone,
  add column if not exists evidence_notes text,
  add column if not exists private_reviewer_notes text,
  add column if not exists sponsorship_status text,
  add column if not exists sponsorship_evidence text,
  add column if not exists sponsorship_source_url text,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

-- Explicit legacy handling:
-- Existing public behaviour was verification_status = 'verified'. Preserve that by
-- backfilling existing verified records as published + verified. Existing pending/draft
-- style records remain non-public drafts needing review.
update public.programs
set publishing_status = case
    when verification_status = 'verified' then 'published'
    else 'draft'
  end
where publishing_status is null;

update public.programs
set verification_status = case
    when verification_status = 'verified' then 'verified'
    when verification_status = 'conflicting_evidence' then 'conflicting_evidence'
    else 'needs_review'
  end
where verification_status is distinct from case
    when verification_status = 'verified' then 'verified'
    when verification_status = 'conflicting_evidence' then 'conflicting_evidence'
    else 'needs_review'
  end;

update public.programs
set availability_status = case
    when deadline is not null and deadline < current_date then 'closed'
    else 'unknown'
  end
where availability_status is null;

update public.programs
set deadline_mode = case
    when deadline is not null then 'fixed_date'
    else 'unknown'
  end
where deadline_mode is null;

update public.programs
set sponsorship_status = 'unclear'
where sponsorship_status is null;

alter table public.programs
  alter column publishing_status set default 'draft',
  alter column publishing_status set not null,
  alter column verification_status set default 'needs_review',
  alter column availability_status set default 'unknown',
  alter column availability_status set not null,
  alter column deadline_mode set default 'unknown',
  alter column deadline_mode set not null,
  alter column sponsorship_status set default 'unclear',
  alter column sponsorship_status set not null;

alter table public.programs
  drop constraint if exists programs_publishing_status_check,
  add constraint programs_publishing_status_check
    check (publishing_status in ('draft', 'published', 'archived')),
  drop constraint if exists programs_verification_status_check,
  add constraint programs_verification_status_check
    check (verification_status in ('needs_review', 'verified', 'conflicting_evidence')),
  drop constraint if exists programs_availability_status_check,
  add constraint programs_availability_status_check
    check (availability_status in ('open', 'closed', 'rolling', 'unknown')),
  drop constraint if exists programs_deadline_mode_check,
  add constraint programs_deadline_mode_check
    check (deadline_mode in ('fixed_date', 'rolling', 'unknown')),
  drop constraint if exists programs_sponsorship_status_check,
  add constraint programs_sponsorship_status_check
    check (sponsorship_status in ('confirmed', 'not_offered', 'unclear')),
  drop constraint if exists programs_additional_application_steps_array_check,
  add constraint programs_additional_application_steps_array_check
    check (jsonb_typeof(additional_application_steps) = 'array'),
  drop constraint if exists programs_official_source_links_array_check,
  add constraint programs_official_source_links_array_check
    check (jsonb_typeof(official_source_links) = 'array'),
  drop constraint if exists programs_verified_evidence_check,
  add constraint programs_verified_evidence_check
    check (
      verification_status <> 'verified'
      or (
        nullif(trim(coalesce(reviewer_name, '')), '') is not null
        and verified_at is not null
        and jsonb_array_length(official_source_links) > 0
      )
    ) not valid;

create index if not exists programs_public_listing_idx
  on public.programs (publishing_status, availability_status, deadline_mode, deadline);

create index if not exists programs_review_queue_idx
  on public.programs (verification_status, publishing_status, created_at desc);

create index if not exists programs_archived_idx
  on public.programs (publishing_status, created_at desc);

create table if not exists public.program_slug_redirects (
  id uuid primary key default gen_random_uuid(),
  old_slug text not null unique,
  program_id uuid not null references public.programs(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

create index if not exists program_slug_redirects_program_id_idx
  on public.program_slug_redirects(program_id);

create table if not exists public.program_change_history (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete set null,
  actor text,
  action text not null,
  changed_fields text[] not null default '{}'::text[],
  previous_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists program_change_history_program_id_idx
  on public.program_change_history(program_id, created_at desc);

create index if not exists program_change_history_created_at_idx
  on public.program_change_history(created_at desc);

alter table public.programs enable row level security;
alter table public.program_slug_redirects enable row level security;
alter table public.program_change_history enable row level security;

drop policy if exists "Public insert programs" on public.programs;
drop policy if exists "Public update programs" on public.programs;
drop policy if exists "Public delete programs" on public.programs;
drop policy if exists "Public read programs" on public.programs;
drop policy if exists "Public read public programs" on public.programs;

create or replace view public.program_public_view as
select
  id,
  title,
  type,
  country,
  field,
  funding_type,
  deadline,
  official_url,
  verification_status,
  last_verified_at,
  created_at,
  slug,
  description,
  image_url,
  featured,
  organisation,
  publishing_status,
  availability_status,
  deadline_mode,
  deadline_time,
  deadline_timezone,
  additional_application_steps,
  image_alt,
  funding_amount,
  funding_currency,
  funding_coverage,
  applicant_costs,
  official_source_links,
  reviewer_name,
  verified_at,
  evidence_notes,
  sponsorship_status,
  sponsorship_evidence,
  sponsorship_source_url,
  seo_title,
  seo_description
from public.programs
where publishing_status in ('published', 'archived');

revoke all on public.program_public_view from anon, authenticated;
grant select on public.program_public_view to anon, authenticated;

drop policy if exists "Public read program slug redirects" on public.program_slug_redirects;
create policy "Public read program slug redirects" on public.program_slug_redirects
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.program_public_view p
      where p.id = program_slug_redirects.program_id
    )
  );

drop policy if exists "Public cannot read program change history" on public.program_change_history;
create policy "Public cannot read program change history" on public.program_change_history
  for select
  to anon, authenticated
  using (false);

revoke insert, update, delete on public.programs from anon, authenticated;
revoke select on public.programs from anon, authenticated;
revoke all on public.program_change_history from anon, authenticated;
revoke all on public.program_slug_redirects from anon, authenticated;

grant select on public.program_slug_redirects to anon, authenticated;
grant all on public.programs to service_role;
grant all on public.program_slug_redirects to service_role;
grant all on public.program_change_history to service_role;
