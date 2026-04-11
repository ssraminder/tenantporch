# TenantPorch — Final Claude Code Build Prompt (v2)

## PROJECT IDENTITY

- **Product**: TenantPorch — Canadian Rental Property Management Portal
- **Domain**: tenantporch.com
- **Tagline**: "Your front porch to smarter renting."
- **Supabase Project**: `scnmdbkpjlkitxdoeiaa` (transalation-order, us-east-2)
- **Table Prefix**: `rp_`
- **Default Currency**: CAD (multi-currency ready)

---

## CRITICAL ARCHITECTURE RULE

**All pricing, services, feature flags, plans, and currencies are stored in the database — never hardcoded.** This allows changing prices, toggling features, adding currencies, and launching in new markets without code deploys. The frontend reads pricing/plan data from the database and renders dynamically.

---

## PHASED SERVICE ROLLOUT

Services are gated by feature flags in `rp_feature_flags`. Each feature has a `phase` and `min_customers` threshold. The admin dashboard shows which features are available and allows toggling them on/off.

### Phase 1 (0–20 customers) — Launch features:
- Tenant portal, rent tracking (e-transfer), Alberta lease template, document storage, maintenance requests, rent reminders, late fee tracking, inspections, inventory tracking, card payments (Stripe Connect with 4% surcharge), utility bill splitting, financial reports, multi-property dashboard, custom lease builder

### Phase 2 (20–100 customers) — Growth features:
- Tenant screening (SingleKey partner API), rent guarantee referral (SingleKey), AI lease assistant (Claude Haiku), SMS notifications (Twilio), CRA T776 export, PWA mobile app

### Phase 3 (100–500 customers) — Scale features:
- Ontario + BC lease templates, renter's insurance referral (Duuo/Square One), built-in e-signing, automated lease renewal reminders, property listing syndication

### Phase 4 (500+ customers) — Expansion features:
- White-label portal, API access, all-province compliance, multi-currency billing active, advanced analytics, direct TransUnion integration, bulk operations

---

## PRICING MODEL

Per-unit pricing with volume discount. First property free forever. Landlords with 1 property can upgrade to any paid tier to unlock premium features (PAD, lower card surcharge, etc.).

| Tier slug | Name | Min properties | Max properties | Per unit/month | Features |
|-----------|------|---------------|---------------|---------------|----------|
| `free` | Free | 1 | 1 | $0 | All Phase 1 core features |
| `starter` | Starter | 1 | 5 | $7 | + Card payments, utility splitting, reports, lease builder, PAD auto-debit |
| `growth` | Growth | 6 | 20 | $6 | + T776 export, SMS reminders, screening, rent guarantee |
| `pro` | Pro | 21 | 50 | $4 | + API access, bulk operations, priority support |
| `enterprise` | Enterprise | 51 | 9999 | Custom | + White-label, custom integrations |

Transaction-based revenue (all tiers including free):
- Card payment surcharge: 6% on free tier (~$30.60 net per $1,300 payment), 4% on paid tiers (~$5.48 net per $1,300 payment) — rate stored on `rp_plans.card_surcharge_percent`
- SingleKey screening referral: 20–25% commission (~$10/screen)
- SingleKey rent guarantee referral: 20% of premium (~$109/year per policy)
- Insurance referral: 15% commission (Phase 3+)

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router), TypeScript |
| Styling | Tailwind CSS 3.4+ |
| UI | shadcn/ui + custom components |
| Icons | Material Symbols Outlined + Lucide React |
| Database | Supabase Postgres (`scnmdbkpjlkitxdoeiaa`) |
| Auth | Supabase Auth (email/password + magic links) |
| Storage | Supabase Storage |
| Payments | Stripe Connect (Direct charges) |
| Email | Resend |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Dates | date-fns, timezone: America/Edmonton |
| Hosting | Vercel |

---

## DATABASE SCHEMA (v2 — with pricing, services, currency)

### Migration order:
```
001_currencies_and_settings.sql
002_plans_and_features.sql
003_core_users_properties_leases.sql
004a_financial_payments_utilities_deposits.sql
004b_rent_schedule.sql
004c_pad_mandates.sql
005_maintenance.sql
006a_documents_inspections_inventory.sql
006b_lease_signing.sql
006c_moveout_deposit_return.sql
007_communication_notifications.sql
008a_partners_and_referrals.sql
008b_applications_contractors_expenses.sql
009_audit_log.sql
010_rls_policies.sql
011_seed_data.sql
```

---

### 001 — Currencies & settings

```sql
CREATE TABLE rp_currencies (
  code TEXT PRIMARY KEY,            -- 'CAD', 'USD', 'GBP', 'EUR', 'AUD', 'INR'
  name TEXT NOT NULL,               -- 'Canadian Dollar'
  symbol TEXT NOT NULL,             -- '$', '£', '€', '₹'
  decimal_places INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT false,  -- only CAD active at launch
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 002 — Plans, features & pricing

```sql
CREATE TABLE rp_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,        -- 'free', 'starter', 'growth', 'pro', 'enterprise'
  name TEXT NOT NULL,
  min_properties INTEGER NOT NULL,
  max_properties INTEGER NOT NULL,
  per_unit_price NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  stripe_price_id TEXT,             -- Stripe price object ID for billing
  is_active BOOLEAN DEFAULT true,
  card_surcharge_percent NUMERIC(5,2) NOT NULL DEFAULT 4.00,  -- 6% for free, 4% for paid tiers
  features JSONB NOT NULL DEFAULT '[]',  -- array of feature slugs included
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,        -- 'card_payments', 'tenant_screening', 'ai_lease', etc.
  name TEXT NOT NULL,
  description TEXT,
  phase INTEGER NOT NULL DEFAULT 1, -- 1, 2, 3, or 4
  min_customers INTEGER DEFAULT 0,  -- threshold to auto-enable
  is_enabled BOOLEAN DEFAULT false, -- master toggle
  min_plan_slug TEXT,               -- minimum plan required ('free', 'starter', etc.)
  category TEXT NOT NULL,           -- 'payments', 'compliance', 'ai', 'communication', 'reporting', 'integration'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_transaction_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT NOT NULL UNIQUE,       -- 'card_surcharge', 'screening_referral', 'guarantee_referral', 'insurance_referral'
  display_name TEXT NOT NULL,
  rate_percent NUMERIC(5,2),           -- e.g., 4.00 for 4%
  flat_fee NUMERIC(10,2),              -- e.g., 0.30
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  is_active BOOLEAN DEFAULT true,
  applies_to_free_tier BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 003 — Core: users, properties, leases

