-- Migration: Landlord lease templates
-- Extends rp_lease_templates so each landlord can save reusable lease packages
-- (lease agreement + Schedule A/B + custom docs) and apply them when creating
-- new leases. Uses jsonb to bundle the per-document content so a single row
-- represents a full lease starter pack.

ALTER TABLE public.rp_lease_templates
  ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES public.rp_users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.rp_lease_templates ALTER COLUMN version SET DEFAULT '1.0';

CREATE INDEX IF NOT EXISTS idx_lease_templates_landlord_id
  ON public.rp_lease_templates(landlord_id);

ALTER TABLE public.rp_lease_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read landlord and system templates" ON public.rp_lease_templates;
CREATE POLICY "Read landlord and system templates" ON public.rp_lease_templates
  FOR SELECT TO authenticated
  USING (
    landlord_id IS NULL
    OR landlord_id IN (SELECT id FROM public.rp_users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Insert own templates" ON public.rp_lease_templates;
CREATE POLICY "Insert own templates" ON public.rp_lease_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    landlord_id IN (SELECT id FROM public.rp_users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Update own templates" ON public.rp_lease_templates;
CREATE POLICY "Update own templates" ON public.rp_lease_templates
  FOR UPDATE TO authenticated
  USING (landlord_id IN (SELECT id FROM public.rp_users WHERE auth_id = auth.uid()))
  WITH CHECK (landlord_id IN (SELECT id FROM public.rp_users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Delete own templates" ON public.rp_lease_templates;
CREATE POLICY "Delete own templates" ON public.rp_lease_templates
  FOR DELETE TO authenticated
  USING (landlord_id IN (SELECT id FROM public.rp_users WHERE auth_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_lease_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lease_templates_updated_at ON public.rp_lease_templates;
CREATE TRIGGER lease_templates_updated_at
  BEFORE UPDATE ON public.rp_lease_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_lease_templates_updated_at();
