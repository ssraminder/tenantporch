-- ============================================================
-- ID Verification Redesign: Landlord-Paid Stripe Identity
-- ============================================================

-- 1. Create rp_id_verifications table (audit trail for Stripe verifications)
CREATE TABLE IF NOT EXISTS rp_id_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES rp_users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES rp_users(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_checkout_session_id TEXT,
  verification_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
  used_free_quota BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add Stripe Identity columns to rp_users for quick tenant-side lookups
ALTER TABLE rp_users
  ADD COLUMN IF NOT EXISTS stripe_identity_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_identity_status TEXT,
  ADD COLUMN IF NOT EXISTS stripe_identity_verification_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_identity_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_identity_purchased_by UUID REFERENCES rp_users(id);

-- 3. RLS policies for rp_id_verifications
ALTER TABLE rp_id_verifications ENABLE ROW LEVEL SECURITY;

-- Landlords can view their own verification records
CREATE POLICY "landlord_select_own_verifications"
  ON rp_id_verifications FOR SELECT
  USING (
    landlord_id IN (
      SELECT id FROM rp_users WHERE auth_id = auth.uid()
    )
  );

-- Tenants can view their own verification records
CREATE POLICY "tenant_select_own_verifications"
  ON rp_id_verifications FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM rp_users WHERE auth_id = auth.uid()
    )
  );

-- Landlords can insert verification records for their tenants
CREATE POLICY "landlord_insert_verifications"
  ON rp_id_verifications FOR INSERT
  WITH CHECK (
    landlord_id IN (
      SELECT id FROM rp_users WHERE auth_id = auth.uid()
    )
  );

-- Index for efficient quota counting (landlord + month + free quota)
CREATE INDEX IF NOT EXISTS idx_id_verifications_landlord_quota
  ON rp_id_verifications (landlord_id, created_at)
  WHERE used_free_quota = true;

-- Index for webhook lookups by stripe session id
CREATE INDEX IF NOT EXISTS idx_id_verifications_stripe_session
  ON rp_id_verifications (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