```sql
CREATE TABLE rp_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('landlord', 'tenant', 'occupant')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  id_type TEXT,
  id_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  avatar_url TEXT,
  preferred_currency TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  timezone TEXT DEFAULT 'America/Edmonton',
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  notification_push BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_landlord_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES rp_users(id) UNIQUE,
  plan_id UUID REFERENCES rp_plans(id),
  stripe_connect_account_id TEXT,       -- Stripe Connect account for receiving rent
  stripe_customer_id TEXT,              -- Stripe customer for billing TenantPorch subscription
  company_name TEXT,
  business_number TEXT,                 -- CRA business number for T776
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  property_count INTEGER DEFAULT 0,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'past_due', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  singlekey_partner_id TEXT,            -- SingleKey partner referral ID
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES rp_users(id),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  province_state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country_code TEXT DEFAULT 'CA',
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  unit_description TEXT,
  sticker_number TEXT,
  has_separate_entrance BOOLEAN DEFAULT true,
  has_separate_mailbox BOOLEAN DEFAULT true,
  parking_spots INTEGER DEFAULT 0,
  is_furnished BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance')),
  monthly_rent NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  lease_type TEXT NOT NULL CHECK (lease_type IN ('fixed', 'month_to_month')),
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  security_deposit NUMERIC(10,2),
  deposit_paid_date DATE,
  utility_split_percent NUMERIC(5,2) DEFAULT 40.00,
  internet_included BOOLEAN DEFAULT true,
  holdover_rent NUMERIC(10,2),
  late_fee_type TEXT DEFAULT 'flat' CHECK (late_fee_type IN ('flat', 'percent', 'none')),
  late_fee_amount NUMERIC(10,2) DEFAULT 50.00,       -- used when late_fee_type = 'flat'
  late_fee_percent NUMERIC(5,2) DEFAULT 0,            -- used when late_fee_type = 'percent' (e.g., 5.00 = 5% of rent)
  late_fee_grace_days INTEGER DEFAULT 5,              -- days after rent due date before fee triggers
  late_fee_max_per_month NUMERIC(10,2),               -- optional monthly cap on late fees
  card_surcharge_percent NUMERIC(5,2) DEFAULT 4.00,    -- inherited from plan, can be overridden per lease
  pad_enabled BOOLEAN DEFAULT false,
  pad_mandate_id TEXT,
  pad_mandate_status TEXT CHECK (pad_mandate_status IN ('pending', 'active', 'cancelled', 'failed')),
  pad_fee_paid_by TEXT DEFAULT 'landlord' CHECK (pad_fee_paid_by IN ('landlord', 'tenant', 'split')),
  pets_allowed BOOLEAN DEFAULT false,
  smoking_allowed BOOLEAN DEFAULT false,
  max_occupants INTEGER DEFAULT 3,
  guest_max_consecutive_nights INTEGER DEFAULT 3,
  guest_max_monthly_nights INTEGER DEFAULT 7,
  lease_document_url TEXT,
  province_template TEXT DEFAULT 'AB',  -- 'AB', 'ON', 'BC', etc.
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_lease_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rp_leases(id),
  user_id UUID REFERENCES rp_users(id),
  role TEXT NOT NULL CHECK (role IN ('tenant', 'permitted_occupant')),
  is_primary_contact BOOLEAN DEFAULT false,
  liability_notes TEXT,                  -- e.g., 'Full liability for permitted occupant actions'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lease_id, user_id)
);
```

### 004 — Financial

```sql
CREATE TABLE rp_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rp_leases(id),
  tenant_id UUID REFERENCES rp_users(id),
  amount NUMERIC(10,2) NOT NULL,
  surcharge_percent NUMERIC(5,2) DEFAULT 0,
  surcharge_amount NUMERIC(10,2) DEFAULT 0,
  total_charged NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) DEFAULT 0,     -- TenantPorch's net revenue from this payment
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('etransfer', 'credit_card', 'debit_card', 'cash', 'cheque', 'pad')),  -- pad = Pre-Authorized Debit via Stripe ACSS
  payment_for_month DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
  stripe_payment_id TEXT,
  stripe_connect_transfer_id TEXT,
  confirmed_by UUID REFERENCES rp_users(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_utility_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  lease_id UUID REFERENCES rp_leases(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  utility_type TEXT NOT NULL CHECK (utility_type IN ('electricity', 'gas', 'water_sewer', 'waste', 'combined')),
  total_amount NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  tenant_share_percent NUMERIC(5,2) NOT NULL DEFAULT 40.00,
  tenant_amount NUMERIC(10,2) NOT NULL,
  bill_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue')),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_security_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rp_leases(id),
  amount NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  received_date DATE NOT NULL,
  trust_account_deposited_date DATE,
  trust_account_name TEXT,
  interest_rate NUMERIC(5,4),
  interest_accrued NUMERIC(10,2) DEFAULT 0,
  returned_date DATE,
  returned_amount NUMERIC(10,2),
  deductions_total NUMERIC(10,2) DEFAULT 0,
  deductions_statement_url TEXT,
  status TEXT DEFAULT 'held' CHECK (status IN ('held', 'returned', 'disputed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_deposit_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID REFERENCES rp_security_deposits(id),
  category TEXT NOT NULL CHECK (category IN ('rent_arrears', 'utilities', 'damage', 'cleaning', 'other')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_late_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rp_leases(id),
  payment_for_month DATE NOT NULL,
  fee_amount NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  reason TEXT DEFAULT 'Rent not received by grace period deadline',
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'waived')),
  waived_by UUID REFERENCES rp_users(id),
  waived_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```



### 004c — Pre-authorized debit (PAD) via Stripe ACSS

