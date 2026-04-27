-- Migration: Add year_of_purchase + notes + updated_at to rp_inventory_items,
-- plus landlord/tenant RLS so the inventory page can read/write through it.

ALTER TABLE public.rp_inventory_items
  ADD COLUMN IF NOT EXISTS year_of_purchase SMALLINT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.rp_inventory_items
  DROP CONSTRAINT IF EXISTS rp_inventory_items_year_of_purchase_chk;
ALTER TABLE public.rp_inventory_items
  ADD CONSTRAINT rp_inventory_items_year_of_purchase_chk
    CHECK (year_of_purchase IS NULL OR (year_of_purchase BETWEEN 1900 AND 2100));

CREATE INDEX IF NOT EXISTS idx_inventory_items_property_id
  ON public.rp_inventory_items(property_id);

ALTER TABLE public.rp_inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Landlord read property inventory" ON public.rp_inventory_items;
CREATE POLICY "Landlord read property inventory" ON public.rp_inventory_items
  FOR SELECT TO authenticated
  USING (property_id IN (SELECT get_landlord_property_ids(auth.uid())));

DROP POLICY IF EXISTS "Landlord insert property inventory" ON public.rp_inventory_items;
CREATE POLICY "Landlord insert property inventory" ON public.rp_inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (property_id IN (SELECT get_landlord_property_ids(auth.uid())));

DROP POLICY IF EXISTS "Landlord update property inventory" ON public.rp_inventory_items;
CREATE POLICY "Landlord update property inventory" ON public.rp_inventory_items
  FOR UPDATE TO authenticated
  USING (property_id IN (SELECT get_landlord_property_ids(auth.uid())))
  WITH CHECK (property_id IN (SELECT get_landlord_property_ids(auth.uid())));

DROP POLICY IF EXISTS "Landlord delete property inventory" ON public.rp_inventory_items;
CREATE POLICY "Landlord delete property inventory" ON public.rp_inventory_items
  FOR DELETE TO authenticated
  USING (property_id IN (SELECT get_landlord_property_ids(auth.uid())));

DROP POLICY IF EXISTS "Tenant read leased property inventory" ON public.rp_inventory_items;
CREATE POLICY "Tenant read leased property inventory" ON public.rp_inventory_items
  FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT l.property_id
      FROM public.rp_leases l
      JOIN public.rp_lease_tenants lt ON lt.lease_id = l.id
      JOIN public.rp_users u ON u.id = lt.user_id
      WHERE u.auth_id = auth.uid()
    )
  );
