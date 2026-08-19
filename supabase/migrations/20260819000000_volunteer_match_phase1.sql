create extension if not exists pgcrypto;

create table if not exists public.volunteer_routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  route_family text not null,
  destination_country text,
  summary text,
  official_url text,
  source_url text not null,
  source_title text not null,
  source_organisation text not null,
  last_verified_at timestamp with time zone,
  verified_by text,
  verification_notes text,
  verification_due_at timestamp with time zone,
  verification_status text not null default 'draft',
  active boolean not null default false,
  display_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint volunteer_routes_slug_unique unique (slug),
  constraint volunteer_routes_status_check check (verification_status in ('verified', 'pending', 'draft', 'archived')),
  constraint volunteer_routes_family_check check (route_family in ('weltwaerts_south_north', 'bfd', 'fsj', 'foej', 'sci_long_term', 'sci_workcamp', 'other_verified_route'))
);

create table if not exists public.volunteer_route_rule_versions (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.volunteer_routes(id) on delete cascade,
  version_number integer not null,
  status text not null default 'draft',
  rules_json jsonb not null,
  source_url text not null,
  source_title text not null,
  source_organisation text not null,
  last_verified_at timestamp with time zone,
  verified_by text,
  verification_notes text,
  verification_due_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  published_at timestamp with time zone,
  constraint volunteer_route_rule_versions_unique unique (route_id, version_number),
  constraint volunteer_route_rule_versions_status_check check (status in ('draft', 'published', 'archived')),
  constraint volunteer_route_rule_versions_version_positive check (version_number > 0),
  constraint volunteer_route_rule_versions_rules_object check (jsonb_typeof(rules_json) = 'object')
);

create unique index if not exists volunteer_route_rule_versions_one_published_idx on public.volunteer_route_rule_versions(route_id) where status = 'published';

create table if not exists public.volunteer_match_sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'started',
  acquisition_source text,
  acquisition_source_detail text,
  answers_json jsonb not null default '{}'::jsonb,
  privacy_notice_version text not null default 'volunteer-match-privacy-v1',
  consented_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint volunteer_match_sessions_status_check check (status in ('started', 'completed', 'abandoned')),
  constraint volunteer_match_sessions_acquisition_source_check check (acquisition_source is null or acquisition_source in ('tiktok', 'youtube', 'instagram', 'facebook', 'linkedin', 'google', 'whatsapp', 'referral', 'other')),
  constraint volunteer_match_sessions_answers_object check (jsonb_typeof(answers_json) = 'object')
);

create table if not exists public.volunteer_match_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.volunteer_match_sessions(id) on delete cascade,
  route_id uuid not null references public.volunteer_routes(id) on delete restrict,
  rule_version_id uuid not null references public.volunteer_route_rule_versions(id) on delete restrict,
  verdict text not null,
  internal_score integer,
  reasons_json jsonb not null default '[]'::jsonb,
  blockers_json jsonb not null default '[]'::jsonb,
  next_steps_json jsonb not null default '[]'::jsonb,
  human_review_reasons_json jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint volunteer_match_results_unique_route_per_session unique (session_id, route_id),
  constraint volunteer_match_results_verdict_check check (verdict in ('Strong Potential', 'Potential — Preparation Needed', 'Currently Weak Fit', 'Needs Human Review')),
  constraint volunteer_match_results_score_check check (internal_score is null or (internal_score >= 0 and internal_score <= 100)),
  constraint volunteer_match_results_reasons_array check (jsonb_typeof(reasons_json) = 'array'),
  constraint volunteer_match_results_blockers_array check (jsonb_typeof(blockers_json) = 'array'),
  constraint volunteer_match_results_next_steps_array check (jsonb_typeof(next_steps_json) = 'array'),
  constraint volunteer_match_results_human_review_array check (jsonb_typeof(human_review_reasons_json) = 'array')
);