```sql
CREATE TABLE rp_pad_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rp_leases(id),
  tenant_id UUID REFERENCES rp_users(id),
  stripe_mandate_id TEXT NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  bank_institution TEXT,
  bank_last_four TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  frequency TEXT DEFAULT 'monthly',
  debit_day INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled', 'failed')),
  authorized_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  last_debit_date DATE,
  last_debit_status TEXT,
  next_debit_date DATE,
  failure_count INTEGER DEFAULT 0,
  max_failures INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_pad_debits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES rp_pad_mandates(id),
  payment_id UUID REFERENCES rp_payments(id),
  amount NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'processing', 'succeeded', 'failed', 'returned')),
  failure_reason TEXT,
  stripe_fee NUMERIC(10,2),
  connect_fee NUMERIC(10,2),
  platform_fee NUMERIC(10,2) DEFAULT 10.00,   -- TenantPorch $10 flat fee per successful debit
  total_landlord_cost NUMERIC(10,2),           -- stripe_fee + connect_fee + platform_fee
  initiated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**PAD cron job (1st of each month):**
1. Query all `rp_pad_mandates` WHERE status = 'active'
2. For each mandate, create a Stripe PaymentIntent with `payment_method_types: ['acss_debit']`
3. Insert `rp_pad_debits` row with status = 'initiated'
4. Stripe processes the debit (3-5 business days)
5. Webhook `payment_intent.succeeded` → update debit status, create `rp_payments` record, update `rp_rent_schedule`
6. Webhook `payment_intent.payment_failed` → update debit status, increment failure_count, notify both parties, auto-pause mandate if failures >= max_failures

**PAD pricing (Stripe ACSS Debit):**
- 0.8% per transaction, capped at $5.00 CAD
- Plus Stripe Connect: 0.5% + $0.25 per payout
- Total on $1,300 rent: ~$11.75
- Failed debit: $7.00 CAD
- Dispute: $15.00 CAD
- PAD available on Starter+ tiers only (not free tier)
- Landlord absorbs fees by default (configurable per lease)

### 004b — Rent schedule & tracking

```sql
CREATE TABLE rp_rent_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rp_leases(id),
  due_date DATE NOT NULL,
  amount_due NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due', 'partial', 'paid', 'overdue', 'waived')),
  amount_paid NUMERIC(10,2) DEFAULT 0,
  balance_owing NUMERIC(10,2),
  payment_id UUID REFERENCES rp_payments(id),
  late_fee_id UUID REFERENCES rp_late_fees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

When a lease is created, auto-generate one `rp_rent_schedule` row per month of the lease term. Cron job on the 1st flips status from 'upcoming' to 'due'. On grace day + 1, if unpaid, flips to 'overdue' and creates late fee. Partial payments update `amount_paid` and `balance_owing`. Balance carries forward to the next month's dashboard display.

### 005 — Maintenance

```sql
CREATE TABLE rp_maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  tenant_id UUID REFERENCES rp_users(id),
  category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'appliance', 'hvac', 'structural', 'pest', 'general')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'acknowledged', 'in_progress', 'scheduled', 'completed', 'cancelled')),
  assigned_to TEXT,
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  tenant_responsible BOOLEAN DEFAULT false,
  scheduled_date DATE,
  completed_date DATE,
  landlord_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_maintenance_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES rp_maintenance_requests(id),
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('initial', 'progress', 'completed')),
  uploaded_by UUID REFERENCES rp_users(id),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_maintenance_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES rp_maintenance_requests(id),
  sender_id UUID REFERENCES rp_users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 006 — Documents, inspections, inventory

```sql
CREATE TABLE rp_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  lease_id UUID REFERENCES rp_leases(id),
  uploaded_by UUID REFERENCES rp_users(id),
  category TEXT NOT NULL CHECK (category IN ('lease', 'schedule_a', 'schedule_b', 'inspection_movein', 'inspection_moveout', 'utility_bill', 'notice', 'insurance', 'receipt', 'other')),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  visible_to_tenant BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  lease_id UUID REFERENCES rp_leases(id),
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('move_in', 'move_out', 'periodic')),
  inspection_date DATE NOT NULL,
  inspected_by_landlord TEXT,
  inspected_by_tenant TEXT,
  overall_notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'signed')),
  signed_by_landlord BOOLEAN DEFAULT false,
  signed_by_tenant BOOLEAN DEFAULT false,
  report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES rp_inspections(id),
  room TEXT NOT NULL,
  item TEXT NOT NULL,
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'na')),
  photos_taken BOOLEAN DEFAULT false,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE rp_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  room TEXT,
  condition_at_movein TEXT,
  condition_at_moveout TEXT,
  estimated_value NUMERIC(10,2),
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_lease_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_code TEXT NOT NULL,      -- 'AB', 'ON', 'BC'
  country_code TEXT DEFAULT 'CA',
  name TEXT NOT NULL,               -- 'Alberta Residential Tenancy Agreement'
  version TEXT NOT NULL,            -- '2026-v1'
  template_url TEXT,
  is_active BOOLEAN DEFAULT true,
  legal_reviewed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```


### 006b — Lease signing (built-in e-signatures)

```sql
CREATE TABLE rp_signing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rp_leases(id),
  document_id UUID REFERENCES rp_documents(id),
  document_hash TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_signed', 'completed', 'cancelled', 'expired')),
  created_by UUID REFERENCES rp_users(id),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  signed_document_url TEXT,              -- final PDF with all signatures + audit trail
  pdf_emailed_to_landlord BOOLEAN DEFAULT false,
  pdf_emailed_to_tenants BOOLEAN DEFAULT false,
  pdf_saved_to_profiles BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_signing_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_request_id UUID REFERENCES rp_signing_requests(id),
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_role TEXT NOT NULL CHECK (signer_role IN ('landlord', 'tenant', 'permitted_occupant', 'guarantor', 'witness')),
  signing_order INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'viewed', 'signed', 'declined')),
  viewed_all_pages BOOLEAN DEFAULT false,
  signature_method TEXT CHECK (signature_method IN ('typed', 'drawn', 'uploaded')),
  signed_name TEXT,                      -- used when method = 'typed'
  signature_image_url TEXT,              -- used when method = 'drawn' or 'uploaded' (stored in rp-documents bucket)
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  geolocation TEXT,
  decline_reason TEXT,
  notified_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_signing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_request_id UUID REFERENCES rp_signing_requests(id),
  participant_id UUID REFERENCES rp_signing_participants(id),
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 006c — Move-out reports & security deposit return workflow

