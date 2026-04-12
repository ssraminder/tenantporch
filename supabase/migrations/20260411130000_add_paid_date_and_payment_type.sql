-- Migration: Add paid_date and payment_type columns to rp_payments

-- Add paid_date column (defaults to today)
ALTER TABLE public.rp_payments
  ADD COLUMN IF NOT EXISTS paid_date date DEFAULT CURRENT_DATE;

-- Add payment_type column with check constraint
ALTER TABLE public.rp_payments
  ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'rent';

ALTER TABLE public.rp_payments
  ADD CONSTRAINT rp_payments_payment_type_check
  CHECK (payment_type IN ('rent', 'utilities', 'deposit', 'late_fee', 'maintenance', 'other'));
