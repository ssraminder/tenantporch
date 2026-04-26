-- Reset all signing state on a single lease so the flow can be re-run.
--
-- Defaults to the most recent lease at "220B Red Sky Terrace NE" owned by
-- ss.raminder@gmail.com. Edit the email + address below to target a
-- different lease, or replace the `target` CTE with a literal id, e.g.:
--
--     WITH target AS (SELECT '<lease-uuid>'::uuid AS lease_id)
--
-- Steps:
--   1. Cancel every signing request on the lease.
--   2. Append a 'signing_reset' audit log entry per request.
--   3. Reset every rp_lease_documents row back to draft.
--   4. Reset rp_leases.signing_status to draft.
--   5. Remove generated signed PDFs from rp_documents so the tenant
--      doesn't see stale copies.
--
-- Returns counts at the end so you can verify.
--
-- Equivalent to the resetLeaseSignatures server action (gated to
-- TenantPorch platform admins) and the scripts/reset-lease-signatures.mjs
-- helper. Use whichever is most convenient.

WITH target AS (
  SELECT l.id AS lease_id
  FROM rp_leases l
  JOIN rp_properties p ON p.id = l.property_id
  JOIN rp_users u ON u.id = p.landlord_id
  WHERE u.email = 'ss.raminder@gmail.com'
    AND p.address_line1 ILIKE '220B Red Sky Terrace NE%'
  ORDER BY l.start_date DESC
  LIMIT 1
),
cancelled AS (
  UPDATE rp_signing_requests sr
     SET status = 'cancelled'
    FROM target
   WHERE sr.lease_id = target.lease_id
  RETURNING sr.id
),
audit AS (
  INSERT INTO rp_signing_audit_log (signing_request_id, action, metadata)
  SELECT id, 'signing_reset',
         jsonb_build_object('source', 'manual_sql_reset')
    FROM cancelled
  RETURNING signing_request_id
),
docs_reset AS (
  UPDATE rp_lease_documents ld
     SET signing_status      = 'draft',
         signing_request_id  = NULL,
         signed_pdf_url      = NULL,
         signed_offline_at   = NULL,
         signed_offline_by   = NULL,
         updated_at          = now()
    FROM target
   WHERE ld.lease_id = target.lease_id
  RETURNING ld.id
),
lease_reset AS (
  UPDATE rp_leases l
     SET signing_status       = 'draft',
         sent_for_signing_at  = NULL
    FROM target
   WHERE l.id = target.lease_id
  RETURNING l.id
),
pdfs_removed AS (
  DELETE FROM rp_documents d
   USING target
   WHERE d.lease_id = target.lease_id
     AND d.category IN ('lease', 'schedule_a', 'schedule_b')
  RETURNING d.id
)
SELECT
  (SELECT lease_id FROM target)        AS lease_id,
  (SELECT count(*) FROM cancelled)     AS cancelled_requests,
  (SELECT count(*) FROM docs_reset)    AS docs_reset_to_draft,
  (SELECT count(*) FROM pdfs_removed)  AS signed_pdfs_removed;