```sql
-- Move-out checklist (extends rp_inspections)
CREATE TABLE rp_moveout_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rp_leases(id),
  property_id UUID REFERENCES rp_properties(id),
  inspection_id UUID REFERENCES rp_inspections(id),    -- linked move-out inspection
  moveout_date DATE NOT NULL,
  keys_returned BOOLEAN DEFAULT false,
  keys_returned_count INTEGER DEFAULT 0,
  premises_cleaned BOOLEAN DEFAULT false,
  all_belongings_removed BOOLEAN DEFAULT false,
  forwarding_address TEXT,
  forwarding_email TEXT,
  final_meter_readings JSONB,             -- {"electricity": "12345", "gas": "67890"}
  final_utility_amount NUMERIC(10,2),
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  damage_found BOOLEAN DEFAULT false,
  damage_description TEXT,
  damage_photos JSONB,                    -- array of photo URLs
  estimated_repair_cost NUMERIC(10,2),
  cleaning_required BOOLEAN DEFAULT false,
  estimated_cleaning_cost NUMERIC(10,2),
  landlord_notes TEXT,
  tenant_agrees BOOLEAN,                  -- tenant signs off on findings
  tenant_dispute_notes TEXT,              -- if tenant disagrees
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'walkthrough_scheduled', 'walkthrough_complete', 'report_sent', 'tenant_reviewed', 'finalized', 'disputed')),
  walkthrough_date TIMESTAMPTZ,
  report_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deposit return workflow
CREATE TABLE rp_deposit_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID REFERENCES rp_security_deposits(id),
  lease_id UUID REFERENCES rp_leases(id),
  moveout_report_id UUID REFERENCES rp_moveout_reports(id),
  original_deposit NUMERIC(10,2) NOT NULL,
  interest_accrued NUMERIC(10,2) DEFAULT 0,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  -- Deduction categories
  deduction_unpaid_rent NUMERIC(10,2) DEFAULT 0,
  deduction_unpaid_utilities NUMERIC(10,2) DEFAULT 0,
  deduction_damages NUMERIC(10,2) DEFAULT 0,
  deduction_cleaning NUMERIC(10,2) DEFAULT 0,
  deduction_other NUMERIC(10,2) DEFAULT 0,
  deduction_other_description TEXT,
  total_deductions NUMERIC(10,2) DEFAULT 0,
  refund_amount NUMERIC(10,2),            -- deposit + interest - deductions
  -- Evidence for each deduction
  evidence_urls JSONB DEFAULT '[]',       -- array of photo/document URLs
  -- Return method
  return_method TEXT CHECK (return_method IN ('etransfer', 'cheque', 'direct_deposit')),
  return_reference TEXT,                   -- cheque number or e-transfer confirmation
  returned_at TIMESTAMPTZ,
  -- Statement
  statement_pdf_url TEXT,                  -- generated PDF statement
  statement_emailed_at TIMESTAMPTZ,
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'calculating', 'statement_sent', 'tenant_reviewed', 'returned', 'disputed', 'rtdrs_filed')),
  tenant_agrees BOOLEAN,
  tenant_dispute_notes TEXT,
  dispute_deadline DATE,                   -- RTA deadline for tenant to dispute
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Move-out + deposit return workflow:**

1. Lease approaching end → system sends 30/14/7 day reminders to schedule move-out walkthrough
2. Landlord schedules walkthrough date → tenant notified
3. Both attend walkthrough → landlord fills move-out inspection (rp_inspections) + move-out report (rp_moveout_reports)
4. System auto-compares move-in vs move-out inspection items side-by-side, highlights differences
5. Landlord documents any damages with photos, enters estimated costs
6. System generates deposit return calculation:
   - Original deposit + interest accrued
   - Minus: unpaid rent, unpaid utilities, damage costs, cleaning costs
   - = Refund amount
7. Landlord reviews and sends deposit return statement PDF to tenant
8. Tenant reviews in portal — agrees or disputes with notes
9. If agreed: landlord returns deposit via e-transfer/cheque, records in system
10. If disputed: system tracks dispute deadline per RTA, provides RTDRS filing guidance
11. All documents (inspection comparison, deposit statement, photos) saved to tenant and landlord profiles

### 007 — Communication & notifications

```sql
CREATE TABLE rp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  sender_id UUID REFERENCES rp_users(id),
  recipient_id UUID REFERENCES rp_users(id),
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_formal_notice BOOLEAN DEFAULT false,
  notice_type TEXT,
  delivery_method TEXT CHECK (delivery_method IN ('portal', 'email', 'mail', 'personal')),
  deemed_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES rp_users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rent_due', 'rent_overdue', 'payment_received', 'maintenance_update', 'document_uploaded', 'notice', 'utility_bill', 'screening_complete', 'general')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_notice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_code TEXT NOT NULL,
  name TEXT NOT NULL,
  notice_type TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_rta_compliant BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 008 — Partners & referrals

```sql
CREATE TABLE rp_partner_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug TEXT NOT NULL UNIQUE,     -- 'singlekey', 'duuo', 'transunion', 'square_one'
  partner_name TEXT NOT NULL,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('screening', 'rent_guarantee', 'insurance', 'listing')),
  api_base_url TEXT,
  referral_commission_percent NUMERIC(5,2),
  is_active BOOLEAN DEFAULT false,
  phase INTEGER NOT NULL DEFAULT 2,     -- which phase this becomes available
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rp_referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES rp_partner_integrations(id),
  landlord_id UUID REFERENCES rp_users(id),
  tenant_id UUID REFERENCES rp_users(id),
  event_type TEXT NOT NULL,              -- 'screening_completed', 'guarantee_purchased', 'insurance_purchased'
  partner_reference_id TEXT,
  gross_amount NUMERIC(10,2),
  commission_amount NUMERIC(10,2),
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```


### 008b — Tenant applications, contractors & additional services

