-- New examinees start with a zero monthly amount unless the examiner changes it.
-- This keeps databases created from the original migration in sync.
alter table public.examinees
  alter column default_amount set default 0;
