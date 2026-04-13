-- Migration: Mark rp_leases.lease_document_content as deprecated
-- Part of Phase 6: Cleanup
-- The column is kept for backward compatibility (old leases without
-- rp_lease_documents rows can still be read), but new writes go
-- exclusively to rp_lease_documents.

COMMENT ON COLUMN public.rp_leases.lease_document_content IS
  'DEPRECATED: Use rp_lease_documents table for per-document content. This column is retained for backward compatibility with existing data only. No new writes should target this column.';