```sql
-- Tenant applications (pre-screening)
CREATE TABLE rp_tenant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  landlord_id UUID REFERENCES rp_users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  current_address TEXT,
  current_landlord_name TEXT,
  current_landlord_phone TEXT,
  current_landlord_email TEXT,
  employer_name TEXT,
  monthly_income NUMERIC(10,2),
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  number_of_occupants INTEGER DEFAULT 1,
  has_pets BOOLEAN DEFAULT false,
  pet_details TEXT,
  move_in_date DATE,
  additional_notes TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'approved', 'declined', 'withdrawn')),
  screening_id UUID,                 -- link to rp_screening_applications if screening requested
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reference checks (sent to previous landlords)
CREATE TABLE rp_reference_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES rp_tenant_applications(id),
  referee_name TEXT NOT NULL,
  referee_email TEXT NOT NULL,
  referee_phone TEXT,
  relationship TEXT DEFAULT 'previous_landlord',
  questions JSONB,                   -- array of Q&A pairs
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'completed', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  response JSONB,
  token TEXT UNIQUE,                 -- unique link for referee to respond
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contractor directory
CREATE TABLE rp_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES rp_users(id),
  name TEXT NOT NULL,
  company TEXT,
  specialty TEXT CHECK (specialty IN ('plumbing', 'electrical', 'hvac', 'general', 'appliance', 'locksmith', 'cleaning', 'pest_control', 'landscaping', 'other')),
  phone TEXT,
  email TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Appliance & warranty tracking
CREATE TABLE rp_appliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  name TEXT NOT NULL,                -- 'Washer', 'Dryer', 'Refrigerator'
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  purchase_price NUMERIC(10,2),
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expense tracking (mortgage, insurance, property tax, etc.)
CREATE TABLE rp_property_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  category TEXT NOT NULL CHECK (category IN ('mortgage', 'property_tax', 'insurance', 'hoa_condo_fee', 'repairs', 'snow_removal', 'landscaping', 'legal', 'accounting', 'advertising', 'other')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  frequency TEXT DEFAULT 'one_time' CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'annually')),
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  is_tax_deductible BOOLEAN DEFAULT true,
  t776_line TEXT,                    -- CRA T776 line mapping (e.g., 'Line 8860 - Insurance')
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rent reporting consent (tenant opts in for credit bureau reporting)
CREATE TABLE rp_rent_reporting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rp_leases(id),
  tenant_id UUID REFERENCES rp_users(id),
  provider TEXT DEFAULT 'frontlobby',
  provider_tenant_id TEXT,
  monthly_fee NUMERIC(10,2) DEFAULT 8.00,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  fee_paid_by TEXT DEFAULT 'tenant' CHECK (fee_paid_by IN ('tenant', 'landlord')),
  consent_given_at TIMESTAMPTZ,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'paused', 'cancelled')),
  last_reported_month DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shared expenses (beyond utilities — snow removal, lawn care, etc.)
CREATE TABLE rp_shared_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES rp_properties(id),
  lease_id UUID REFERENCES rp_leases(id),
  description TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  currency_code TEXT REFERENCES rp_currencies(code) DEFAULT 'CAD',
  tenant_share_percent NUMERIC(5,2) NOT NULL,
  tenant_amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 009 — Audit log

```sql
CREATE TABLE rp_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES rp_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 011 — Seed data

