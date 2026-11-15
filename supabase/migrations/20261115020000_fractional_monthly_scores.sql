-- Monthly score cells can now hold fractional values (for example 2.5 or
-- 3.75). The original schema stored them as integers, so widen the base
-- columns and rebuild the generated total with matching precision.

-- The generated column depends on the base score columns and must be removed
-- before their types can be changed.
alter table public.monthly_records
  drop column if exists total_mistakes;

alter table public.monthly_records
  alter column week_1 type numeric(10, 2) using week_1::numeric(10, 2),
  alter column week_2 type numeric(10, 2) using week_2::numeric(10, 2),
  alter column week_3 type numeric(10, 2) using week_3::numeric(10, 2),
  alter column week_4 type numeric(10, 2) using week_4::numeric(10, 2),
  alter column week_5 type numeric(10, 2) using week_5::numeric(10, 2),
  alter column monthly_exam type numeric(10, 2) using monthly_exam::numeric(10, 2);

alter table public.monthly_records
  add column total_mistakes numeric(10, 2) generated always as (
    (
      coalesce(week_1, 0) +
      coalesce(week_2, 0) +
      coalesce(week_3, 0) +
      coalesce(week_4, 0) +
      coalesce(week_5, 0)
    )
    - greatest(
        coalesce(week_1, 0),
        coalesce(week_2, 0),
        coalesce(week_3, 0),
        coalesce(week_4, 0),
        coalesce(week_5, 0)
      )
    + coalesce(monthly_exam, 0)
  ) stored;

comment on column public.monthly_records.total_mistakes is
  'Generated: sum of recorded weeks minus the highest week, plus monthly_exam; fractional scores are supported.';

comment on column public.monthly_records.week_1 is 'Week 1 mistakes; fractional values are supported.';
comment on column public.monthly_records.week_2 is 'Week 2 mistakes; fractional values are supported.';
comment on column public.monthly_records.week_3 is 'Week 3 mistakes; fractional values are supported.';
comment on column public.monthly_records.week_4 is 'Week 4 mistakes; fractional values are supported.';
comment on column public.monthly_records.week_5 is 'Week 5 mistakes; fractional values are supported.';
comment on column public.monthly_records.monthly_exam is 'Monthly review score; fractional values are supported.';
