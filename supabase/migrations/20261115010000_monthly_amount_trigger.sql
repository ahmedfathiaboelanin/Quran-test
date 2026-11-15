-- Keep the stored monthly amount in sync with the scores at the database level.
-- This replaces the client-side amount write, so older databases that still
-- enforce `amount >= 0` no longer reject penalty values such as -100 or -150.

-- 1. Drop every legacy check constraint that references the amount column.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'monthly_records'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%amount%'
  loop
    execute format(
      'alter table public.monthly_records drop constraint %I',
      constraint_name
    );
  end loop;
end $$;

-- 2. Single source of truth for the reward/penalty rule.
create or replace function public.monthly_amount_for_total(total numeric)
returns numeric
language sql
immutable
as $$
  select case
    when total = 0 then 500::numeric
    when total <= 1 then 200::numeric
    when total < 3 then 0::numeric
    when total < 4 then -100::numeric
    when total < 5 then -150::numeric
    when total < 6 then -250::numeric
    else -(total * 100)
  end;
$$;

-- 3. Derive the amount before every insert/update. The weekly total is
--    recalculated from the base score columns because generated columns are
--    not available to BEFORE triggers.
create or replace function public.set_monthly_record_amount()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.amount := public.monthly_amount_for_total(
    coalesce(new.week_1, 0) +
    coalesce(new.week_2, 0) +
    coalesce(new.week_3, 0) +
    coalesce(new.week_4, 0) +
    coalesce(new.week_5, 0) -
    greatest(
      coalesce(new.week_1, 0),
      coalesce(new.week_2, 0),
      coalesce(new.week_3, 0),
      coalesce(new.week_4, 0),
      coalesce(new.week_5, 0)
    ) +
    coalesce(new.monthly_exam, 0)
  );
  return new;
end;
$$;

-- Inserting without an explicit amount is now safe.
alter table public.monthly_records
  alter column amount set default 0;

-- 4. Backfill existing rows using the same rule.
update public.monthly_records
set amount = public.monthly_amount_for_total(total_mistakes);

-- 5. Future inserts and score edits are handled by the trigger.
drop trigger if exists monthly_records_set_amount on public.monthly_records;
create trigger monthly_records_set_amount
before insert or update on public.monthly_records
for each row
execute function public.set_monthly_record_amount();

comment on column public.monthly_records.amount is
  'Automatic reward/penalty derived from total_mistakes and maintained by trigger; may be negative.';
