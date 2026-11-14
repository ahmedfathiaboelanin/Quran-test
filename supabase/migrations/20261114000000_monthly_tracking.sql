-- ============================================================================
-- Monthly memorization tracking
-- ----------------------------------------------------------------------------
-- Apply this migration with the Supabase CLI:
--   supabase db push
-- or paste it into the Supabase SQL editor.
--
-- Security model
--   RLS is enabled on every table. The application signs in anonymously (or
--   with any regular Supabase session), so all policies target the
--   `authenticated` role. Enable "Anonymous Sign-ins" in Supabase Auth for the
--   no-login flow used by this PWA. If several independent examiners will share
--   the same project, add an `owner_id` column and scope these policies to
--   `auth.uid()`.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- updated_at helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- examinees
-- ----------------------------------------------------------------------------
create table public.examinees (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  default_amount numeric not null default 0 check (default_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.examinees is 'People whose monthly memorization is tracked.';
comment on column public.examinees.default_amount is
  'Default fee copied into each new monthly_records row; editable per month.';

-- ----------------------------------------------------------------------------
-- monthly_sheets
-- ----------------------------------------------------------------------------
create table public.monthly_sheets (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  has_fifth_week boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.monthly_sheets is 'One monthly tracking sheet, e.g. Jumada al-Akhirah 1448.';

-- ----------------------------------------------------------------------------
-- monthly_records
-- ----------------------------------------------------------------------------
create table public.monthly_records (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.monthly_sheets(id) on delete cascade,
  examinee_id uuid not null references public.examinees(id) on delete cascade,
  week_1 integer check (week_1 is null or week_1 >= 0),
  week_2 integer check (week_2 is null or week_2 >= 0),
  week_3 integer check (week_3 is null or week_3 >= 0),
  week_4 integer check (week_4 is null or week_4 >= 0),
  week_5 integer check (week_5 is null or week_5 >= 0),
  monthly_exam integer check (monthly_exam is null or monthly_exam >= 0),
  amount numeric not null check (amount >= 0),
  updated_at timestamptz not null default now(),
  constraint monthly_records_sheet_examinee_key unique (sheet_id, examinee_id),
  -- Drop the highest recorded weekly mistake count, then add the monthly exam.
  -- Null treated as 0; when every week is null the total is the monthly exam.
  total_mistakes integer generated always as (
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
  ) stored
);

comment on table public.monthly_records is
  'Weekly mistake counts, monthly exam score, fee and auto-calculated total for one examinee in one sheet.';
comment on column public.monthly_records.total_mistakes is
  'Generated: sum of recorded weeks minus the highest week, plus monthly_exam.';

create index monthly_records_sheet_id_idx
  on public.monthly_records (sheet_id);

create index monthly_records_examinee_id_idx
  on public.monthly_records (examinee_id);

create index monthly_sheets_created_at_idx
  on public.monthly_sheets (created_at desc);

create index examinees_active_idx
  on public.examinees (is_active);

create trigger monthly_records_set_updated_at
before update on public.monthly_records
for each row
execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.examinees enable row level security;
alter table public.monthly_sheets enable row level security;
alter table public.monthly_records enable row level security;

create policy "Authenticated examiners can manage examinees"
  on public.examinees
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated examiners can manage monthly sheets"
  on public.monthly_sheets
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated examiners can manage monthly records"
  on public.monthly_records
  for all
  to authenticated
  using (true)
  with check (true);

-- The anon role must not reach these tables directly. The app obtains an
-- authenticated (anonymous) Supabase session before issuing queries.
revoke all on table public.examinees from anon;
revoke all on table public.monthly_sheets from anon;
revoke all on table public.monthly_records from anon;

grant select, insert, update, delete on table public.examinees to authenticated;
grant select, insert, update, delete on table public.monthly_sheets to authenticated;
grant select, insert, update, delete on table public.monthly_records to authenticated;
