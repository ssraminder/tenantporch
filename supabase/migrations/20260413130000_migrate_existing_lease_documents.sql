-- Migration: Populate rp_lease_documents from existing rp_leases data
-- For each lease with document content, create a lease_agreement row.
-- Schedule A and B rows will be created in Phase 4 when content splitting is implemented.

-- ============================================================
-- 1. Create lease_agreement rows from existing lease_document_content
-- ============================================================
INSERT INTO public.rp_lease_documents (
  lease_id,
  document_type,
  title,
  sort_order,
  document_content,
  signing_status,
  created_at,
  updated_at
)
SELECT
  l.id,
  'lease_agreement',
  'Lease Agreement',
  0,
  l.lease_document_content,
  COALESCE(l.signing_status, 'draft'),
  COALESCE(l.created_at, now()),
  now()
FROM public.rp_leases l
WHERE l.lease_document_content IS NOT NULL;

-- ============================================================
-- 2. Link existing signing requests to the new lease_document rows
-- ============================================================
UPDATE public.rp_lease_documents ld
SET signing_request_id = sr.id
FROM public.rp_signing_requests sr
WHERE sr.lease_id = ld.lease_id
  AND ld.document_type = 'lease_agreement'
  AND sr.status != 'cancelled';