```sql
-- Currencies (CAD active, others ready for future)
INSERT INTO rp_currencies (code, name, symbol, decimal_places, is_active, sort_order) VALUES
  ('CAD', 'Canadian Dollar', '$', 2, true, 1),
  ('USD', 'US Dollar', '$', 2, false, 2),
  ('GBP', 'British Pound', '£', 2, false, 3),
  ('EUR', 'Euro', '€', 2, false, 4),
  ('AUD', 'Australian Dollar', '$', 2, false, 5),
  ('INR', 'Indian Rupee', '₹', 2, false, 6);

-- Plans
INSERT INTO rp_plans (slug, name, min_properties, max_properties, per_unit_price, currency_code, card_surcharge_percent, features, sort_order) VALUES
  ('free', 'Free', 1, 1, 0, 'CAD', 6.00, '["tenant_portal","etransfer_tracking","ab_lease_template","document_storage","maintenance_requests","rent_reminders","late_fee_tracking","inspections","inventory_tracking"]', 1),
  ('starter', 'Starter', 1, 5, 7.00, 'CAD', 4.00, '["tenant_portal","etransfer_tracking","ab_lease_template","document_storage","maintenance_requests","rent_reminders","late_fee_tracking","inspections","inventory_tracking","card_payments","utility_splitting","financial_reports","multi_property_dashboard","lease_builder","esigning"]', 2),
  ('growth', 'Growth', 6, 20, 6.00, 'CAD', 4.00, '["tenant_portal","etransfer_tracking","ab_lease_template","document_storage","maintenance_requests","rent_reminders","late_fee_tracking","inspections","inventory_tracking","card_payments","utility_splitting","financial_reports","multi_property_dashboard","lease_builder","esigning","t776_export","sms_notifications","tenant_screening","rent_guarantee","listing_syndication"]', 3),
  ('pro', 'Pro', 21, 50, 4.00, 'CAD', 4.00, '["tenant_portal","etransfer_tracking","ab_lease_template","document_storage","maintenance_requests","rent_reminders","late_fee_tracking","inspections","inventory_tracking","card_payments","utility_splitting","financial_reports","multi_property_dashboard","lease_builder","esigning","t776_export","sms_notifications","tenant_screening","rent_guarantee","listing_syndication","api_access","bulk_operations","advanced_analytics","priority_support"]', 4),
  ('enterprise', 'Enterprise', 51, 9999, 0, 'CAD', 3.50, '["all"]', 5);

-- Feature flags
INSERT INTO rp_feature_flags (slug, name, description, phase, min_customers, is_enabled, min_plan_slug, category) VALUES
  ('tenant_portal', 'Tenant portal', 'Tenants log in, view lease, pay rent', 1, 0, true, 'free', 'core'),
  ('etransfer_tracking', 'E-transfer tracking', 'Track e-transfer rent payments', 1, 0, true, 'free', 'payments'),
  ('ab_lease_template', 'Alberta lease template', 'RTA-compliant Alberta lease', 1, 0, true, 'free', 'compliance'),
  ('document_storage', 'Document storage', 'Upload and view documents', 1, 0, true, 'free', 'core'),
  ('maintenance_requests', 'Maintenance requests', 'Submit and manage maintenance', 1, 0, true, 'free', 'core'),
  ('rent_reminders', 'Rent reminders', 'Automated email on 28th', 1, 0, true, 'free', 'communication'),
  ('late_fee_tracking', 'Late fee tracking', 'Auto-flag overdue, log fees', 1, 0, true, 'free', 'payments'),
  ('inspections', 'Inspections', 'Digital move-in/move-out checklists', 1, 0, true, 'free', 'compliance'),
  ('inventory_tracking', 'Inventory tracking', 'Schedule A with condition tracking', 1, 0, true, 'free', 'compliance'),
  ('card_payments', 'Card payments', 'Credit/debit via Stripe Connect', 1, 0, true, 'starter', 'payments'),
  ('utility_splitting', 'Utility bill splitting', 'Upload bill, auto-calc tenant share', 1, 0, true, 'starter', 'payments'),
  ('financial_reports', 'Financial reports', 'Monthly P&L per property', 1, 0, true, 'starter', 'reporting'),
  ('multi_property_dashboard', 'Multi-property dashboard', 'Overview of all units', 1, 0, true, 'starter', 'core'),
  ('lease_builder', 'Custom lease builder', 'Build lease from template', 1, 0, true, 'starter', 'compliance'),
  ('esigning', 'E-signing', 'Type-to-sign with timestamp', 3, 100, false, 'starter', 'compliance'),
  ('t776_export', 'CRA T776 export', 'Rental income tax export', 2, 20, false, 'growth', 'reporting'),
  ('sms_notifications', 'SMS notifications', 'Twilio SMS for rent reminders', 2, 20, false, 'growth', 'communication'),
  ('tenant_screening', 'Tenant screening', 'SingleKey partner integration', 2, 20, false, 'growth', 'integration'),
  ('rent_guarantee', 'Rent guarantee', 'SingleKey rent guarantee referral', 2, 20, false, 'growth', 'integration'),
  ('ai_lease_assistant', 'AI lease assistant', 'Claude Haiku clause suggestions', 2, 20, false, 'growth', 'ai'),
  ('on_lease_template', 'Ontario lease template', 'Ontario standard lease', 3, 100, false, 'starter', 'compliance'),
  ('bc_lease_template', 'BC lease template', 'BC standard lease', 3, 100, false, 'starter', 'compliance'),
  ('insurance_referral', 'Insurance referral', 'Renter insurance via Duuo/Square One', 3, 100, false, 'starter', 'integration'),
  ('listing_syndication', 'Listing syndication', 'Push to RentFaster/Kijiji', 3, 100, false, 'growth', 'integration'),
  ('api_access', 'API access', 'REST API for integrations', 4, 500, false, 'pro', 'integration'),
  ('bulk_operations', 'Bulk operations', 'Multi-tenant notices, bulk tracking', 4, 500, false, 'pro', 'core'),
  ('advanced_analytics', 'Advanced analytics', 'Benchmarking and insights', 4, 500, false, 'pro', 'reporting'),
  ('white_label', 'White-label', 'Custom branding for PM companies', 4, 500, false, 'enterprise', 'core');

-- Transaction fees
INSERT INTO rp_transaction_fees (fee_type, display_name, rate_percent, flat_fee, currency_code, is_active, applies_to_free_tier, description) VALUES
  ('card_surcharge', 'Card processing surcharge', 4.00, 0, 'CAD', true, false, 'Charged to tenant on credit/debit payments'),
  ('stripe_processing', 'Stripe processing fee', 2.90, 0.30, 'CAD', true, false, 'Stripe base processing fee (paid from surcharge)'),
  ('stripe_connect', 'Stripe Connect fee', 0.50, 0.25, 'CAD', true, false, 'Stripe Connect platform fee per payout'),
  ('screening_referral', 'Tenant screening referral', 20.00, 0, 'CAD', false, false, 'Commission from SingleKey per screening'),
  ('guarantee_referral', 'Rent guarantee referral', 20.00, 0, 'CAD', false, false, 'Commission from SingleKey per guarantee policy'),
  ('insurance_referral', 'Renter insurance referral', 15.00, 0, 'CAD', false, false, 'Commission from Duuo/Square One per policy'),
  ('pad_processing', 'PAD processing fee (Stripe ACSS)', 0.80, 0, 'CAD', true, false, '0.8% capped at $5 CAD per debit. Landlord absorbs by default. Not available on free tier.'),
  ('pad_connect', 'PAD Connect payout fee', 0.50, 0.25, 'CAD', true, false, 'Stripe Connect fee on PAD payouts to landlord bank account'),
  ('pad_failure', 'PAD failed debit fee', 0, 7.00, 'CAD', true, false, '$7 CAD per failed/returned debit');

-- Partner integrations
INSERT INTO rp_partner_integrations (partner_slug, partner_name, integration_type, referral_commission_percent, is_active, phase) VALUES
  ('singlekey', 'SingleKey', 'screening', 20.00, false, 2),
  ('singlekey_guarantee', 'SingleKey Rent Guarantee', 'rent_guarantee', 20.00, false, 2),
  ('duuo', 'Duuo Insurance', 'insurance', 15.00, false, 3),
  ('square_one', 'Square One Insurance', 'insurance', 15.00, false, 3),
  ('rentfaster', 'RentFaster', 'listing', 0, false, 3);

-- Lease templates
INSERT INTO rp_lease_templates (province_code, country_code, name, version, is_active) VALUES
  ('AB', 'CA', 'Alberta Residential Tenancy Agreement', '2026-v1', true),
  ('ON', 'CA', 'Ontario Standard Lease', '2026-v1', false),
  ('BC', 'CA', 'BC Residential Tenancy Agreement', '2026-v1', false);

-- Notice templates (Alberta)
INSERT INTO rp_notice_templates (province_code, name, notice_type, subject_template, body_template) VALUES
  ('AB', '24-Hour Entry Notice', 'entry_notice', 'Notice of Entry — {{property_address}}', 'This notice is to inform you that the Landlord or their agent will enter the Premises at {{property_address}} on {{entry_date}} at {{entry_time}} for the following reason: {{reason}}. This notice is provided pursuant to the Residential Tenancies Act, SA 2004, c. R-17.1.'),
  ('AB', '14-Day Substantial Breach Notice', 'breach_notice', 'Notice of Substantial Breach — {{property_address}}', 'This notice is to inform you that you are in substantial breach of your Residential Tenancy Agreement dated {{lease_start_date}} for the Premises at {{property_address}}. The nature of the breach is as follows: {{breach_description}}. You have fourteen (14) days from the date of this notice to remedy this breach. If the breach is not remedied within the notice period, the Landlord may apply to the Residential Tenancy Dispute Resolution Service (RTDRS) or the Court of King''s Bench of Alberta for an order of possession and damages. Pursuant to the Residential Tenancies Act, SA 2004, c. R-17.1.'),
  ('AB', 'Rent Increase Notice', 'rent_increase', 'Notice of Rent Increase — {{property_address}}', 'This notice is to inform you that the monthly rent for the Premises at {{property_address}} will increase from {{current_rent}} to {{new_rent}} effective {{effective_date}}. This notice is provided with the minimum notice period required under the Residential Tenancies Act, SA 2004, c. R-17.1. If you do not agree to the increase, you may terminate the tenancy by providing written notice as required by the Act.'),
  ('AB', '14-Day Non-Payment Notice', 'nonpayment_notice', 'Notice of Termination for Non-Payment — {{property_address}}', 'This notice is to inform you that rent in the amount of {{amount_owing}} for the period {{rent_period}} is overdue. You have fourteen (14) days from the date of this notice to pay the full amount owing. If payment is not received within the notice period, the Landlord may apply to the RTDRS or Court of King''s Bench for an order of termination and possession. Pursuant to the Residential Tenancies Act, SA 2004, c. R-17.1.'),
  ('AB', 'Notice to Vacate (Fixed Term End)', 'vacate_fixed_term', 'Reminder: Lease Ending — {{property_address}}', 'This is a reminder that your fixed-term Residential Tenancy Agreement for the Premises at {{property_address}} will expire on {{lease_end_date}}. As per the terms of your Agreement, you are required to vacate the Premises by 11:59 PM on {{lease_end_date}}. Please ensure all personal belongings are removed, all keys are returned, and the Premises are left in a reasonably clean condition. A move-out inspection will be scheduled within one week of your departure.'),
  ('AB', 'Security Deposit Return Statement', 'deposit_statement', 'Security Deposit Statement — {{property_address}}', 'This statement provides an accounting of the security deposit held for the Premises at {{property_address}}. Original deposit: {{deposit_amount}}. Interest accrued: {{interest_amount}}. Deductions: {{deductions_list}}. Total deductions: {{deductions_total}}. Amount returned: {{return_amount}}. This statement is provided in accordance with the Residential Tenancies Act, SA 2004, c. R-17.1. If you dispute any deductions, you may apply to the RTDRS within the time limits prescribed by the Act.'),
  ('AB', 'Lease Renewal Offer', 'renewal_offer', 'Lease Renewal Offer — {{property_address}}', 'Your current lease for the Premises at {{property_address}} expires on {{lease_end_date}}. We would like to offer you a renewal under the following terms: Term: {{new_start_date}} to {{new_end_date}}. Monthly rent: {{new_rent}}. All other terms remain the same unless otherwise noted. Please respond by {{response_deadline}} to confirm your acceptance or discuss alternative arrangements.'),
  ('AB', 'Pet Violation Notice', 'pet_violation', 'Notice of Lease Violation: No-Pet Policy — {{property_address}}', 'This notice is to inform you that a pet has been observed at the Premises at {{property_address}} in violation of Section {{clause_number}} of your Residential Tenancy Agreement, which prohibits pets of any kind. Details: {{violation_details}}. You are required to remove the pet from the Premises immediately. The Landlord reserves the right to recover reasonable costs of professional cleaning and may issue a 14-day notice to terminate the tenancy if this breach is not remedied.'),
  ('AB', 'Smoking Violation Notice', 'smoking_violation', 'Notice of Lease Violation: No-Smoking Policy — {{property_address}}', 'This notice is to inform you that smoking has been detected at the Premises at {{property_address}} in violation of Section {{clause_number}} of your Residential Tenancy Agreement, which prohibits smoking of any kind on the entire property. Details: {{violation_details}}. The Landlord reserves the right to recover reasonable costs of professional cleaning and deodorizing and may issue a 14-day notice to terminate the tenancy if this breach is not remedied.'),
  ('AB', 'Noise Complaint Notice', 'noise_complaint', 'Notice of Noise Complaint — {{property_address}}', 'This notice is to inform you that a noise complaint has been received regarding the Premises at {{property_address}}. Date and time of incident: {{incident_date}} at {{incident_time}}. Description: {{complaint_details}}. As per your Residential Tenancy Agreement, quiet hours are from 10:00 PM to 8:00 AM daily. Repeated noise complaints may constitute grounds for termination of the tenancy under the Residential Tenancies Act.'),
  ('AB', 'Unauthorized Occupant Notice', 'unauthorized_occupant', 'Notice of Unauthorized Occupant — {{property_address}}', 'This notice is to inform you that an unauthorized person appears to be residing at the Premises at {{property_address}} in violation of the occupancy terms of your Residential Tenancy Agreement. The maximum permitted occupancy is {{max_occupants}} persons. Guests may not stay for more than {{guest_max_nights}} consecutive nights or {{guest_max_monthly}} nights in any 30-day period without prior written consent. Please remedy this breach within fourteen (14) days.'),
  ('AB', 'Maintenance Access Notice', 'maintenance_access', 'Scheduled Maintenance — {{property_address}}', 'This notice is to inform you that maintenance work has been scheduled at the Premises at {{property_address}} on {{service_date}} between {{start_time}} and {{end_time}}. Nature of work: {{work_description}}. Contractor: {{contractor_name}}. Please ensure access to the relevant areas. If this time is not suitable, please contact us within 24 hours to arrange an alternative.'),
  ('AB', 'Rent Receipt', 'rent_receipt', 'Rent Receipt — {{property_address}} — {{payment_month}}', 'Receipt of rent payment for the Premises at {{property_address}}. Tenant: {{tenant_name}}. Period: {{payment_month}}. Amount: {{payment_amount}}. Payment method: {{payment_method}}. Date received: {{payment_date}}. Confirmation ID: {{confirmation_id}}. Landlord: {{landlord_name}}.'),
  ('AB', 'Utility Bill Statement', 'utility_statement', 'Utility Bill — {{property_address}} — {{billing_period}}', 'Utility bill statement for the Premises at {{property_address}}. Billing period: {{period_start}} to {{period_end}}. Utility type: {{utility_type}}. Total bill: {{total_amount}}. Your share ({{split_percent}}%): {{tenant_amount}}. A copy of the original bill is attached. Payment is due within 7 days of this notice. Please submit payment via e-transfer or card through the TenantPorch portal.');

-- Platform settings
INSERT INTO rp_settings (key, value, description) VALUES
  ('platform_name', '"TenantPorch"', 'Platform display name'),
  ('default_currency', '"CAD"', 'Default currency for new accounts'),
  ('default_timezone', '"America/Edmonton"', 'Default timezone'),
  ('default_province', '"AB"', 'Default province for lease templates'),
  ('late_fee_default_type', '"flat"', 'Default late fee type: flat, percent, or none'),
  ('late_fee_default_amount', '50.00', 'Default flat late fee amount'),
  ('late_fee_grace_days', '5', 'Days after rent due before late fee triggers'),
  ('card_surcharge_percent', '4.00', 'Default card payment surcharge percentage'),
  ('rent_reminder_day', '28', 'Day of month to send rent reminder emails'),
  ('late_fee_check_day', '6', 'Day of month to check for unpaid rent and create late fees'),
  ('max_free_properties', '1', 'Number of properties on free tier'),
  ('support_email', '"support@tenantporch.com"', 'Support email address'),
  ('stripe_connect_country', '"CA"', 'Stripe Connect country for onboarding');

-- Seed: Shah property (current lease)
-- (Run after users are created via auth signup)
-- This data should be inserted during onboarding or via admin seed script
```

