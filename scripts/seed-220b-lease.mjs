#!/usr/bin/env node
/**
 * Seed script: 220B Red Sky Terrace NE — Lease + Test Tenants + Signing Flow
 *
 * What this does (idempotently):
 *  1. Looks up the landlord by email (LANDLORD_EMAIL env, defaults to ss.raminder@gmail.com).
 *  2. Finds or creates the property "220B Red Sky Terrace NE, Calgary, AB T3N 1M9".
 *  3. Finds or creates two test tenants (Lovepreet Kaur, Anmol Brar).
 *  4. Cancels any active lease on that property, creates a new fixed-term lease
 *     (May 1 – Sept 30, 2026, $1,300/mo, $1,300 deposit).
 *  5. Creates the 3 lease documents with the custom 220B content
 *     (Lease Agreement / Schedule A — Furnished Inventory / Schedule B — Tenant Identification).
 *  6. Links the test tenants to the lease via rp_lease_tenants.
 *  7. If --send-for-signing is passed, creates a signing request + participants
 *     (3 docs × 2 tenants + 1 landlord) so test tenants can review and sign.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/seed-220b-lease.mjs [--send-for-signing] [--reset]
 *
 *   --reset             : delete the existing lease (and its docs/signing) for 220B and recreate
 *   --send-for-signing  : create signing requests + participants for each document (no email send)
 *
 * The script prints the signing URLs for test tenants at the end.
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import {
  generate220BLeaseAgreement,
  generate220BScheduleA,
  generate220BScheduleB,
} from "./lib/lease-content-220b.mjs";

// ---- config ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tenantporch.vercel.app";
const LANDLORD_EMAIL = process.env.LANDLORD_EMAIL || "ss.raminder@gmail.com";

const args = new Set(process.argv.slice(2));
const RESET = args.has("--reset");
const SEND_FOR_SIGNING = args.has("--send-for-signing");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- property + tenant data (matches the 220B PDF lease) ----
const PROPERTY = {
  address_line1: "220B Red Sky Terrace NE",
  address_line2: null,
  city: "Calgary",
  province_state: "AB",
  postal_code: "T3N 1M9",
  unit_description:
    "Legal basement suite (Sticker No. 8901) with its own side entrance, separate mailing address, and mailbox, independent from the main dwelling.",
  parking_type: "driveway",
  parking_spots: 1,
  laundry_type: "in_suite",
  storage_included: false,
  yard_access: true,
  has_separate_entrance: true,
};

const LEASE = {
  lease_type: "fixed",
  start_date: "2026-05-01",
  end_date: "2026-09-30",
  monthly_rent: 1300.0,
  currency_code: "CAD",
  security_deposit: 1300.0,
  deposit_paid_date: "2026-04-10",
  utility_split_percent: 40,
  internet_included: true,
  pad_enabled: false,
  pets_allowed: false,
  smoking_allowed: false,
  max_occupants: 3,
  late_fee_type: "flat",
  late_fee_amount: 50.0,
  status: "active",
};

const TEST_TENANTS = [
  {
    first_name: "Lovepreet",
    last_name: "Kaur",
    email: "test+lovepreet.kaur@tenantporch.test",
    phone: "250-317-7526",
    role: "tenant",
  },
  {
    first_name: "Anmol",
    last_name: "Brar",
    email: "test+anmol.brar@tenantporch.test",
    phone: "647-988-7471",
    role: "co-tenant",
  },
];

// ---- helpers ----
function token() {
  return crypto.randomBytes(32).toString("hex");
}
function hash(content) {
  return crypto.createHash("sha256").update(JSON.stringify(content)).digest("hex");
}
function log(...args) {
  console.log("·", ...args);
}

async function findLandlord() {
  const { data, error } = await supabase
    .from("rp_users")
    .select("id, auth_id, first_name, last_name, email")
    .eq("email", LANDLORD_EMAIL)
    .maybeSingle();
  if (error) throw new Error(`landlord lookup: ${error.message}`);
  if (!data)
    throw new Error(
      `Landlord ${LANDLORD_EMAIL} not found in rp_users. Sign up first or set LANDLORD_EMAIL.`
    );
  return data;
}

async function findOrCreateProperty(landlordId) {
  // Find by exact address+landlord
  const { data: existing } = await supabase
    .from("rp_properties")
    .select("id, address_line1, city, province_state, postal_code, landlord_id")
    .eq("landlord_id", landlordId)
    .ilike("address_line1", PROPERTY.address_line1)
    .eq("city", PROPERTY.city)
    .maybeSingle();

  if (existing) {
    log(`Found existing property ${existing.id} (${existing.address_line1})`);
    // Update fields to match the PDF
    await supabase
      .from("rp_properties")
      .update({ ...PROPERTY })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("rp_properties")
    .insert({ ...PROPERTY, landlord_id: landlordId })
    .select("id")
    .single();
  if (error) throw new Error(`create property: ${error.message}`);
  log(`Created property ${created.id}`);
  return created.id;
}

async function findOrCreateTenant(spec) {
  // Look up by email first
  const { data: existing } = await supabase
    .from("rp_users")
    .select("id, auth_id, first_name, last_name, email, phone")
    .eq("email", spec.email)
    .maybeSingle();

  if (existing) {
    log(`Found existing test tenant ${existing.email}`);
    // Make sure phone is up to date
    await supabase
      .from("rp_users")
      .update({
        first_name: spec.first_name,
        last_name: spec.last_name,
        phone: spec.phone,
      })
      .eq("id", existing.id);
    return existing;
  }

  // Create auth user (random password — landlord can reset if needed)
  const tempPassword =
    "TestT3nant!" + crypto.randomBytes(4).toString("hex").toUpperCase();

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: spec.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: spec.first_name,
      last_name: spec.last_name,
      role: "tenant",
      test_account: true,
    },
  });
  if (authErr) throw new Error(`auth.create ${spec.email}: ${authErr.message}`);

  const { data: rpUser, error: insertErr } = await supabase
    .from("rp_users")
    .insert({
      auth_id: authData.user.id,
      first_name: spec.first_name,
      last_name: spec.last_name,
      email: spec.email,
      phone: spec.phone,
      role: "tenant",
      must_change_password: false,
      id_document_status: "approved",
    })
    .select("id, auth_id, first_name, last_name, email, phone")
    .single();

  if (insertErr) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(`rp_users insert ${spec.email}: ${insertErr.message}`);
  }

  log(`Created test tenant ${spec.email} (temp password: ${tempPassword})`);
  return rpUser;
}

async function ensureNoActiveLease(propertyId, reset) {
  const { data: leases } = await supabase
    .from("rp_leases")
    .select("id, status")
    .eq("property_id", propertyId)
    .in("status", ["active", "draft"]);

  if (!leases || leases.length === 0) return;

  if (!reset) {
    log(
      `Property has ${leases.length} existing lease(s). Pass --reset to remove and recreate.`
    );
    return;
  }

  for (const l of leases) {
    log(`Resetting: deleting lease ${l.id} and its child rows`);
    // Delete signing audit/participants/requests for any documents
    const { data: docs } = await supabase
      .from("rp_lease_documents")
      .select("signing_request_id")
      .eq("lease_id", l.id);
    const reqIds = (docs ?? [])
      .map((d) => d.signing_request_id)
      .filter(Boolean);

    const { data: directReqs } = await supabase
      .from("rp_signing_requests")
      .select("id")
      .eq("lease_id", l.id);
    for (const r of directReqs ?? []) reqIds.push(r.id);

    if (reqIds.length > 0) {
      await supabase.from("rp_signing_audit_log").delete().in("signing_request_id", reqIds);
      await supabase.from("rp_signing_participants").delete().in("signing_request_id", reqIds);
      await supabase.from("rp_email_logs").delete().in("signing_request_id", reqIds);
      await supabase.from("rp_signing_requests").delete().in("id", reqIds);
    }

    // rp_lease_documents will cascade with the lease, but be explicit
    await supabase.from("rp_lease_documents").delete().eq("lease_id", l.id);
    await supabase.from("rp_security_deposits").delete().eq("lease_id", l.id);
    await supabase.from("rp_lease_tenants").delete().eq("lease_id", l.id);
    await supabase.from("rp_leases").delete().eq("id", l.id);
  }
}

async function createLease(propertyId) {
  const { data, error } = await supabase
    .from("rp_leases")
    .insert({ ...LEASE, property_id: propertyId })
    .select("id")
    .single();
  if (error) throw new Error(`create lease: ${error.message}`);
  log(`Created lease ${data.id}`);
  return data.id;
}

async function createDocuments(leaseId, landlordId) {
  const leaseAgreement = generate220BLeaseAgreement();
  const scheduleA = generate220BScheduleA();
  const scheduleB = generate220BScheduleB();

  const rows = [
    {
      lease_id: leaseId,
      document_type: "lease_agreement",
      title: "Lease Agreement",
      sort_order: 0,
      document_content: leaseAgreement,
      signing_status: "draft",
      created_by: landlordId,
    },
    {
      lease_id: leaseId,
      document_type: "schedule_a",
      title: "Schedule A — Furnished Inventory",
      sort_order: 1,
      document_content: scheduleA,
      signing_status: "draft",
      created_by: landlordId,
    },
    {
      lease_id: leaseId,
      document_type: "schedule_b",
      title: "Schedule B — Tenant Identification",
      sort_order: 2,
      document_content: scheduleB,
      signing_status: "draft",
      created_by: landlordId,
    },
  ];

  const { data, error } = await supabase
    .from("rp_lease_documents")
    .insert(rows)
    .select("id, document_type, title, document_content");
  if (error) throw new Error(`insert docs: ${error.message}`);

  // Dual-write the lease agreement content into rp_leases.lease_document_content for backward compat
  await supabase
    .from("rp_leases")
    .update({ lease_document_content: leaseAgreement })
    .eq("id", leaseId);

  log(`Created ${data.length} documents (lease agreement, schedule A, schedule B)`);
  return data;
}

async function attachTenants(leaseId, tenants) {
  const rows = tenants.map((t, i) => ({
    lease_id: leaseId,
    user_id: t.id,
    role: i === 0 ? "tenant" : "co-tenant",
    is_primary_contact: i === 0,
  }));

  // Upsert-style: delete existing then insert
  await supabase.from("rp_lease_tenants").delete().eq("lease_id", leaseId);
  const { error } = await supabase.from("rp_lease_tenants").insert(rows);
  if (error) throw new Error(`attach tenants: ${error.message}`);
  log(`Attached ${rows.length} test tenants to lease`);
}

async function ensureSecurityDeposit(leaseId) {
  const { data } = await supabase
    .from("rp_security_deposits")
    .select("id")
    .eq("lease_id", leaseId)
    .maybeSingle();
  if (data) return;

  await supabase.from("rp_security_deposits").insert({
    lease_id: leaseId,
    amount: LEASE.security_deposit,
    currency_code: LEASE.currency_code,
    received_date: LEASE.deposit_paid_date,
    status: "held",
  });
  log("Created security deposit record");
}

async function sendForSigning(leaseId, landlord, tenants, documents) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const allParticipantUrls = [];

  for (const doc of documents) {
    const documentHash = hash(doc.document_content);

    const { data: req, error: reqErr } = await supabase
      .from("rp_signing_requests")
      .insert({
        lease_id: leaseId,
        lease_document_id: doc.id,
        document_hash: documentHash,
        status: "sent",
        created_by: landlord.id,
        expires_at: expiresAt,
      })
      .select("id")
      .single();
    if (reqErr) throw new Error(`signing request for ${doc.title}: ${reqErr.message}`);

    const participants = [
      ...tenants.map((t, i) => ({
        signing_request_id: req.id,
        signer_name: `${t.first_name} ${t.last_name}`,
        signer_email: t.email,
        signer_role: "tenant",
        signing_order: i + 1,
        token: token(),
        status: "pending",
      })),
      {
        signing_request_id: req.id,
        signer_name: `${landlord.first_name} ${landlord.last_name}`,
        signer_email: landlord.email,
        signer_role: "landlord",
        signing_order: tenants.length + 1,
        token: token(),
        status: "pending",
      },
    ];

    const { data: parts, error: partErr } = await supabase
      .from("rp_signing_participants")
      .insert(participants)
      .select("id, signer_name, signer_email, signer_role, token");
    if (partErr) throw new Error(`participants for ${doc.title}: ${partErr.message}`);

    await supabase
      .from("rp_lease_documents")
      .update({ signing_request_id: req.id, signing_status: "sent" })
      .eq("id", doc.id);

    await supabase.from("rp_signing_audit_log").insert({
      signing_request_id: req.id,
      action: "signing_request_created",
      metadata: {
        lease_id: leaseId,
        lease_document_id: doc.id,
        document_type: doc.document_type,
        participant_count: participants.length,
        seeded_via_script: true,
      },
    });

    allParticipantUrls.push({
      document: doc.title,
      participants: parts.map((p) => ({
        name: p.signer_name,
        role: p.signer_role,
        url: `${APP_URL}/sign/${p.token}`,
      })),
    });
  }

  // Update lease-level status
  await supabase
    .from("rp_leases")
    .update({
      signing_status: "sent",
      sent_for_signing_at: new Date().toISOString(),
    })
    .eq("id", leaseId);

  return allParticipantUrls;
}

// ---- main ----
(async () => {
  try {
    log(`Connecting to ${SUPABASE_URL}`);

    const landlord = await findLandlord();
    log(`Landlord: ${landlord.first_name} ${landlord.last_name} <${landlord.email}>`);

    const propertyId = await findOrCreateProperty(landlord.id);
    await ensureNoActiveLease(propertyId, RESET);

    const tenants = [];
    for (const spec of TEST_TENANTS) {
      tenants.push(await findOrCreateTenant(spec));
    }

    // If reset wasn't passed but a lease still exists, exit early — don't double-create
    const { data: existingLease } = await supabase
      .from("rp_leases")
      .select("id")
      .eq("property_id", propertyId)
      .in("status", ["active", "draft"])
      .maybeSingle();

    let leaseId;
    if (existingLease) {
      leaseId = existingLease.id;
      log(`Using existing lease ${leaseId}`);
      // Update lease fields and regenerate documents
      await supabase
        .from("rp_leases")
        .update({ ...LEASE })
        .eq("id", leaseId);
      // Regenerate docs in place
      await supabase.from("rp_lease_documents").delete().eq("lease_id", leaseId);
    } else {
      leaseId = await createLease(propertyId);
    }

    const documents = await createDocuments(leaseId, landlord.id);
    await attachTenants(leaseId, tenants);
    await ensureSecurityDeposit(leaseId);

    console.log("\n========================================");
    console.log("SEED COMPLETE");
    console.log("========================================");
    console.log(`Property:  ${PROPERTY.address_line1}, ${PROPERTY.city}`);
    console.log(`Lease ID:  ${leaseId}`);
    console.log(`Landlord:  ${landlord.email}`);
    console.log(`Tenants:`);
    for (const t of tenants) {
      console.log(`  - ${t.first_name} ${t.last_name} <${t.email}>`);
    }
    console.log(`Documents:`);
    for (const d of documents) {
      console.log(`  - ${d.title} (${d.id})`);
    }

    if (SEND_FOR_SIGNING) {
      const signingUrls = await sendForSigning(leaseId, landlord, tenants, documents);
      console.log("\n----------------------------------------");
      console.log("SIGNING URLS (test tenants — share these to sign)");
      console.log("----------------------------------------");
      for (const doc of signingUrls) {
        console.log(`\n${doc.document}:`);
        for (const p of doc.participants) {
          console.log(`  ${p.role.padEnd(9)} ${p.name.padEnd(22)} ${p.url}`);
        }
      }
    } else {
      console.log(
        "\nTo create signing links for test tenants, re-run with --send-for-signing"
      );
    }

    console.log(
      `\nAdmin lease document hub: ${APP_URL}/admin/leases/${leaseId}/document`
    );
  } catch (err) {
    console.error("\nFAILED:", err.message);
    process.exit(1);
  }
})();
