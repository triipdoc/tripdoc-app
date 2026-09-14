alter table public.volunteer_match_events
  drop constraint if exists volunteer_match_events_event_name_check;

alter table public.volunteer_match_events
  add constraint volunteer_match_events_event_name_check
  check (
    event_name in (
      'volunteer_match_viewed',
      'volunteer_match_started',
      'volunteer_match_completed',
      'volunteer_match_result',
      'matching_opportunity_clicked',
      'human_review_clicked',
      'human_review_submitted'
    )
  );

create index if not exists volunteer_match_events_event_name_created_at_idx
  on public.volunteer_match_events(event_name, created_at desc);

create index if not exists volunteer_match_results_created_at_idx
  on public.volunteer_match_results(created_at desc);

create or replace function public.get_volunteer_match_admin_analytics(
  range_start timestamp with time zone default null,
  result_limit integer default 5
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with safe_limit as (
  select greatest(coalesce(result_limit, 5), 1) as value
),
filtered_events as (
  select
    event_name,
    session_id,
    route_id,
    program_id,
    acquisition_source,
    metadata,
    created_at
  from public.volunteer_match_events
  where created_at is not null
    and (
      range_start is null
      or created_at >= range_start
    )
),
filtered_sessions as (
  select
    id,
    acquisition_source,
    answers_json,
    status,
    created_at
  from public.volunteer_match_sessions
  where created_at is not null
    and (
      range_start is null
      or created_at >= range_start
    )
),
event_totals as (
  select
    count(*) filter (where event_name = 'volunteer_match_viewed')::integer as total_views,
    count(*) filter (where event_name = 'volunteer_match_started')::integer as total_started,
    count(*) filter (where event_name = 'volunteer_match_completed')::integer as total_completed,
    count(*) filter (where event_name = 'matching_opportunity_clicked')::integer as matching_opportunity_clicks,
    count(*) filter (where event_name = 'human_review_clicked')::integer as human_review_clicks,
    count(*) filter (where event_name = 'human_review_submitted')::integer as human_review_submissions
  from filtered_events
),
top_acquisition_sources as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', ranked.label,
        'count', ranked.event_count
      )
      order by ranked.event_count desc, ranked.label asc
    ),
    '[]'::jsonb
  ) as rows
  from (
    select
      coalesce(nullif(btrim(acquisition_source), ''), 'unknown') as label,
      count(*)::integer as event_count
    from filtered_events
    where event_name = 'volunteer_match_viewed'
    group by coalesce(nullif(btrim(acquisition_source), ''), 'unknown')
    order by event_count desc, label asc
    limit (select value from safe_limit)
  ) ranked
),
top_countries as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', ranked.label,
        'count', ranked.session_count
      )
      order by ranked.session_count desc, ranked.label asc
    ),
    '[]'::jsonb
  ) as rows
  from (
    select
      coalesce(nullif(btrim(answers_json->>'residenceCountry'), ''), 'unknown') as label,
      count(*)::integer as session_count
    from filtered_sessions
    where status = 'completed'
    group by coalesce(nullif(btrim(answers_json->>'residenceCountry'), ''), 'unknown')
    order by session_count desc, label asc
    limit (select value from safe_limit)
  ) ranked
),
ranked_route_results as (
  select
    vmr.session_id,
    vmr.route_id,
    coalesce(vr.slug, '') as route_slug,
    coalesce(vr.name, 'Unknown Route') as route_name,
    row_number() over (
      partition by vmr.session_id
      order by
        case vmr.verdict
          when 'Strong Potential' then 1
          when 'Potential — Preparation Needed' then 2
          when 'Currently Weak Fit' then 3
          when 'Needs Human Review' then 4
          else 5
        end asc,
        coalesce(vmr.internal_score, 0) desc,
        (
          coalesce(jsonb_array_length(vmr.next_steps_json), 0) +
          coalesce(jsonb_array_length(vmr.human_review_reasons_json), 0)
        ) asc,
        coalesce(vr.name, 'Unknown Route') asc
    ) as route_rank
  from public.volunteer_match_results vmr
  join filtered_sessions fs on fs.id = vmr.session_id
  left join public.volunteer_routes vr on vr.id = vmr.route_id
  where fs.status = 'completed'
),
top_recommended_routes as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'route_id', ranked.route_id,
        'route_slug', ranked.route_slug,
        'route_name', ranked.route_name,
        'count', ranked.route_count
      )
      order by ranked.route_count desc, ranked.route_name asc
    ),
    '[]'::jsonb
  ) as rows
  from (
    select
      route_id,
      route_slug,
      route_name,
      count(*)::integer as route_count
    from ranked_route_results
    where route_rank = 1
    group by route_id, route_slug, route_name
    order by route_count desc, route_name asc
    limit (select value from safe_limit)
  ) ranked
)
select jsonb_build_object(
  'totalViews', event_totals.total_views,
  'totalStarted', event_totals.total_started,
  'totalCompleted', event_totals.total_completed,
  'matchingOpportunityClicks', event_totals.matching_opportunity_clicks,
  'humanReviewClicks', event_totals.human_review_clicks,
  'humanReviewSubmissions', event_totals.human_review_submissions,
  'topAcquisitionSources', top_acquisition_sources.rows,
  'topCountries', top_countries.rows,
  'topRecommendedRoutes', top_recommended_routes.rows
)
from event_totals, top_acquisition_sources, top_countries, top_recommended_routes;
$$;

grant execute on function public.get_volunteer_match_admin_analytics(timestamp with time zone, integer)
to service_role;

notify pgrst, 'reload schema';