---

## STORAGE BUCKETS

```
rp-documents          — Leases, schedules, notices, receipts
rp-maintenance-photos — Maintenance request photos
rp-inspections        — Inspection report photos
rp-utility-bills      — Scanned utility bills
rp-avatars            — User profile photos
rp-templates          — Lease template PDFs
```

---

## ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://scnmdbkpjlkitxdoeiaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from dashboard>

# Stripe Connect
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# Resend
RESEND_API_KEY=re_...

# SingleKey (Phase 2)
SINGLEKEY_API_KEY=
SINGLEKEY_PARTNER_ID=

# Twilio (Phase 2)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Claude API (Phase 2 — AI features)
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://tenantporch.com
NEXT_PUBLIC_APP_NAME=TenantPorch
NEXT_PUBLIC_DEFAULT_CURRENCY=CAD
NEXT_PUBLIC_DEFAULT_TIMEZONE=America/Edmonton
```

---

## CURRENCY IMPLEMENTATION

### How it works:
1. `rp_currencies` table holds all supported currencies. Only CAD is `is_active=true` at launch.
2. `rp_landlord_profiles.currency_code` stores the landlord's selected billing currency.
3. `rp_properties.currency_code` can override per property (for landlords with units in different countries).
4. `rp_leases.currency_code` is set when lease is created, based on the property's currency.
5. All `rp_payments`, `rp_utility_bills`, `rp_late_fees`, `rp_deposit_deductions`, `rp_maintenance_requests` carry `currency_code` to record the transaction currency.
6. Frontend formats all amounts using `Intl.NumberFormat` with the appropriate currency code.
7. Pricing page reads `rp_plans` and displays prices in the landlord's currency.
8. To launch in a new market: activate the currency in `rp_currencies`, add plans with that currency in `rp_plans`, add lease templates for that jurisdiction in `rp_lease_templates`.

### Currency display utility:
```typescript
function formatCurrency(amount: number, currencyCode: string = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}
```

### Admin toggle for new markets:
The landlord settings page shows a currency selector. At launch it's locked to CAD with a note: "More currencies coming soon." When `rp_currencies.is_active` is toggled to true for a currency, it appears in the selector. No code deploy needed.

---

## PHASED BUILD PLAN

### Phase 1: Foundation & Auth (Days 1–3)
- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Connect Supabase, run all migrations (001–011)
- Supabase Auth (email/password + magic links)
- Role-based routing (/tenant/* and /admin/*)
- Layout shell (sidebar + bottom tabs from Stitch mockups)
- Currency formatting utility reads from `rp_currencies`
- Pricing reads from `rp_plans` — not hardcoded

### Phase 2: Tenant Portal (Days 4–8)
- Dashboard, payments, maintenance, documents, profile
- All screens from Stitch mockups (tenant_*)
- E-transfer tracking (display landlord email, tenant marks sent, landlord confirms)
  - Lease signing flow:
    a) Landlord creates/uploads lease → system generates SHA-256 hash
    b) Adds signers in order (landlord(s) first, then tenant(s))
    c) Each signer receives unique link via email
    d) Signing page: signer views full document, then chooses signature method:
       - TYPE: enter full legal name in signature font
       - DRAW: draw signature on canvas (touch or mouse) → saved as PNG
       - UPLOAD: upload image of wet signature → stored in rp-documents bucket
    e) System captures: signature + IP + timestamp + user agent + geolocation + document hash
    f) When all signers complete: generate final PDF with signature page + audit trail
    g) Email signed PDF to ALL parties (landlord + every tenant)
    h) Save signed PDF to rp_documents linked to the lease and each user's profile
    i) Lease clause includes: "This Agreement may be executed electronically pursuant to the Electronic Transactions Act, SA 2001, c. E-5.5."
  - Receipt auto-generated → stored in rp_documents
- Stripe Connect integration (Direct charges, 4% surcharge from `rp_transaction_fees`)
- Receipt PDF generation
- Real-time maintenance chat (Supabase Realtime on `rp_maintenance_messages`)

### Phase 3: Landlord Admin (Days 9–14)
- Dashboard, tenant management, financials, maintenance kanban, documents, messages
- All screens from Stitch mockups (landlord_*)
- Utility bill upload → auto-calc tenant share → send notification
- Security deposit tracker with interest calculation
- Notice generator using `rp_notice_templates`
- Stripe Connect onboarding (landlord connects their bank account)
- Subscription billing (landlord pays TenantPorch based on `rp_plans`)

### Phase 4: Automation (Days 15–17)
- PAD auto-debit cron (1st of month): query active mandates → create Stripe ACSS PaymentIntents → track in rp_pad_debits
  - Rent reminder cron (28th of month, reads `rp_settings.rent_reminder_day`)
- Late fee cron (reads each lease's `late_fee_grace_days` to determine check date per lease, creates fee based on `late_fee_type` + `late_fee_amount` or `late_fee_percent`)
- Deposit interest calculation (monthly)
- Email templates via Resend (8 templates)
- In-app notifications (real-time via Supabase)
- Audit logging on key tables

### Phase 5: Landing Page & Onboarding (Days 18–20)
- Public landing page (from Stitch mockups)
- Pricing page reads dynamically from `rp_plans` — shows per-unit slider
- Landlord onboarding wizard (property → lease → invite tenants → upload docs)
- Tenant invite flow (magic link → setup password → linked to lease)
- PWA support
- SEO, accessibility, performance polish

---

## PRICING PAGE BEHAVIOR

The pricing page must read from `rp_plans` and render dynamically:

1. Show a slider: "How many properties do you manage?" (1–50)
2. At 1: show Free tier card highlighted
3. At 2–5: show Starter card with calculated total ($7 × properties)
4. At 6–20: show Growth card with calculated total ($6 × properties)
5. At 21–50: show Pro card with calculated total ($4 × properties)
6. At 50+: show "Contact us for Enterprise pricing"
7. Each card lists included features from `rp_plans.features` JSONB array
8. Feature descriptions pulled from `rp_feature_flags` by slug
9. Currency symbol from landlord's selected currency (or default CAD)
10. "Start free" CTA on every card — always start on free tier, upgrade when adding 2nd property

---

## DEPLOYMENT CHECKLIST

- [ ] All migrations applied (001–011)
- [ ] Seed data loaded (currencies, plans, features, fees, partners, templates, settings)
- [ ] RLS policies on all rp_ tables
- [ ] Storage buckets created with policies
- [ ] Stripe Connect account configured (CA)
- [ ] Stripe webhook endpoint registered
- [ ] Resend domain verified (tenantporch.com)
- [ ] Environment variables in Vercel
- [ ] DNS: tenantporch.com → Vercel
- [ ] Pricing page renders from database (not hardcoded)
- [ ] Currency defaults to CAD, selector shows only active currencies
- [ ] Feature flags control feature visibility in UI
- [ ] Smoke test: signup → add property → invite tenant → pay rent → maintenance request
