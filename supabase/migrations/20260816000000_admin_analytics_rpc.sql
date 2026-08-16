create or replace function public.get_admin_analytics(
  range_start timestamp without time zone default null,
  result_limit integer default 5
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with filtered_clicks as (
  select
    c.program_id,
    c.action,
    c.created_at
  from public.clicks c
  where c.created_at is not null
    and (
      range_start is null
      or c.created_at >= range_start
    )
),
safe_limit as (
  select greatest(coalesce(result_limit, 5), 1) as value
),
totals as (
  select
    count(*)::integer as total_clicks,
    count(*) filter (where action = 'apply_now')::integer as total_apply_clicks,
    count(*) filter (where action = 'copy_link')::integer as total_copy_clicks
  from filtered_clicks
),
top_clicked as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'program_id', ranked.program_id,
        'title', ranked.title,
        'count', ranked.click_count
      )
      order by ranked.click_count desc, ranked.title asc
    ),
    '[]'::jsonb
  ) as rows
  from (
    select
      fc.program_id,
      coalesce(p.title, 'Unknown Program') as title,
      count(*)::integer as click_count
    from filtered_clicks fc
    left join public.programs p on p.id = fc.program_id
    where fc.program_id is not null
    group by fc.program_id, p.title
    order by click_count desc, title asc
    limit (select value from safe_limit)
  ) ranked
),
top_applied as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'program_id', ranked.program_id,
        'title', ranked.title,
        'count', ranked.click_count
      )
      order by ranked.click_count desc, ranked.title asc
    ),
    '[]'::jsonb
  ) as rows
  from (
    select
      fc.program_id,
      coalesce(p.title, 'Unknown Program') as title,
      count(*)::integer as click_count
    from filtered_clicks fc
    left join public.programs p on p.id = fc.program_id
    where fc.program_id is not null
      and fc.action = 'apply_now'
    group by fc.program_id, p.title
    order by click_count desc, title asc
    limit (select value from safe_limit)
  ) ranked
),
top_shared as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'program_id', ranked.program_id,
        'title', ranked.title,
        'count', ranked.click_count
      )
      order by ranked.click_count desc, ranked.title asc
    ),
    '[]'::jsonb
  ) as rows
  from (
    select
      fc.program_id,
      coalesce(p.title, 'Unknown Program') as title,
      count(*)::integer as click_count
    from filtered_clicks fc
    left join public.programs p on p.id = fc.program_id
    where fc.program_id is not null
      and fc.action = 'copy_link'
    group by fc.program_id, p.title
    order by click_count desc, title asc
    limit (select value from safe_limit)
  ) ranked
),
top_countries as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', ranked.label,
        'count', ranked.click_count
      )
      order by ranked.click_count desc, ranked.label asc
    ),
    '[]'::jsonb
  ) as rows
  from (
    select
      coalesce(nullif(btrim(p.country), ''), 'Unknown') as label,
      count(*)::integer as click_count
    from filtered_clicks fc
    join public.programs p on p.id = fc.program_id
    where fc.program_id is not null
    group by coalesce(nullif(btrim(p.country), ''), 'Unknown')
    order by click_count desc, label asc
    limit (select value from safe_limit)
  ) ranked
),
top_opportunity_types as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', ranked.label,
        'count', ranked.click_count
      )
      order by ranked.click_count desc, ranked.label asc
    ),
    '[]'::jsonb
  ) as rows
  from (
    select
      coalesce(nullif(btrim(p.type), ''), 'Unknown') as label,
      count(*)::integer as click_count
    from filtered_clicks fc
    join public.programs p on p.id = fc.program_id
    where fc.program_id is not null
    group by coalesce(nullif(btrim(p.type), ''), 'Unknown')
    order by click_count desc, label asc
    limit (select value from safe_limit)
  ) ranked
)
select jsonb_build_object(
  'totalClicks', totals.total_clicks,
  'totalApplyClicks', totals.total_apply_clicks,
  'totalCopyClicks', totals.total_copy_clicks,
  'topClicked', top_clicked.rows,
  'topApplied', top_applied.rows,
  'topShared', top_shared.rows,
  'topCountries', top_countries.rows,
  'topOpportunityTypes', top_opportunity_types.rows
)
from totals, top_clicked, top_applied, top_shared, top_countries, top_opportunity_types;
$$;

grant execute on function public.get_admin_analytics(timestamp without time zone, integer)
to service_role;

notify pgrst, 'reload schema';
