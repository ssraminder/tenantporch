-- Create rp_utility_bills table for tracking utility billing per lease
CREATE TABLE IF NOT EXISTS rp_utility_bills (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id             UUID NOT NULL REFERENCES rp_leases(id) ON DELETE CASCADE,
  property_id          UUID NOT NULL REFERENCES rp_properties(id) ON DELETE CASCADE,
  billing_period       TEXT,                           -- e.g. "2026-04" (YYYY-MM)
  utility_type         TEXT NOT NULL,                  -- 'electricity'|'gas'|'water'|'internet'|'sewer'|'trash'|'other'
  total_amount         DECIMAL(10,2) NOT NULL,
  currency_code        TEXT NOT NULL DEFAULT 'CAD',
  split_percent        INTEGER NOT NULL DEFAULT 0,     -- snapshot from lease at time of billing (0-100)
  tenant_amount        DECIMAL(10,2) NOT NULL DEFAULT 0,  -- total_amount * split_percent / 100
  landlord_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,  -- total_amount - tenant_amount
  due_date             DATE,
  status               TEXT NOT NULL DEFAULT 'draft',  -- 'draft'|'sent'|'paid'|'overdue'|'cancelled'
  sent_at              TIMESTAMPTZ,
  reminder_sent_at     TIMESTAMPTZ,
  payment_method       TEXT,                           -- 'etransfer'|'card'|'cash'|'cheque'
  paid_at              TIMESTAMPTZ,
  paid_by              UUID REFERENCES rp_users(id),
  etransfer_reference  TEXT,
  file_urls            JSONB NOT NULL DEFAULT '[]',    -- [{url, name, size}]
  notes                TEXT,
  created_by           UUID REFERENCES rp_users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_utility_bills_property_id ON rp_utility_bills(property_id);
CREATE INDEX IF NOT EXISTS idx_utility_bills_lease_id ON rp_utility_bills(lease_id);
CREATE INDEX IF NOT EXISTS idx_utility_bills_status ON rp_utility_bills(status);
CREATE INDEX IF NOT EXISTS idx_utility_bills_due_date ON rp_utility_bills(due_date) WHERE status IN ('sent', 'overdue');
CREATE INDEX IF NOT EXISTS idx_utility_bills_created_at ON rp_utility_bills(created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_utility_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER utility_bills_updated_at
  BEFORE UPDATE ON rp_utility_bills
  FOR EACH ROW EXECUTE FUNCTION update_utility_bills_updated_at();

-- RLS policies
ALTER TABLE rp_utility_bills ENABLE ROW LEVEL SECURITY;

-- Landlord: full CRUD on bills for their properties
CREATE POLICY "Landlord full access to utility bills"
  ON rp_utility_bills
  FOR ALL
  USING (property_id IN (SELECT * FROM get_landlord_property_ids(auth.uid())))
  WITH CHECK (property_id IN (SELECT * FROM get_landlord_property_ids(auth.uid())));

-- Tenant: SELECT bills for leases they're on
CREATE POLICY "Tenant can view their utility bills"
  ON rp_utility_bills
  FOR SELECT
  USING (
    lease_id IN (
      SELECT lt.lease_id
      FROM rp_lease_tenants lt
      JOIN rp_users u ON u.id = lt.tenant_id
      WHERE u.auth_id = auth.uid()
    )
  );
