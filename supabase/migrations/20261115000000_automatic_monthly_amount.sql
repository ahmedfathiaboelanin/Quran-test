-- The monthly amount is now derived automatically from the total mistakes and
-- may be negative (a penalty). Existing databases still enforce amount >= 0.
alter table public.monthly_records
  drop constraint if exists monthly_records_amount_check;

comment on column public.monthly_records.amount is
  'Automatic reward/penalty derived from total_mistakes; may be negative.';

comment on column public.examinees.default_amount is
  'Legacy default retained for compatibility; monthly amounts are generated from the total.';

-- Backfill every existing row with the same rule used by the dashboard:
--   0 → +500, up to 1 → +200, below 3 → 0, below 4 → -100,
--   below 5 → -150, below 6 → -250, otherwise -(total × 100).
update public.monthly_records
set amount = case
  when total_mistakes = 0 then 500
  when total_mistakes <= 1 then 200
  when total_mistakes < 3 then 0
  when total_mistakes < 4 then -100
  when total_mistakes < 5 then -150
  when total_mistakes < 6 then -250
  else -total_mistakes * 100
end;
