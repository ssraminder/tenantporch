-- Add move-in date, first rent due date, and rent due day to rp_leases.
-- rent_due_day is an integer 1..31 representing the day of the month rent
-- is due (e.g. 1 -> "1st of every month", 15 -> "15th of every month").

ALTER TABLE public.rp_leases
  ADD COLUMN IF NOT EXISTS move_in_date DATE,
  ADD COLUMN IF NOT EXISTS first_rent_due_date DATE,
  ADD COLUMN IF NOT EXISTS rent_due_day SMALLINT;

ALTER TABLE public.rp_leases
  DROP CONSTRAINT IF EXISTS rp_leases_rent_due_day_chk;

ALTER TABLE public.rp_leases
  ADD CONSTRAINT rp_leases_rent_due_day_chk
    CHECK (rent_due_day IS NULL OR (rent_due_day BETWEEN 1 AND 31));

COMMENT ON COLUMN public.rp_leases.move_in_date IS
  'Calendar day the tenant takes possession; may differ from start_date.';
COMMENT ON COLUMN public.rp_leases.first_rent_due_date IS
  'Date on which the first rent payment is due (often the same as move_in_date).';
COMMENT ON COLUMN public.rp_leases.rent_due_day IS
  'Day of the month rent recurs (1..31). Rendered as "1st of every month" etc.';

-- Backfill: for existing rows where these are NULL, default to the lease start_date
-- and the day-of-month from start_date. This is non-destructive.
UPDATE public.rp_leases
SET
  move_in_date        = COALESCE(move_in_date, start_date),
  first_rent_due_date = COALESCE(first_rent_due_date, start_date),
  rent_due_day        = COALESCE(rent_due_day, EXTRACT(DAY FROM start_date)::SMALLINT)
WHERE start_date IS NOT NULL
  AND (move_in_date IS NULL OR first_rent_due_date IS NULL OR rent_due_day IS NULL);
