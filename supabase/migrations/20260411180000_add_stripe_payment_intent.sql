-- Add stripe_payment_intent_id to rp_payments for tracking Stripe payments
ALTER TABLE rp_payments
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
