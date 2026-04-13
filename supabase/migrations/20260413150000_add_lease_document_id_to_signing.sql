-- Migration: Add lease_document_id to rp_signing_requests for per-document signing
-- Part of Phase 5: Per-Document Signing + Signed Offline

ALTER TABLE public.rp_signing_requests
  ADD COLUMN lease_document_id UUID REFERENCES public.rp_lease_documents(id);

CREATE INDEX idx_signing_requests_lease_document_id
  ON public.rp_signing_requests(lease_document_id);