create table if not exists public.volunteer_match_route_programs (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.volunteer_routes(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  relationship_type text not null default 'related_opportunity',
  display_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint volunteer_match_route_programs_unique unique (route_id, program_id),
  constraint volunteer_match_route_programs_relationship_check check (relationship_type in ('primary_opportunity', 'related_opportunity', 'official_route_page'))
);

create table if not exists public.volunteer_match_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id uuid references public.volunteer_match_sessions(id) on delete set null,
  route_id uuid references public.volunteer_routes(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  acquisition_source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint volunteer_match_events_event_name_check check (event_name in ('volunteer_match_started', 'volunteer_match_completed', 'volunteer_match_result', 'matching_opportunity_clicked', 'human_review_clicked', 'human_review_submitted')),
  constraint volunteer_match_events_acquisition_source_check check (acquisition_source is null or acquisition_source in ('tiktok', 'youtube', 'instagram', 'facebook', 'linkedin', 'google', 'whatsapp', 'referral', 'other')),
  constraint volunteer_match_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.volunteer_human_review_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.volunteer_match_sessions(id) on delete cascade,
  name text,
  email text,
  whatsapp text,
  message text,
  consent_to_contact boolean not null default false,
  consented_at timestamp with time zone,
  privacy_notice_version text not null default 'volunteer-match-privacy-v1',
  status text not null default 'new',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint volunteer_human_review_requests_status_check check (status in ('new', 'reviewing', 'contacted', 'closed', 'spam')),
  constraint volunteer_human_review_contact_required check (nullif(btrim(coalesce(email, '')), '') is not null or nullif(btrim(coalesce(whatsapp, '')), '') is not null),
  constraint volunteer_human_review_consent_required check (consent_to_contact is true and consented_at is not null)
);

create index if not exists volunteer_routes_created_at_idx on public.volunteer_routes(created_at desc);
create index if not exists volunteer_routes_family_status_idx on public.volunteer_routes(route_family, verification_status, active);
create index if not exists volunteer_route_rule_versions_route_id_idx on public.volunteer_route_rule_versions(route_id);
create index if not exists volunteer_route_rule_versions_status_idx on public.volunteer_route_rule_versions(status);
create index if not exists volunteer_match_sessions_created_at_idx on public.volunteer_match_sessions(created_at desc);
create index if not exists volunteer_match_sessions_status_idx on public.volunteer_match_sessions(status);
create index if not exists volunteer_match_sessions_acquisition_source_idx on public.volunteer_match_sessions(acquisition_source);
create index if not exists volunteer_match_results_session_id_idx on public.volunteer_match_results(session_id);
create index if not exists volunteer_match_results_route_id_idx on public.volunteer_match_results(route_id);
create index if not exists volunteer_match_results_verdict_idx on public.volunteer_match_results(verdict);
create index if not exists volunteer_match_route_programs_route_id_idx on public.volunteer_match_route_programs(route_id);
create index if not exists volunteer_match_route_programs_program_id_idx on public.volunteer_match_route_programs(program_id);
create index if not exists volunteer_match_events_event_name_idx on public.volunteer_match_events(event_name);
create index if not exists volunteer_match_events_acquisition_source_idx on public.volunteer_match_events(acquisition_source);
create index if not exists volunteer_match_events_created_at_idx on public.volunteer_match_events(created_at desc);
create index if not exists volunteer_match_events_session_id_idx on public.volunteer_match_events(session_id);
create index if not exists volunteer_match_events_route_id_idx on public.volunteer_match_events(route_id);
create index if not exists volunteer_human_review_requests_session_id_idx on public.volunteer_human_review_requests(session_id);
create index if not exists volunteer_human_review_requests_status_idx on public.volunteer_human_review_requests(status);
create index if not exists volunteer_human_review_requests_created_at_idx on public.volunteer_human_review_requests(created_at desc);

create or replace function public.set_volunteer_match_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_volunteer_routes_updated_at on public.volunteer_routes;
create trigger set_volunteer_routes_updated_at before update on public.volunteer_routes for each row execute function public.set_volunteer_match_updated_at();

drop trigger if exists set_volunteer_route_rule_versions_updated_at on public.volunteer_route_rule_versions;
create trigger set_volunteer_route_rule_versions_updated_at before update on public.volunteer_route_rule_versions for each row execute function public.set_volunteer_match_updated_at();

drop trigger if exists set_volunteer_match_sessions_updated_at on public.volunteer_match_sessions;
create trigger set_volunteer_match_sessions_updated_at before update on public.volunteer_match_sessions for each row execute function public.set_volunteer_match_updated_at();

drop trigger if exists set_volunteer_human_review_requests_updated_at on public.volunteer_human_review_requests;
create trigger set_volunteer_human_review_requests_updated_at before update on public.volunteer_human_review_requests for each row execute function public.set_volunteer_match_updated_at();

alter table public.volunteer_routes enable row level security;
alter table public.volunteer_route_rule_versions enable row level security;
alter table public.volunteer_match_sessions enable row level security;
alter table public.volunteer_match_results enable row level security;
alter table public.volunteer_match_route_programs enable row level security;
alter table public.volunteer_match_events enable row level security;
alter table public.volunteer_human_review_requests enable row level security;

revoke all on public.volunteer_match_sessions from anon, authenticated;
revoke all on public.volunteer_match_results from anon, authenticated;
revoke all on public.volunteer_match_events from anon, authenticated;
revoke all on public.volunteer_human_review_requests from anon, authenticated;
revoke all on public.volunteer_routes from anon, authenticated;
revoke all on public.volunteer_route_rule_versions from anon, authenticated;
revoke all on public.volunteer_match_route_programs from anon, authenticated;

grant select on public.volunteer_routes to anon, authenticated;
grant select on public.volunteer_route_rule_versions to anon, authenticated;
grant select on public.volunteer_match_route_programs to anon, authenticated;

grant all on public.volunteer_routes to service_role;
grant all on public.volunteer_route_rule_versions to service_role;
grant all on public.volunteer_match_sessions to service_role;
grant all on public.volunteer_match_results to service_role;
grant all on public.volunteer_match_route_programs to service_role;
grant all on public.volunteer_match_events to service_role;
grant all on public.volunteer_human_review_requests to service_role;

drop policy if exists "Public can read verified volunteer routes" on public.volunteer_routes;
create policy "Public can read verified volunteer routes" on public.volunteer_routes for select to anon, authenticated using (active is true and verification_status = 'verified');

drop policy if exists "Public can read published volunteer route rules" on public.volunteer_route_rule_versions;
create policy "Public can read published volunteer route rules" on public.volunteer_route_rule_versions for select to anon, authenticated using (
  status = 'published'
  and exists (
    select 1 from public.volunteer_routes r
    where r.id = volunteer_route_rule_versions.route_id
      and r.active is true
      and r.verification_status = 'verified'
  )
);

drop policy if exists "Public can read verified volunteer route program links" on public.volunteer_match_route_programs;
create policy "Public can read verified volunteer route program links" on public.volunteer_match_route_programs for select to anon, authenticated using (
  exists (
    select 1 from public.volunteer_routes r
    where r.id = volunteer_match_route_programs.route_id
      and r.active is true
      and r.verification_status = 'verified'
  )
  and exists (
    select 1 from public.programs p
    where p.id = volunteer_match_route_programs.program_id
      and p.verification_status = 'verified'
  )
);

-- No anon/authenticated policies are created for sessions, results, events, or human review requests.
-- Public submissions should go through server API routes that validate payloads and use the service role key.

insert into public.volunteer_routes (
  slug, name, route_family, destination_country, summary, official_url, source_url,
  source_title, source_organisation, last_verified_at, verified_by,
  verification_notes, verification_due_at, verification_status, active, display_order
) values
  (
    'weltwaerts-south-north',
    'weltwärts South-North',
    'weltwaerts_south_north',
    'Germany',
    'A development learning and exchange volunteer route for applicants from eligible countries through official sending and partner organisations.',
    'https://www.weltwaerts.de/en/finding-weltwarts-organisations.html',
    'https://www.weltwaerts.de/en/requirements-volunteers.html',
    'Requirements for Volunteering - weltwärts',
    'Engagement Global / weltwärts',
    '2026-08-19 00:00:00+00',
    'TripDoc research review',
    'The official requirements and organisation finder pages both need to be checked because active sending organisation availability can change by country.',
    '2027-02-19 00:00:00+00',
    'verified',
    true,
    10
  ),
  (
    'bundesfreiwilligendienst-bfd',
    'Bundesfreiwilligendienst (BFD)',
    'bfd',
    'Germany',
    'German Federal Volunteer Service route with placement requirements set by recognised deployment sites.',
    'https://www.arbeitsagentur.de/bildung/uebergangszeit/bundesfreiwilligendienst',
    'https://www.arbeitsagentur.de/bildung/uebergangszeit/bundesfreiwilligendienst',
    'Bundesfreiwilligendienst (BFD) - Bundesagentur für Arbeit',
    'Bundesagentur für Arbeit',
    '2026-08-19 00:00:00+00',
    'TripDoc research review',
    'BFD has no general upper age limit in the official source reviewed, but individual placements and visa/work authorisation still need verification.',
    '2027-02-19 00:00:00+00',
    'verified',
    true,
    20
  ),
  (
    'freiwilliges-soziales-jahr-fsj',
    'Freiwilliges Soziales Jahr (FSJ)',
    'fsj',
    'Germany',
    'German youth voluntary social year route with provider and deployment-site-specific details.',
    'https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-soziales-jahr',
    'https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-soziales-jahr',
    'Freiwilliges Soziales Jahr (FSJ) - Bundesagentur für Arbeit',
    'Bundesagentur für Arbeit',
    '2026-08-19 00:00:00+00',
    'TripDoc research review',
    'FSJ is modelled separately from BFD and FÖJ. International visa/work authorisation must be verified with official/provider sources.',
    '2027-02-19 00:00:00+00',
    'verified',
    true,
    30
  ),
  (
    'freiwilliges-oekologisches-jahr-foej',
    'Freiwilliges Ökologisches Jahr (FÖJ)',
    'foej',
    'Germany',
    'German ecological voluntary year route focused on environmental, nature, climate, and animal protection placements.',
    'https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-oekologisches-jahr',
    'https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-oekologisches-jahr',
    'Freiwilliges Ökologisches Jahr (FÖJ) - Bundesagentur für Arbeit',
    'Bundesagentur für Arbeit',
    '2026-08-19 00:00:00+00',
    'TripDoc research review',
    'FÖJ is modelled separately from BFD and FSJ. The reviewed source highlights German citizenship or German work authorisation and good German.',
    '2027-02-19 00:00:00+00',
    'verified',
    true,
    40
  ),
  (
    'sci-germany-long-term-volunteering',
    'SCI Germany Long-Term Volunteering',
    'sci_long_term',
    'Germany',
    'SCI Germany long-term volunteering route for applicants from specific partner countries, with project-specific requirements.',
    'https://sci-d.de/application',
    'https://sci-d.de/application',
    'Application - SCI Deutschland',
    'SCI - Deutscher Zweig e.V.',
    '2026-08-19 00:00:00+00',
    'TripDoc research review',
    'SCI requirements are route and project specific; this seed preserves a mandatory project-specific review signal.',
    '2027-02-19 00:00:00+00',
    'verified',
    true,
    50
  )
on conflict (slug) do update set
  name = excluded.name,
  route_family = excluded.route_family,
  destination_country = excluded.destination_country,
  summary = excluded.summary,
  official_url = excluded.official_url,
  source_url = excluded.source_url,
  source_title = excluded.source_title,
  source_organisation = excluded.source_organisation,
  last_verified_at = excluded.last_verified_at,
  verified_by = excluded.verified_by,
  verification_notes = excluded.verification_notes,
  verification_due_at = excluded.verification_due_at,
  verification_status = excluded.verification_status,
  active = excluded.active,
  display_order = excluded.display_order;

insert into public.volunteer_route_rule_versions (
  route_id, version_number, status, rules_json, source_url, source_title,
  source_organisation, last_verified_at, verified_by, verification_notes,
  verification_due_at, published_at
)
select r.id, 1, 'published', $rules${
  "schemaVersion": "volunteer-match-rules-v1",
  "minimumScoreForStrongPotential": 70,
  "minimumScoreForPotential": 40,
  "routeSpecificNotes": [
    "Applicants must use the official weltwärts organisation finder and should not apply directly to German host organisations.",
    "Programme acceptance does not guarantee visa approval.",
    "The normal weltwärts age range is 18-28. The public matcher only asks whether an applicable accessibility/disability age exception may need review; it must not collect diagnosis details."
  ],
  "conditions": [
    {
      "id": "weltwaerts-age-minimum",
      "category": "age",
      "dimension": "profile_compatibility",
      "impact": "hard_blocker",
      "label": "weltwärts minimum age",
      "field": "age",
      "operator": "min",
      "value": 18,
      "sourceUrl": "https://www.weltwaerts.de/en/requirements-volunteers.html",
      "sourceTitle": "Requirements for Volunteering - weltwärts",
      "gapReason": "weltwärts normally requires applicants to be at least 18."
    },
    {
      "id": "weltwaerts-age-supported-maximum",
      "category": "age",
      "dimension": "profile_compatibility",
      "impact": "hard_blocker",
      "label": "weltwärts supported age maximum with exception path",
      "field": "age",
      "operator": "max",
      "value": 35,
      "sourceUrl": "https://www.weltwaerts.de/en/requirements-volunteers.html",
      "sourceTitle": "Requirements for Volunteering - weltwärts",
      "gapReason": "weltwärts normally uses 18-28 and only allows an exception up to age 35 in disability/impairment cases requiring verification."
    },
    {
      "id": "weltwaerts-age-exception-required",
      "category": "age",
      "dimension": "profile_compatibility",
      "impact": "hard_blocker",
      "label": "weltwärts age exception indicator for ages 29-35",
      "field": "age",
      "operator": "between_requires_boolean",
      "value": {
        "min": 29,
        "max": 35,
        "requiredField": "mayNeedAccessibilityAgeException",
        "requiredValue": true
      },
      "sourceUrl": "https://www.weltwaerts.de/en/requirements-volunteers.html",
      "sourceTitle": "Requirements for Volunteering - weltwärts",
      "gapReason": "Applicants aged 29-35 need a verified disability/impairment exception path. TripDoc should not collect diagnosis details in the public matcher."
    },
    {
      "id": "weltwaerts-age-normal-range",
      "category": "age",
      "dimension": "profile_compatibility",
      "impact": "positive_signal",
      "label": "weltwärts normal age range",
      "field": "age",
      "operator": "between",
      "value": {
        "min": 18,
        "max": 28
      },
      "sourceUrl": "https://www.weltwaerts.de/en/requirements-volunteers.html",
      "sourceTitle": "Requirements for Volunteering - weltwärts",
      "fitReason": "Your age is within the normal weltwärts 18-28 range.",
      "weight": 5
    },
    {
      "id": "weltwaerts-age-exception-review",
      "category": "age",
      "dimension": "route_compatibility",
      "impact": "human_review",
      "label": "weltwärts accessibility/disability age exception review",
      "field": "age",
      "operator": "between",
      "value": {
        "min": 29,
        "max": 35
      },
      "reviewOutcome": "needs_human_review",
      "sourceUrl": "https://www.weltwaerts.de/en/requirements-volunteers.html",
      "sourceTitle": "Requirements for Volunteering - weltwärts",
      "nextStep": "Because you are outside the normal 18-28 range, confirm whether an official accessibility/disability age exception applies through the relevant sending organisation. Do not submit diagnosis details to TripDoc's public matcher."
    },
    {
      "id": "weltwaerts-education-or-experience",
      "category": "education",
      "impact": "hard_blocker",
      "label": "School-leaving qualification, vocational training, or similar experience",
      "field": "educationLevel",
      "operator": "in",
      "value": [
        "secondary_school",
        "diploma_or_vocational",
        "bachelor",
        "master_or_higher"
      ],
      "sourceUrl": "https://www.weltwaerts.de/en/requirements-volunteers.html",
      "sourceTitle": "Requirements for Volunteering - weltwärts",
      "gapReason": "This route expects a school-leaving qualification, vocational training, or similar documented experience.",
      "dimension": "profile_compatibility"
    },
    {
      "id": "weltwaerts-german-readiness",
      "category": "language",
      "impact": "preparation_signal",
      "label": "Basic German or willingness to learn",
      "field": "germanLevel",
      "operator": "in",
      "value": [
        "learning",
        "a1",
        "a2",
        "b1_or_higher"
      ],
      "sourceUrl": "https://www.weltwaerts.de/en/requirements-volunteers.html",
      "sourceTitle": "Requirements for Volunteering - weltwärts",
      "fitReason": "You show German learning readiness, which aligns with the official personal requirements.",
      "nextStep": "Start German A1 preparation before applying through a sending organisation.",
      "weight": 20,
      "dimension": "profile_compatibility"
    },
    {
      "id": "weltwaerts-volunteer-experience",
      "category": "volunteer_experience",
      "impact": "positive_signal",
      "label": "Volunteer or civic engagement experience",
      "field": "hasVolunteerExperience",
      "operator": "boolean_is",
      "value": true,
      "sourceUrl": "https://www.weltwaerts.de/en/requirements-volunteers.html",
      "sourceTitle": "Requirements for Volunteering - weltwärts",
      "fitReason": "Your community or volunteer experience supports the civic engagement profile expected by the route.",
      "weight": 25,
      "dimension": "profile_compatibility"
    },
    {
      "id": "weltwaerts-evidence",
      "category": "evidence_of_experience",
      "impact": "preparation_signal",
      "label": "Evidence of experience",
      "field": "experienceEvidence",
      "operator": "includes_any",
      "value": [
        "reference_letter",
        "certificate",
        "organisation_contact"
      ],
      "fitReason": "You have evidence that can support your experience claim.",
      "nextStep": "Prepare references, certificates, or organisation contacts that prove your experience.",
      "weight": 15,
      "dimension": "profile_compatibility"
    },
    {
      "id": "weltwaerts-passport",
      "category": "passport_readiness",
      "impact": "preparation_signal",
      "label": "Passport readiness",
      "field": "passportReadiness",
      "operator": "in",
      "value": [
        "valid",
        "in_progress"
      ],
      "fitReason": "Your passport status is ready or already in progress.",
      "nextStep": "Start or renew your passport before application and visa preparation.",
      "weight": 10,
      "dimension": "profile_compatibility"
    },
    {
      "id": "weltwaerts-finder-check",
      "category": "sending_organisation",
      "impact": "human_review",
      "label": "Official sending organisation finder required",
      "operator": "always",
      "sourceUrl": "https://www.weltwaerts.de/en/finding-weltwarts-organisations.html",
      "sourceTitle": "Finding weltwärts organisations",
      "nextStep": "Use the official finder to confirm the correct sending organisation or partner route for your home country before applying.",
      "dimension": "placement_availability",
      "reviewOutcome": "needs_human_review"
    },
    {
      "id": "weltwaerts-visa-authority-check",
      "category": "residence",
      "dimension": "immigration_residence_feasibility",
      "impact": "human_review",
      "label": "Visa or residence decision remains independent",
      "operator": "always",
      "reviewOutcome": "needs_human_review",
      "sourceUrl": "https://www.weltwaerts.de/en/requirements-volunteers.html",
      "sourceTitle": "Requirements for Volunteering - weltwärts",
      "nextStep": "Programme fit and organisation availability do not guarantee visa or residence approval. Verify the visa/residence basis with the responsible German authority before relying on this route."
    }
  ]
}$rules$::jsonb,
'https://www.weltwaerts.de/en/requirements-volunteers.html',
'Requirements for Volunteering - weltwärts',
'Engagement Global / weltwärts',
'2026-08-19 00:00:00+00',
'TripDoc research review',
'Country availability should be verified through the official finder before route recommendations are treated as current.',
'2027-02-19 00:00:00+00',
now()
from public.volunteer_routes r
where r.slug = 'weltwaerts-south-north'
on conflict (route_id, version_number) do update set
  status = excluded.status,
  rules_json = excluded.rules_json,
  source_url = excluded.source_url,
  source_title = excluded.source_title,
  source_organisation = excluded.source_organisation,
  last_verified_at = excluded.last_verified_at,
  verified_by = excluded.verified_by,
  verification_notes = excluded.verification_notes,
  verification_due_at = excluded.verification_due_at,
  published_at = excluded.published_at;

insert into public.volunteer_route_rule_versions (
  route_id, version_number, status, rules_json, source_url, source_title,
  source_organisation, last_verified_at, verified_by, verification_notes,
  verification_due_at, published_at
)
select r.id, 1, 'published', $rules${
  "schemaVersion": "volunteer-match-rules-v1",
  "minimumScoreForStrongPotential": 70,
  "minimumScoreForPotential": 35,
  "routeSpecificNotes": [
    "BFD placement requirements can differ by recognised deployment site.",
    "International applicants must verify visa or residence/work authorisation directly with official sources and the deployment site."
  ],
  "conditions": [
    {
      "id": "bfd-min-age-school-completion-proxy",
      "category": "age",
      "impact": "hard_blocker",
      "label": "School completion age proxy",
      "field": "age",
      "operator": "min",
      "value": 15,
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/bundesfreiwilligendienst",
      "sourceTitle": "Bundesfreiwilligendienst (BFD) - Bundesagentur für Arbeit",
      "gapReason": "BFD is for people who have completed school; the MVP uses age 15 as a conservative proxy and still requires human verification.",
      "dimension": "profile_compatibility"
    },
    {
      "id": "bfd-school-completed",
      "category": "education",
      "impact": "hard_blocker",
      "label": "School time completed",
      "field": "educationLevel",
      "operator": "in",
      "value": [
        "secondary_school",
        "diploma_or_vocational",
        "bachelor",
        "master_or_higher"
      ],
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/bundesfreiwilligendienst",
      "sourceTitle": "Bundesfreiwilligendienst (BFD) - Bundesagentur für Arbeit",
      "gapReason": "The official BFD source says applicants should have completed school time.",
      "dimension": "profile_compatibility"
    },
    {
      "id": "bfd-passport",
      "category": "passport_readiness",
      "impact": "preparation_signal",
      "label": "Passport readiness",
      "field": "passportReadiness",
      "operator": "in",
      "value": [
        "valid",
        "in_progress"
      ],
      "fitReason": "Your passport status is ready or in progress.",
      "nextStep": "Prepare or renew your passport before any visa or residence process.",
      "weight": 20,
      "dimension": "profile_compatibility"
    },
    {
      "id": "bfd-german-preparation",
      "category": "language",
      "impact": "preparation_signal",
      "label": "German preparation",
      "field": "germanLevel",
      "operator": "in",
      "value": [
        "learning",
        "a1",
        "a2",
        "b1_or_higher"
      ],
      "fitReason": "You are already preparing German, which can help with German placements.",
      "nextStep": "Begin German A1 preparation and check the exact placement language requirement.",
      "weight": 20,
      "dimension": "profile_compatibility"
    },
    {
      "id": "bfd-experience",
      "category": "volunteer_experience",
      "impact": "positive_signal",
      "label": "Community or volunteer experience",
      "field": "hasVolunteerExperience",
      "operator": "boolean_is",
      "value": true,
      "fitReason": "Volunteer/community experience can strengthen a placement application.",
      "weight": 20,
      "dimension": "profile_compatibility"
    },
    {
      "id": "bfd-placement-agreement-check",
      "category": "project_specific",
      "dimension": "placement_availability",
      "impact": "human_review",
      "label": "BFD placement and agreement availability check",
      "operator": "always",
      "reviewOutcome": "needs_human_review",
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/bundesfreiwilligendienst",
      "sourceTitle": "Bundesfreiwilligendienst (BFD) - Bundesagentur für Arbeit",
      "nextStep": "Verify a current BFD deployment site, placement availability, agreement process, start date, and required documents before treating this route as available."
    },
    {
      "id": "bfd-residence-basis-check",
      "category": "residence",
      "dimension": "immigration_residence_feasibility",
      "impact": "human_review",
      "label": "BFD residence or visa basis check",
      "operator": "always",
      "reviewOutcome": "needs_human_review",
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/bundesfreiwilligendienst",
      "sourceTitle": "Bundesfreiwilligendienst (BFD) - Bundesagentur für Arbeit",
      "nextStep": "Verify the appropriate residence or visa basis directly with official authorities. This is not the same as visa sponsorship, visa support, or guaranteed visa eligibility."
    }
  ]
}$rules$::jsonb,
'https://www.arbeitsagentur.de/bildung/uebergangszeit/bundesfreiwilligendienst',
'Bundesfreiwilligendienst (BFD) - Bundesagentur für Arbeit',
'Bundesagentur für Arbeit',
'2026-08-19 00:00:00+00',
'TripDoc research review',
'BFD route seeded separately from FSJ and FÖJ because the eligibility model differs.',
'2027-02-19 00:00:00+00',
now()
from public.volunteer_routes r
where r.slug = 'bundesfreiwilligendienst-bfd'
on conflict (route_id, version_number) do update set
  status = excluded.status,
  rules_json = excluded.rules_json,
  source_url = excluded.source_url,
  source_title = excluded.source_title,
  source_organisation = excluded.source_organisation,
  last_verified_at = excluded.last_verified_at,
  verified_by = excluded.verified_by,
  verification_notes = excluded.verification_notes,
  verification_due_at = excluded.verification_due_at,
  published_at = excluded.published_at;

insert into public.volunteer_route_rule_versions (
  route_id, version_number, status, rules_json, source_url, source_title,
  source_organisation, last_verified_at, verified_by, verification_notes,
  verification_due_at, published_at
)
select r.id, 1, 'published', $rules${
  "schemaVersion": "volunteer-match-rules-v1",
  "minimumScoreForStrongPotential": 65,
  "minimumScoreForPotential": 35,
  "routeSpecificNotes": [
    "FSJ is usually organised through providers or deployment sites and can have placement-specific application details.",
    "International applicants must verify visa or residence/work authorisation before applying."
  ],
  "conditions": [
    {
      "id": "fsj-age",
      "category": "age",
      "impact": "hard_blocker",
      "label": "FSJ age range",
      "field": "age",
      "operator": "between",
      "value": {
        "min": 15,
        "max": 26
      },
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-soziales-jahr",
      "sourceTitle": "Freiwilliges Soziales Jahr (FSJ) - Bundesagentur für Arbeit",
      "gapReason": "The official source describes FSJ as for applicants at least 15 and younger than 27.",
      "dimension": "profile_compatibility"
    },
    {
      "id": "fsj-school-completed",
      "category": "education",
      "impact": "hard_blocker",
      "label": "Completed compulsory schooling",
      "field": "educationLevel",
      "operator": "in",
      "value": [
        "secondary_school",
        "diploma_or_vocational",
        "bachelor",
        "master_or_higher"
      ],
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-soziales-jahr",
      "sourceTitle": "Freiwilliges Soziales Jahr (FSJ) - Bundesagentur für Arbeit",
      "gapReason": "FSJ requires completed compulsory schooling.",
      "dimension": "profile_compatibility"
    },
    {
      "id": "fsj-social-interest",
      "category": "project_specific",
      "impact": "positive_signal",
      "label": "Social/youth/community interest",
      "field": "projectInterestAreas",
      "operator": "includes_any",
      "value": [
        "social",
        "education",
        "youth",
        "community",
        "culture"
      ],
      "fitReason": "Your interests align with common FSJ social or community placement areas.",
      "weight": 25,
      "dimension": "profile_compatibility"
    },
    {
      "id": "fsj-german-readiness",
      "category": "language",
      "impact": "preparation_signal",
      "label": "German readiness",
      "field": "germanLevel",
      "operator": "in",
      "value": [
        "learning",
        "a1",
        "a2",
        "b1_or_higher"
      ],
      "fitReason": "You are already preparing German for a German placement environment.",
      "nextStep": "Start German A1 preparation and check the exact provider language requirement.",
      "weight": 20,
      "dimension": "profile_compatibility"
    },
    {
      "id": "fsj-passport",
      "category": "passport_readiness",
      "impact": "preparation_signal",
      "label": "Passport readiness",
      "field": "passportReadiness",
      "operator": "in",
      "value": [
        "valid",
        "in_progress"
      ],
      "fitReason": "Your passport status is ready or in progress.",
      "nextStep": "Prepare or renew your passport before any visa or residence process.",
      "weight": 15,
      "dimension": "profile_compatibility"
    },
    {
      "id": "fsj-provider-placement-check",
      "category": "project_specific",
      "dimension": "placement_availability",
      "impact": "human_review",
      "label": "FSJ provider and placement availability check",
      "operator": "always",
      "reviewOutcome": "needs_human_review",
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-soziales-jahr",
      "sourceTitle": "Freiwilliges Soziales Jahr (FSJ) - Bundesagentur für Arbeit",
      "nextStep": "Verify the recognised FSJ provider, deployment site, application timeline, start date, and required documents before treating this route as available."
    },
    {
      "id": "fsj-residence-work-authorisation-check",
      "category": "residence",
      "dimension": "immigration_residence_feasibility",
      "impact": "human_review",
      "label": "FSJ residence or work-authorisation check",
      "operator": "always",
      "reviewOutcome": "needs_human_review",
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-soziales-jahr",
      "sourceTitle": "Freiwilliges Soziales Jahr (FSJ) - Bundesagentur für Arbeit",
      "nextStep": "Verify the correct residence, visa, or work-authorisation basis with official authorities. Do not treat provider interest as visa sponsorship or visa approval."
    }
  ]
}$rules$::jsonb,
'https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-soziales-jahr',
'Freiwilliges Soziales Jahr (FSJ) - Bundesagentur für Arbeit',
'Bundesagentur für Arbeit',
'2026-08-19 00:00:00+00',
'TripDoc research review',
'FSJ seeded as its own route; do not link it to the grouped TripDoc BFD/FSJ/FÖJ program until the existing title/slug issue is reviewed.',
'2027-02-19 00:00:00+00',
now()
from public.volunteer_routes r
where r.slug = 'freiwilliges-soziales-jahr-fsj'
on conflict (route_id, version_number) do update set
  status = excluded.status,
  rules_json = excluded.rules_json,
  source_url = excluded.source_url,
  source_title = excluded.source_title,
  source_organisation = excluded.source_organisation,
  last_verified_at = excluded.last_verified_at,
  verified_by = excluded.verified_by,
  verification_notes = excluded.verification_notes,
  verification_due_at = excluded.verification_due_at,
  published_at = excluded.published_at;

insert into public.volunteer_route_rule_versions (
  route_id, version_number, status, rules_json, source_url, source_title,
  source_organisation, last_verified_at, verified_by, verification_notes,
  verification_due_at, published_at
)
select r.id, 1, 'published', $rules${
  "schemaVersion": "volunteer-match-rules-v1",
  "minimumScoreForStrongPotential": 65,
  "minimumScoreForPotential": 35,
  "routeSpecificNotes": [
    "FÖJ providers and placements can have specific application timelines and requirements.",
    "International applicants must verify German work authorisation and language expectations directly."
  ],
  "conditions": [
    {
      "id": "foej-age",
      "category": "age",
      "impact": "hard_blocker",
      "label": "FÖJ age range",
      "field": "age",
      "operator": "between",
      "value": {
        "min": 15,
        "max": 26
      },
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-oekologisches-jahr",
      "sourceTitle": "Freiwilliges Ökologisches Jahr (FÖJ) - Bundesagentur für Arbeit",
      "gapReason": "The official source describes FÖJ as for applicants between 15 and 26.",
      "dimension": "profile_compatibility"
    },
    {
      "id": "foej-school-completed",
      "category": "education",
      "impact": "hard_blocker",
      "label": "School qualification",
      "field": "educationLevel",
      "operator": "in",
      "value": [
        "secondary_school",
        "diploma_or_vocational",
        "bachelor",
        "master_or_higher"
      ],
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-oekologisches-jahr",
      "sourceTitle": "Freiwilliges Ökologisches Jahr (FÖJ) - Bundesagentur für Arbeit",
      "gapReason": "The official source expects a school qualification.",
      "dimension": "profile_compatibility"
    },
    {
      "id": "foej-environment-interest",
      "category": "project_specific",
      "impact": "positive_signal",
      "label": "Environmental interest",
      "field": "projectInterestAreas",
      "operator": "includes_any",
      "value": [
        "environment",
        "community",
        "education"
      ],
      "fitReason": "Your interests align with environmental or ecological placement areas.",
      "weight": 25,
      "dimension": "profile_compatibility"
    },
    {
      "id": "foej-provider-placement-check",
      "category": "project_specific",
      "dimension": "placement_availability",
      "impact": "human_review",
      "label": "FÖJ provider and ecological placement availability check",
      "operator": "always",
      "reviewOutcome": "needs_human_review",
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-oekologisches-jahr",
      "sourceTitle": "Freiwilliges Ökologisches Jahr (FÖJ) - Bundesagentur für Arbeit",
      "nextStep": "Verify the recognised FÖJ provider, ecological placement availability, application timeline, start date, and required documents before treating this route as available."
    },
    {
      "id": "foej-german-good",
      "category": "language",
      "impact": "preparation_signal",
      "label": "Good German readiness",
      "field": "germanLevel",
      "operator": "in",
      "value": [
        "a2",
        "b1_or_higher"
      ],
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-oekologisches-jahr",
      "sourceTitle": "Freiwilliges Ökologisches Jahr (FÖJ) - Bundesagentur für Arbeit",
      "fitReason": "You show stronger German readiness for an FÖJ environment.",
      "nextStep": "Improve German and verify the exact provider language requirement.",
      "weight": 20,
      "dimension": "profile_compatibility"
    },
    {
      "id": "foej-work-authorisation-check",
      "category": "residence",
      "impact": "human_review",
      "label": "German citizenship or work authorisation check",
      "operator": "always",
      "sourceUrl": "https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-oekologisches-jahr",
      "sourceTitle": "Freiwilliges Ökologisches Jahr (FÖJ) - Bundesagentur für Arbeit",
      "nextStep": "Verify German citizenship, residence, work authorisation, visa route, and placement requirements before applying.",
      "dimension": "immigration_residence_feasibility",
      "reviewOutcome": "needs_human_review"
    }
  ]
}$rules$::jsonb,
'https://www.arbeitsagentur.de/bildung/uebergangszeit/freiwilliges-oekologisches-jahr',
'Freiwilliges Ökologisches Jahr (FÖJ) - Bundesagentur für Arbeit',
'Bundesagentur für Arbeit',
'2026-08-19 00:00:00+00',
'TripDoc research review',
'FÖJ seeded separately because it has ecological focus and clearer German/work-authorisation language in the reviewed source.',
'2027-02-19 00:00:00+00',
now()
from public.volunteer_routes r
where r.slug = 'freiwilliges-oekologisches-jahr-foej'
on conflict (route_id, version_number) do update set
  status = excluded.status,
  rules_json = excluded.rules_json,
  source_url = excluded.source_url,
  source_title = excluded.source_title,
  source_organisation = excluded.source_organisation,
  last_verified_at = excluded.last_verified_at,
  verified_by = excluded.verified_by,
  verification_notes = excluded.verification_notes,
  verification_due_at = excluded.verification_due_at,
  published_at = excluded.published_at;

insert into public.volunteer_route_rule_versions (
  route_id, version_number, status, rules_json, source_url, source_title,
  source_organisation, last_verified_at, verified_by, verification_notes,
  verification_due_at, published_at
)
select r.id, 1, 'published', $rules${
  "schemaVersion": "volunteer-match-rules-v1",
  "minimumScoreForStrongPotential": 75,
  "minimumScoreForPotential": 40,
  "routeSpecificNotes": [
    "SCI Germany states that further specific requirements may apply for some projects.",
    "The route is limited to listed partner countries in the reviewed official source.",
    "SCI Germany normally lists 18-29, justified exceptions up to age 34, and project-specific age limits. A verified project-specific source may override the base age rule."
  ],
  "conditions": [
    {
      "id": "sci-age-minimum",
      "category": "age",
      "dimension": "profile_compatibility",
      "impact": "hard_blocker",
      "label": "SCI minimum age",
      "field": "age",
      "operator": "min",
      "value": 18,
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "gapReason": "SCI Germany lists 18 as the normal minimum age."
    },
    {
      "id": "sci-age-supported-maximum",
      "category": "age",
      "dimension": "profile_compatibility",
      "impact": "hard_blocker",
      "label": "SCI base supported age maximum",
      "field": "age",
      "operator": "max",
      "value": 34,
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "gapReason": "SCI Germany normally lists 18-29 and justified exceptions up to age 34. Older applicants need a verified project-specific exception source before this can be treated as possible."
    },
    {
      "id": "sci-age-normal-range",
      "category": "age",
      "dimension": "profile_compatibility",
      "impact": "positive_signal",
      "label": "SCI normal age range",
      "field": "age",
      "operator": "between",
      "value": {
        "min": 18,
        "max": 29
      },
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "fitReason": "Your age is within the normal SCI Germany 18-29 range.",
      "weight": 5
    },
    {
      "id": "sci-age-exception-review",
      "category": "age",
      "dimension": "placement_availability",
      "impact": "human_review",
      "label": "SCI age exception or project-specific age review",
      "field": "age",
      "operator": "between",
      "value": {
        "min": 30,
        "max": 34
      },
      "reviewOutcome": "needs_human_review",
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "nextStep": "Because you are outside the normal 18-29 range, verify whether SCI or the exact project can justify an age exception up to 34. Individual projects may also publish their own age limits."
    },
    {
      "id": "sci-citizenship-partner-country",
      "category": "citizenship",
      "impact": "hard_blocker",
      "label": "SCI partner country citizenship",
      "field": "citizenship",
      "operator": "in",
      "value": [
        "Cambodia",
        "Ecuador",
        "India",
        "Nigeria",
        "Sri Lanka",
        "Thailand",
        "Togo",
        "Tanzania",
        "Uganda",
        "Vietnam"
      ],
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "gapReason": "The reviewed SCI Germany source lists specific partner countries for the long-term volunteering route.",
      "dimension": "route_compatibility"
    },
    {
      "id": "sci-residence-partner-country",
      "category": "residence",
      "impact": "hard_blocker",
      "label": "Living in a listed partner country",
      "field": "residenceCountry",
      "operator": "in",
      "value": [
        "Cambodia",
        "Ecuador",
        "India",
        "Nigeria",
        "Sri Lanka",
        "Thailand",
        "Togo",
        "Tanzania",
        "Uganda",
        "Vietnam"
      ],
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "gapReason": "SCI Germany describes the programme as open to volunteers living in the listed partner countries.",
      "dimension": "route_compatibility"
    },
    {
      "id": "sci-sending-organisation",
      "category": "sending_organisation",
      "impact": "preparation_signal",
      "label": "Active in sending/partner or volunteer organisation",
      "field": "hasSendingOrganisationConnection",
      "operator": "boolean_is",
      "value": true,
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "fitReason": "You already have a sending/partner or volunteer organisation connection.",
      "nextStep": "Contact the recognised sending organisation in your country before applying.",
      "weight": 25,
      "dimension": "placement_availability"
    },
    {
      "id": "sci-english-working",
      "category": "language",
      "impact": "hard_blocker",
      "label": "Working English",
      "field": "englishLevel",
      "operator": "in",
      "value": [
        "working",
        "fluent"
      ],
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "gapReason": "SCI Germany lists working English as a requirement.",
      "dimension": "profile_compatibility"
    },
    {
      "id": "sci-german-motivation",
      "category": "language",
      "impact": "preparation_signal",
      "label": "German learning motivation/readiness",
      "field": "germanLevel",
      "operator": "in",
      "value": [
        "learning",
        "a1",
        "a2",
        "b1_or_higher"
      ],
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "fitReason": "You show German learning readiness; most SCI projects require at least A1 at the start, and some require A2/B1.",
      "nextStep": "Start German A1 preparation and verify the exact project language requirement.",
      "weight": 20,
      "dimension": "profile_compatibility"
    },
    {
      "id": "sci-volunteer-experience",
      "category": "volunteer_experience",
      "impact": "positive_signal",
      "label": "Volunteer/community organisation experience",
      "field": "hasVolunteerExperience",
      "operator": "boolean_is",
      "value": true,
      "fitReason": "Your volunteer/community background supports the SCI profile.",
      "weight": 20,
      "dimension": "profile_compatibility"
    },
    {
      "id": "sci-project-specific-review",
      "category": "project_specific",
      "impact": "human_review",
      "label": "Project-specific requirements may apply",
      "operator": "always",
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "nextStep": "Check the exact SCI project, sending organisation, German level, age limits, and timeline before treating this as a final fit.",
      "dimension": "placement_availability",
      "reviewOutcome": "needs_human_review"
    },
    {
      "id": "sci-visa-residence-check",
      "category": "residence",
      "dimension": "immigration_residence_feasibility",
      "impact": "human_review",
      "label": "SCI visa or residence feasibility check",
      "operator": "always",
      "reviewOutcome": "needs_human_review",
      "sourceUrl": "https://sci-d.de/application",
      "sourceTitle": "Application - SCI Deutschland",
      "nextStep": "Verify the visa or residence basis for the exact SCI project and sending organisation. Project acceptance is not the same as visa sponsorship, visa eligibility, or residence permit approval."
    }
  ],
  "projectSpecificOverrides": [
    {
      "appliesToConditionIds": [
        "sci-age-supported-maximum"
      ],
      "dimension": "placement_availability",
      "requiresVerifiedSource": true,
      "note": "Individual SCI projects may publish different age limits. Override the base route age maximum only with a verified project-specific source."
    }
  ]
}$rules$::jsonb,
'https://sci-d.de/application',
'Application - SCI Deutschland',
'SCI - Deutscher Zweig e.V.',
'2026-08-19 00:00:00+00',
'TripDoc research review',
'SCI seed uses project-specific review and does not assume all SCI placements have identical rules.',
'2027-02-19 00:00:00+00',
now()
from public.volunteer_routes r
where r.slug = 'sci-germany-long-term-volunteering'
on conflict (route_id, version_number) do update set
  status = excluded.status,
  rules_json = excluded.rules_json,
  source_url = excluded.source_url,
  source_title = excluded.source_title,
  source_organisation = excluded.source_organisation,
  last_verified_at = excluded.last_verified_at,
  verified_by = excluded.verified_by,
  verification_notes = excluded.verification_notes,
  verification_due_at = excluded.verification_due_at,
  published_at = excluded.published_at;

-- Intentionally no seed rows are added to volunteer_match_route_programs in Phase 1.
-- Existing TripDoc volunteer programme records need review before matching routes are linked to /programs records.

notify pgrst, 'reload schema';
