-- Migration: Seed document templates and create schedule rows for existing leases
-- Part of Phase 4: Content Splitting & Template Seeding

-- ============================================================
-- 1. Seed rp_document_templates with Alberta base templates
-- ============================================================
INSERT INTO public.rp_document_templates (slug, province, category, title, description, template_version, min_plan_slug, sort_order)
VALUES
  ('ab-lease-agreement-v1', 'AB', 'lease_agreement', 'Alberta Lease Agreement', 'Standard residential tenancy agreement compliant with the Residential Tenancies Act.', 'AB-2026-1.0', 'free', 0),
  ('ab-schedule-a-v1', 'AB', 'schedule_a', 'Schedule A — Property Details', 'Property details schedule including amenities, parking, and unit description.', 'AB-2026-1.0', 'free', 1),
  ('ab-schedule-b-v1', 'AB', 'schedule_b', 'Schedule B — Tenant Identification', 'Tenant identification schedule with ID type, number, and verification details.', 'AB-2026-1.0', 'free', 2);

-- ============================================================
-- 2. Create schedule_a rows for existing leases that only have lease_agreement
-- ============================================================
INSERT INTO public.rp_lease_documents (
  lease_id, document_type, title, sort_order, signing_status, created_at, updated_at
)
SELECT DISTINCT
  ld.lease_id,
  'schedule_a',
  'Schedule A — Property Details',
  1,
  'draft',
  now(),
  now()
FROM public.rp_lease_documents ld
WHERE ld.document_type = 'lease_agreement'
  AND NOT EXISTS (
    SELECT 1 FROM public.rp_lease_documents ld2
    WHERE ld2.lease_id = ld.lease_id AND ld2.document_type = 'schedule_a'
  );

-- ============================================================
-- 3. Create schedule_b rows for existing leases that only have lease_agreement
-- ============================================================
INSERT INTO public.rp_lease_documents (
  lease_id, document_type, title, sort_order, signing_status, created_at, updated_at
)
SELECT DISTINCT
  ld.lease_id,
  'schedule_b',
  'Schedule B — Tenant Identification',
  2,
  'draft',
  now(),
  now()
FROM public.rp_lease_documents ld
WHERE ld.document_type = 'lease_agreement'
  AND NOT EXISTS (
    SELECT 1 FROM public.rp_lease_documents ld2
    WHERE ld2.lease_id = ld.lease_id AND ld2.document_type = 'schedule_b'
  );
