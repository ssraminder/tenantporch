-- Migration: Create rp_document_templates and rp_lease_documents tables
-- Part of the multi-document lease architecture (Phase 1)

-- ============================================================
-- 1. rp_document_templates — Template definitions (stub for now)
-- ============================================================
CREATE TABLE public.rp_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  province TEXT NOT NULL DEFAULT 'AB',
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_schema JSONB,
  template_version TEXT NOT NULL DEFAULT '1.0',
  min_plan_slug TEXT NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rp_document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active templates"
  ON public.rp_document_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================
-- 2. rp_lease_documents — Per-lease document instances
-- ============================================================
CREATE TABLE public.rp_lease_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES public.rp_leases(id) ON DELETE CASCADE,

  -- Document identity
  document_type TEXT NOT NULL DEFAULT 'lease_agreement',
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Content: structured JSONB or uploaded file
  document_content JSONB,
  file_url TEXT,

  -- Template reference
  template_id UUID REFERENCES public.rp_document_templates(id),
  template_version TEXT,

  -- Per-document signing status
  signing_status TEXT NOT NULL DEFAULT 'draft',
  signing_request_id UUID REFERENCES public.rp_signing_requests(id),
  signed_offline_at TIMESTAMPTZ,
  signed_offline_by UUID REFERENCES public.rp_users(id),
  signed_pdf_url TEXT,

  -- Metadata
  created_by UUID REFERENCES public.rp_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lease_documents_lease_id ON public.rp_lease_documents(lease_id);
CREATE INDEX idx_lease_documents_signing_status ON public.rp_lease_documents(signing_status);

ALTER TABLE public.rp_lease_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS Policies for rp_lease_documents
-- ============================================================

-- Landlord SELECT: documents for leases on their properties
CREATE POLICY "Landlord read own lease documents"
  ON public.rp_lease_documents
  FOR SELECT
  TO authenticated
  USING (
    lease_id IN (
      SELECT l.id FROM public.rp_leases l
      WHERE l.property_id IN (SELECT get_landlord_property_ids(auth.uid()))
    )
  );

-- Landlord INSERT
CREATE POLICY "Landlord insert own lease documents"
  ON public.rp_lease_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    lease_id IN (
      SELECT l.id FROM public.rp_leases l
      WHERE l.property_id IN (SELECT get_landlord_property_ids(auth.uid()))
    )
  );

-- Landlord UPDATE
CREATE POLICY "Landlord update own lease documents"
  ON public.rp_lease_documents
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

-- Landlord DELETE: only draft documents
CREATE POLICY "Landlord delete draft lease documents"
  ON public.rp_lease_documents
  FOR DELETE
  TO authenticated
  USING (
    signing_status = 'draft'
    AND lease_id IN (
      SELECT l.id FROM public.rp_leases l
      WHERE l.property_id IN (SELECT get_landlord_property_ids(auth.uid()))
    )
  );

-- Tenant SELECT: documents for leases they're part of
CREATE POLICY "Tenant read lease documents"
  ON public.rp_lease_documents
  FOR SELECT
  TO authenticated
  USING (
    lease_id IN (
      SELECT lt.lease_id FROM public.rp_lease_tenants lt
      JOIN public.rp_users u ON u.id = lt.user_id
      WHERE u.auth_id = auth.uid()
    )
  );
