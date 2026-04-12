-- Migration: Add landlord CRUD RLS policies
-- All tables use get_landlord_property_ids(auth.uid()) to scope access,
-- except rp_properties INSERT (uses rp_users lookup) and rp_landlord_profiles (uses rp_users lookup).

-- ============================================================
-- 1. rp_properties — Landlord INSERT
-- ============================================================
CREATE POLICY "Landlord insert own properties"
  ON public.rp_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    landlord_id IN (
      SELECT id FROM public.rp_users WHERE auth_id = auth.uid()
    )
  );

-- ============================================================
-- 2. rp_properties — Landlord UPDATE own properties
-- ============================================================
CREATE POLICY "Landlord update own properties"
  ON public.rp_properties
  FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT get_landlord_property_ids(auth.uid()))
  )
  WITH CHECK (
    id IN (SELECT get_landlord_property_ids(auth.uid()))
  );

-- ============================================================
-- 3. rp_properties — Landlord DELETE own properties
-- ============================================================
CREATE POLICY "Landlord delete own properties"
  ON public.rp_properties
  FOR DELETE
  TO authenticated
  USING (
    id IN (SELECT get_landlord_property_ids(auth.uid()))
  );

-- ============================================================
-- 4. rp_leases — Landlord INSERT
-- ============================================================
CREATE POLICY "Landlord insert leases on own properties"
  ON public.rp_leases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (SELECT get_landlord_property_ids(auth.uid()))
  );

-- ============================================================
-- 5. rp_leases — Landlord UPDATE own leases
-- ============================================================
CREATE POLICY "Landlord update leases on own properties"
  ON public.rp_leases
  FOR UPDATE
  TO authenticated
  USING (
    property_id IN (SELECT get_landlord_property_ids(auth.uid()))
  )
  WITH CHECK (
    property_id IN (SELECT get_landlord_property_ids(auth.uid()))
  );

-- ============================================================
-- 6. rp_payments — Landlord INSERT
-- ============================================================
CREATE POLICY "Landlord insert payments on own leases"
  ON public.rp_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    lease_id IN (
      SELECT l.id FROM public.rp_leases l
      WHERE l.property_id IN (SELECT get_landlord_property_ids(auth.uid()))
    )
  );

-- ============================================================
-- 7. rp_payments — Landlord UPDATE own payments
-- ============================================================
CREATE POLICY "Landlord update payments on own leases"
  ON public.rp_payments
  FOR UPDATE
  TO authenticated
  USING (
    lease_id IN (
      SELECT l.id FROM public.rp_leases l
      WHERE l.property_id IN (SELECT get_landlord_property_ids(auth.uid()))
    )
  )
  WITH CHECK (
    lease_id IN (
      SELECT l.id FROM public.rp_leases l
      WHERE l.property_id IN (SELECT get_landlord_property_ids(auth.uid()))
    )
  );

-- ============================================================
-- 8. rp_lease_tenants — Landlord INSERT
-- ============================================================
CREATE POLICY "Landlord insert tenants on own leases"
  ON public.rp_lease_tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    lease_id IN (
      SELECT l.id FROM public.rp_leases l
      WHERE l.property_id IN (SELECT get_landlord_property_ids(auth.uid()))
    )
  );

-- ============================================================
-- 9. rp_maintenance_requests — Landlord INSERT
-- ============================================================
CREATE POLICY "Landlord insert maintenance requests on own properties"
  ON public.rp_maintenance_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (SELECT get_landlord_property_ids(auth.uid()))
  );

-- ============================================================
-- 10. rp_maintenance_requests — Landlord UPDATE own
-- ============================================================
CREATE POLICY "Landlord update maintenance requests on own properties"
  ON public.rp_maintenance_requests
  FOR UPDATE
  TO authenticated
  USING (
    property_id IN (SELECT get_landlord_property_ids(auth.uid()))
  )
  WITH CHECK (
    property_id IN (SELECT get_landlord_property_ids(auth.uid()))
  );

-- ============================================================
-- 11. rp_documents — Landlord INSERT
-- ============================================================
CREATE POLICY "Landlord insert documents on own properties"
  ON public.rp_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (SELECT get_landlord_property_ids(auth.uid()))
  );

-- ============================================================
-- 12. rp_documents — Landlord DELETE own
-- ============================================================
CREATE POLICY "Landlord delete documents on own properties"
  ON public.rp_documents
  FOR DELETE
  TO authenticated
  USING (
    property_id IN (SELECT get_landlord_property_ids(auth.uid()))
  );

-- ============================================================
-- 13. rp_users — UPDATE own — SKIPPED (already exists)
-- ============================================================

-- ============================================================
-- 14. rp_landlord_profiles — Landlord UPDATE own
-- ============================================================
CREATE POLICY "Landlord update own profile"
  ON public.rp_landlord_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.rp_users WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.rp_users WHERE auth_id = auth.uid()
    )
  );
