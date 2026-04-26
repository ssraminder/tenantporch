#!/usr/bin/env node
/**
 * Reset all signing state for a single lease so the flow can be re-run.
 * Mirrors the resetLeaseSignatures server action — useful when the
 * deployed UI isn't available yet or the platform-admin env var isn't
 * set on the host.
 *
 *   1. Cancels every signing request on the lease.
 *   2. Resets every rp_lease_documents row to draft (clears
 *      signing_request_id, signed_pdf_url, signed_offline_*).
 *   3. Resets rp_leases.signing_status to draft, clears sent_for_signing_at.
 *   4. Removes any rp_documents rows in lease/schedule_a/schedule_b
 *      categories so the tenant doesn't see stale signed PDFs.
 *
 * Looks up the lease by property address (default: 220B Red Sky Terrace NE)
 * under the landlord email (default: ss.raminder@gmail.com).
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/reset-lease-signatures.mjs [--lease-id=<uuid>] \
 *     [--address="220B Red Sky Terrace NE"] [--landlord-email=ss.raminder@gmail.com] \
 *     [--keep-pdfs]
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
function arg(name, fallback) {
  const flag = argv.find((a) => a.startsWith(`--${name}=`));
  if (flag) return flag.slice(name.length + 3);
  return fallback;
}
const KEEP_PDFS = argv.includes("--keep-pdfs");
const LEASE_ID = arg("lease-id", null);
const ADDRESS = arg("address", "220B Red Sky Terrace NE");
const LANDLORD_EMAIL = arg("landlord-email", "ss.raminder@gmail.com");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function log(...args) {
  console.log("·", ...args);
}

async function findLease() {
  if (LEASE_ID) {
    const { data, error } = await supabase
      .from("rp_leases")
      .select("id, property_id, signing_status, status")
      .eq("id", LEASE_ID)
      .maybeSingle();
    if (error) throw new Error(`lookup by lease id: ${error.message}`);
    if (!data) throw new Error(`Lease ${LEASE_ID} not found`);
    return data;
  }

  const { data: landlord } = await supabase
    .from("rp_users")
    .select("id")
    .eq("email", LANDLORD_EMAIL)
    .maybeSingle();
  if (!landlord) throw new Error(`Landlord ${LANDLORD_EMAIL} not in rp_users`);

  const { data: properties } = await supabase
    .from("rp_properties")
    .select("id, address_line1")
    .eq("landlord_id", landlord.id)
    .ilike("address_line1", ADDRESS);
  if (!properties || properties.length === 0)
    throw new Error(`No property "${ADDRESS}" for ${LANDLORD_EMAIL}`);

  const propertyIds = properties.map((p) => p.id);
  const { data: leases } = await supabase
    .from("rp_leases")
    .select("id, property_id, signing_status, status, start_date")
    .in("property_id", propertyIds)
    .order("start_date", { ascending: false });
  if (!leases || leases.length === 0)
    throw new Error(`No leases on property "${ADDRESS}"`);

  // Prefer the most recent active/draft lease
  const preferred =
    leases.find((l) => ["active", "draft"].includes(l.status)) ?? leases[0];
  log(
    `Selected lease ${preferred.id} on property ${preferred.property_id} (${preferred.status}, signing=${preferred.signing_status})`
  );
  return preferred;
}

async function resetLease(lease) {
  // 1. Cancel all signing requests
  const { data: requests } = await supabase
    .from("rp_signing_requests")
    .select("id, status")
    .eq("lease_id", lease.id);
  const requestIds = (requests ?? []).map((r) => r.id);
  log(`Found ${requestIds.length} signing request(s) on this lease`);

  if (requestIds.length > 0) {
    const { error: cancelErr } = await supabase
      .from("rp_signing_requests")
      .update({ status: "cancelled" })
      .in("id", requestIds);
    if (cancelErr) throw new Error(`cancel requests: ${cancelErr.message}`);

    const auditRows = requestIds.map((id) => ({
      signing_request_id: id,
      action: "signing_reset",
      metadata: { lease_id: lease.id, source: "scripts/reset-lease-signatures.mjs" },
    }));
    await supabase.from("rp_signing_audit_log").insert(auditRows);
    log("Marked requests cancelled and added audit log entries");
  }

  // 2. Reset all lease document rows
  const { error: docErr } = await supabase
    .from("rp_lease_documents")
    .update({
      signing_status: "draft",
      signing_request_id: null,
      signed_pdf_url: null,
      signed_offline_at: null,
      signed_offline_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("lease_id", lease.id);
  if (docErr) throw new Error(`reset lease documents: ${docErr.message}`);
  log("Reset every rp_lease_documents row to draft");

  // 3. Reset the lease itself
  const { error: leaseErr } = await supabase
    .from("rp_leases")
    .update({ signing_status: "draft", sent_for_signing_at: null })
    .eq("id", lease.id);
  if (leaseErr) throw new Error(`reset lease: ${leaseErr.message}`);
  log("Reset rp_leases.signing_status to draft");

  // 4. Remove generated signed PDFs (so the tenant doesn't see stale copies)
  let removedDocCount = 0;
  if (!KEEP_PDFS) {
    const { data: removed, error: rmErr } = await supabase
      .from("rp_documents")
      .delete()
      .eq("lease_id", lease.id)
      .in("category", ["lease", "schedule_a", "schedule_b"])
      .select("id");
    if (rmErr) throw new Error(`remove signed pdfs: ${rmErr.message}`);
    removedDocCount = removed?.length ?? 0;
    log(`Removed ${removedDocCount} signed PDF row(s) from rp_documents`);
  } else {
    log("Skipping rp_documents cleanup (--keep-pdfs)");
  }

  return { cancelledRequests: requestIds.length, removedDocuments: removedDocCount };
}

(async () => {
  try {
    log(`Connected to ${SUPABASE_URL}`);
    const lease = await findLease();
    const result = await resetLease(lease);

    console.log("\n========================================");
    console.log("RESET COMPLETE");
    console.log("========================================");
    console.log(`Lease ID:           ${lease.id}`);
    console.log(`Cancelled requests: ${result.cancelledRequests}`);
    console.log(`Removed PDFs:       ${result.removedDocuments}`);
    console.log("\nThe lease is back in draft. Send for signatures from the");
    console.log(`admin lease document page or run scripts/seed-220b-lease.mjs`);
    console.log("with --send-for-signing to recreate links.");
  } catch (err) {
    console.error("\nFAILED:", err.message);
    process.exit(1);
  }
})();
