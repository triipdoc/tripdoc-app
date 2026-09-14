-- Follow-up compatibility fixes found during the production smoke test.
begin;

-- Drafts require only a title and slug in the application. The legacy schema
-- required type, which prevented intentionally incomplete drafts from saving.
alter table public.programs
  alter column type drop not null;

-- Keep future history entries focused on values that actually exist. Changes
-- from a value to NULL are still recorded because the key remains in the old
-- row while it is absent from the new, null-stripped row.
create or replace function public.program_admin_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare previous jsonb; current_values jsonb; fields text[];
begin
  previous := case
    when tg_op = 'INSERT' then '{}'::jsonb
    else jsonb_strip_nulls(to_jsonb(old))
  end;
  current_values := case
    when tg_op = 'DELETE' then '{}'::jsonb
    else jsonb_strip_nulls(to_jsonb(new))
  end;
  select coalesce(array_agg(k order by k), '{}'::text[]) into fields
  from (select jsonb_object_keys(previous || current_values) k) keys
  where k <> 'admin_version'
    and (previous -> k) is distinct from (current_values -> k);
  if cardinality(fields) > 0 then
    insert into public.program_change_history(program_id, actor, action, changed_fields, previous_values, new_values)
    values (
      case when tg_op = 'DELETE' then null else new.id end,
      'shared-admin',
      case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end,
      fields,
      previous,
      current_values
    );
  end if;
  return null;
end $$;

revoke all on function public.program_admin_audit() from public, anon, authenticated;

commit;
