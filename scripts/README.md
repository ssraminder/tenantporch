# scripts/

One-shot operational scripts. All scripts read Supabase credentials from env vars; nothing is hardcoded.

## seed-220b-lease.mjs

Seeds the property **220B Red Sky Terrace NE, Calgary, AB**, two test tenants
(Lovepreet Kaur, Anmol Brar), a fixed-term lease (May 1 – Sept 30, 2026,
$1,300/mo), and three lease documents whose content matches the lease draft PDF:

- Lease Agreement (Definitions + Sections 1–30)
- Schedule A — Furnished Inventory
- Schedule B — Tenant Identification

The script is idempotent — re-running with the same env will refresh fields on
existing rows. Pass `--reset` to delete the existing lease + docs + signing
state for the property and start clean.

### Usage

```bash
# Seed only (no signing flow yet — landlord sends from the admin UI)
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/seed-220b-lease.mjs

# Seed and immediately create signing requests for each of the 3 documents.
# Prints signing URLs at the end. Does NOT send emails (test tenants are
# fake addresses ending in @tenantporch.test).
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
NEXT_PUBLIC_APP_URL=http://localhost:3000 \
node scripts/seed-220b-lease.mjs --send-for-signing

# Wipe and recreate
node scripts/seed-220b-lease.mjs --reset --send-for-signing
```

### Env vars

| var | required | notes |
|-----|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service role key (bypasses RLS) |
| `NEXT_PUBLIC_APP_URL` | no | Base for `/sign/<token>` URLs (default: prod) |
| `LANDLORD_EMAIL` | no | rp_users.email of the property owner (default: ss.raminder@gmail.com) |

### Test tenants

Created with addresses ending in `@tenantporch.test` so they cannot receive real
email. ID verification is pre-approved (`id_document_status: 'approved'`) so the
signing flow isn't blocked.

| name | email | role |
|------|-------|------|
| Lovepreet Kaur | test+lovepreet.kaur@tenantporch.test | tenant (primary) |
| Anmol Brar | test+anmol.brar@tenantporch.test | co-tenant |

### After seeding

- Admin lease document hub: `/admin/leases/<lease_id>/document`
- Edit lease agreement clauses: `/admin/leases/<lease_id>/document/edit`
- Edit Schedule A / Schedule B: `/admin/leases/<lease_id>/document/<docId>`
- Send for signing from the admin UI (sends real email if tenants had real addresses)
  or use `--send-for-signing` on the seed script to get URLs printed directly.

### Source of truth

The lease document content is duplicated for legitimate reasons:

- `src/lib/lease-templates/red-sky-220b.ts` — TypeScript module for use inside Next.js (UI / admin actions)
- `scripts/lib/lease-content-220b.mjs` — plain ESM mirror so this script runs without a TS loader

If you edit one, edit the other.

## fix-rls-policy.mjs

Applies a missing SELECT RLS policy on `rp_users`. See the script header for details.
