# TenantPorch — Claude Code Phase Prompts

**Copy each phase prompt into Claude Code when ready. Test each phase before starting the next.**

---

## PHASE 2: Tenant Portal

### Prerequisites checklist
- [ ] Phase 1 complete: auth works, layout shell renders, 46 rp_ tables exist
- [ ] Seed data loaded (currencies, plans, add-ons, features, settings)
- [ ] Landing page renders at /
- [ ] Login/signup functional
- [ ] Role-based routing: landlords → /admin/*, tenants → /tenant/*

### Prompt — paste into Claude Code:

```
Read docs/Claude_Code_Prompt_TenantPorch_v2.md for full schema and
docs/TenantPorch_Design_Reference.md for design tokens.
Reference stitch/ folder for screen layouts.

FIRST: Seed test data before building pages:
1. If not already seeded, create test users:
   - Landlord: Raminder Shah (ss.raminder@gmail.com, role=landlord)
   - Tenant: Lovepreet Kaur (kaurlovepreet761@yahoo.com, role=tenant)
   - Tenant: Anmol Brar (Anmolbrar310@gmail.com, role=tenant)
   - Occupant: Jaskaran Singh (role=occupant)
2. Create property: 220B Red Sky Terrace NE, Calgary, AB T3N 1M9
3. Create lease: May 1 - Sep 30, 2026, $1,300/month, $1,300 deposit
4. Link tenants to lease via rp_lease_tenants
5. Generate rp_rent_schedule rows (5 months: May-Sep 2026)
6. Create 3 sample rp_notifications for the tenant
7. Create 1 sample rp_maintenance_request with 1 photo

BUILD these pages in order:

PAGE 1 — Tenant Dashboard (/tenant/dashboard)
Reference: stitch/tenant_dashboard_desktop + stitch/tenant_dashboard_mobile

Fetch server-side from Supabase:
- Current user from rp_users
- Active lease from rp_leases via rp_lease_tenants
- Property from rp_properties
- Current month rent from rp_rent_schedule
- Last 5 notifications from rp_notifications
- Lease countdown (days remaining)

Build these components:
- Welcome card: "Welcome, {first_name}" + property address
- Rent status card: next due date, amount (formatted via
  Intl.NumberFormat with currency from rp_leases.currency_code),
  status badge (Paid=green, Due=amber, Overdue=red, Partial=blue),
  "Pay now" button → /tenant/payments
- Quick actions: Pay Rent, Submit Maintenance, View Lease, Contact Landlord
- Activity feed: last 5 rp_notifications with icon + title + relative time
- Lease info card: start/end dates, days remaining, monthly rent
- Mobile: stack vertically, bottom tabs active on "Home"

PAGE 2 — Payments (/tenant/payments)
Reference: stitch/tenant_payments_desktop + stitch/tenant_payments_mobile

Fetch:
- All rp_payments for this lease, ordered desc
- All rp_rent_schedule for this lease
- Any rp_pad_mandates for this tenant
- Lease surcharge rate (lease.card_surcharge_percent)
- PAD availability: check if landlord has PAD enabled
  (query landlord's plan features + active add-ons — but DO NOT
  expose plan/pricing info to the tenant UI)

Build:
- Summary card: current balance (sum of balance_owing > 0), next due date
- If PAD active: "Auto-debit active" green badge with next debit date
- Payment history chart: Recharts bar, last 6 months from rp_rent_schedule
- "Pay rent" button → modal with 3 tabs:

  TAB 1 — E-transfer:
  Show landlord email from rp_users WHERE role=landlord
  Memo instruction: "220B Red Sky Terrace NE - {Month Year}"
  Button: "I've sent the e-transfer"
  → INSERT rp_payments (method=etransfer, status=pending)
  → INSERT rp_notifications for landlord

  TAB 2 — Card (credit/debit):
  Read surcharge from lease.card_surcharge_percent
  (this is set by the landlord's plan — tenant doesn't see plan details)
  Show: "A {surcharge_pct}% processing fee applies to card payments"
  Calculate: rent + (rent × surcharge%) = total
  Display clearly: "Rent: $1,300 + Processing fee: ${fee} = Total: ${total}"
  Button: "Pay ${total} by card" → POST /api/stripe/create-checkout-session
  On success: confirmation card + receipt download link
  On cancel: "Payment cancelled" message

  TAB 3 — PAD auto-debit (ONLY show this tab if landlord has PAD enabled):
  Check: does the landlord's plan/add-ons include PAD?
    → Query rp_landlord_profiles → plan → check if pad_auto_debit feature
      is in plan.features OR rp_landlord_addons has active pad_auto_debit
    → If landlord has NOT enabled PAD: DO NOT show this tab at all.
      Tenant sees only e-transfer and card tabs. No upgrade prompts.
      No mention of plans or pricing. Tenants never see plan/add-on info.

  If PAD is enabled by landlord AND no mandate exists for this tenant:
    Show: "Set up automatic payments"
    "Your rent of $1,300 will be debited from your bank account
    on the 1st of each month. No surcharges."

    Show inline bank details form (Direct API — no Stripe redirect):
    - Institution number: input (3 digits, with helper tooltip showing
      common bank codes: BMO=001, Scotia=002, RBC=003, TD=004,
      CIBC=010, ATB=219, Tangerine=614)
    - Transit number: input (5 digits)
    - Account number: input (7-12 digits, masked after entry)
    - Show "Where to find these numbers" link with void cheque diagram
    - Checkbox: "I authorize TenantPorch to debit my account monthly
      for rent at {property_address}"
    - Security note: "Bank details are securely processed by Stripe.
      TenantPorch never stores your full account number."
    - Button: "Set up auto-debit"
      → validate inputs (regex)
      → POST /api/stripe/pad/setup with bank details + IP + user_agent
      → on success: show "Auto-debit is being set up. Your first
        debit will process within 3-5 business days."
      → on error: show specific error message

  If mandate active:
    Show status card:
    "Auto-debit active"
    Bank: {bank_institution} ending in {bank_last_four}
    Next debit: {next_debit_date}
    Amount: {lease.monthly_rent}
    "Cancel auto-debit" button (with confirmation modal)

  If mandate paused/failed:
    Warning: "Your auto-debit could not be processed"
    Reason: {failure_reason}
    "Update bank details" or "Reactivate" button

- Transaction history: list/table
  Date | Amount | Method badge | Status badge | Receipt download
  Mobile: card layout instead of table

PAGE 3 — Payment detail (/tenant/payments/[id])
- Fetch rp_payments by ID (verify tenant owns it via lease)
- Receipt display: TenantPorch header, property, tenant, amount,
  surcharge, total, method, date, confirmation ID
- Download PDF button
- Back to /tenant/payments

PAGE 4 — Maintenance (/tenant/maintenance)
Reference: stitch/tenant_maintenance_desktop + stitch/tenant_maintenance_mobile

- "New request" button → modal:
  Category: dropdown (Plumbing, Electrical, Appliance, HVAC,
    Structural, Pest, General)
  Title: text (required)
  Description: textarea (required)
  Photos: drag-drop + file picker, multiple
    → upload to Supabase Storage 'rp-maintenance-photos'
    → create rp_maintenance_photos with photo_type=initial
  Urgency: Low / Medium / High / Emergency
  Submit → INSERT rp_maintenance_requests + photos
  → INSERT rp_notifications for landlord

- Request list: cards with title, category badge, urgency badge,
  status badge, date, photo thumbnail
- Filter by status (All, Open, Completed)
- Mobile: full-width cards, "New request" as sticky bottom button

PAGE 5 — Maintenance detail (/tenant/maintenance/[id])
- Fetch request + rp_maintenance_messages + rp_maintenance_photos
- Status timeline (vertical)
- Photo gallery grouped by type
- Conversation thread: messages with sender name, avatar, text, time
- Message input: textarea + "Add photo" + Send
  → INSERT rp_maintenance_messages
  → optionally upload photo
- Supabase Realtime subscription on rp_maintenance_messages
  for live updates

PAGE 6 — Documents (/tenant/documents)
Reference: stitch/tenant_documents_desktop + stitch/tenant_documents_mobile

- Fetch rp_documents WHERE visible_to_tenant = true, grouped by category
- Accordion sections: Lease, Schedule A, Schedule B, Inspections,
  Utility Bills, Receipts, Insurance, Other
- Each doc: icon, title, date, size, View + Download buttons
- Upload section: "Upload a document" for renter's insurance etc.
  → upload to 'rp-documents' bucket
  → INSERT rp_documents with category
  → notify landlord
- Signing banner: if pending rp_signing_requests exists,
  show "Lease awaiting your signature" with link

PAGE 7 — Profile (/tenant/profile)
Reference: stitch/tenant_profile_desktop + stitch/tenant_profile_mobile

- Personal info (read-only): name, email, phone, unit address, lease term
- Emergency contact (editable): name + phone, save button
- Notifications: toggles for email/SMS/push
- Change password: current + new + confirm → Supabase auth.updateUser
- PAD status (if applicable): mandate info + link to payments

PAGE 8 — Messages (/tenant/messages)
- Fetch rp_messages WHERE recipient_id = current user
- Message list with subject, preview, date, read/unread badge
- Click → full message view with reply option
- Formal notices section: filter is_formal_notice = true
- Supabase Realtime for new messages

SHARED COMPONENTS:
- CurrencyDisplay: reads currency_code, formats via Intl.NumberFormat
- StatusBadge: Paid=green, Due=amber, Overdue=red, Pending=blue,
  Partial=purple, Cancelled=gray
- PaymentMethodBadge: icons for etransfer, card, PAD, cash, cheque
- FileUploader: drag-drop + picker → Supabase Storage
- NotificationBell: unread count badge, dropdown, Realtime subscription
- DateDisplay: format in America/Edmonton via date-fns
- RentCountdown: "Due in X days" or "X days overdue"

API ROUTES:
1. POST /api/stripe/create-checkout-session
   - Read surcharge from lease.card_surcharge_percent
   - Calculate total = rent + (rent × surcharge%)
   - Create Stripe Checkout (Direct charges via Connect)
   - Application fee = platform revenue
   - INSERT rp_payments status=pending
   - Return checkout URL

2. POST /api/stripe/webhook
   - Verify STRIPE_WEBHOOK_SECRET
   - checkout.session.completed → confirm payment, update rent_schedule,
     generate receipt PDF, notify both parties
   - payment_intent.succeeded (PAD) → same flow
   - payment_intent.payment_failed → update pad_debits, notify, increment failures

3. POST /api/stripe/pad/setup
   Read docs/Stripe_ACSS_Integration_Spec.md for exact implementation.
   Using Stripe ACSS Direct API (NOT Stripe Elements):
   - Receive from frontend: institution_number (3 digits),
     transit_number (5 digits), account_number (7-12 digits)
   - Validate inputs (regex): institution /^\d{3}$/, transit /^\d{5}$/,
     account /^\d{7,12}$/
   - Create Stripe Customer on landlord's connected account (if not exists)
   - Create PaymentIntent with:
     payment_method_types: ['acss_debit']
     payment_method_data: { type: 'acss_debit', acss_debit: {
       institution_number, transit_number, account_number },
       billing_details: { name, email } }
     payment_method_options: { acss_debit: { mandate_options: {
       payment_schedule: 'interval',
       interval_description: 'Monthly rent payment on the 1st',
       transaction_type: 'personal' },
       verification_method: 'automatic' } }
     application_fee_amount: platform fee in cents ($15=1500 or $10=1000)
     confirm: true
     mandate_data: { customer_acceptance: { type: 'online',
       online: { ip_address, user_agent } } }
   - On success (status=processing): save mandate to rp_pad_mandates
     with stripe_customer_id, stripe_mandate_id, stripe_payment_method_id,
     bank_name, bank_last_four, bank_institution, bank_transit
   - Insert first rp_pad_debits record with status=initiated
   - Return { status: 'processing', message } to frontend
   - Webhooks handle completion (payment_intent.succeeded/failed)

4. POST /api/documents/generate-pdf
   - Generate receipt or statement PDF
   - Upload to rp-documents bucket
   - Return URL

All pages responsive. Desktop from stitch/*_desktop, mobile from stitch/*_mobile.
Follow design system: Manrope headlines, Inter body, no 1px borders,
surface color shifts, navy sidebar.
```

### Phase 2 testing checklist
- [ ] Dashboard shows real data from seed
- [ ] Rent status shows correct due date, amount, currency
- [ ] E-transfer flow: mark sent → pending → landlord can see it
- [ ] Card payment: Stripe Checkout opens with correct surcharge
- [ ] PAD tab shows correct pricing based on plan
- [ ] Maintenance: create request with photos
- [ ] Maintenance: send message, appears in real-time
- [ ] Documents: view/download files
- [ ] Documents: upload renter's insurance
- [ ] Profile: update emergency contact
- [ ] Profile: change password
- [ ] Notification bell shows unread count
- [ ] All pages work on mobile (390px)
- [ ] Currency displays as CAD with $

---

## PHASE 3: Landlord Admin Portal

### Prerequisites
- [ ] Phase 2 complete and tested
- [ ] Stripe test mode working (card payments flow)

### Prompt — paste into Claude Code:

```
Read docs/Claude_Code_Prompt_TenantPorch_v2.md for schema and
docs/TenantPorch_Design_Reference.md for styling.
Reference stitch/landlord_*/ for layouts.

Build Phase 3: Landlord Admin Portal.

PAGE 1 — Admin Dashboard (/admin/dashboard)
Reference: stitch/landlord_dashboard_desktop + stitch/landlord_dashboard_mobile

Fetch:
- Landlord profile from rp_landlord_profiles (plan, property count)
- All properties from rp_properties WHERE landlord_id = current user
- Current month payment status across all leases
- Pending utility bills
- Active maintenance requests
- Recent notifications

Build:
- Property overview card: address, status badge, tenant names
- Financial summary cards (grid of 4):
  * Rent collected this month: sum confirmed payments / total expected
  * Outstanding balance: sum of overdue rent_schedule entries
  * Utilities pending: count of rp_utility_bills WHERE status=sent
  * Security deposits held: sum from rp_security_deposits WHERE status=held
- Rent collection indicator: green checkmark (all paid) or red alert
- Recent activity feed: last 10 from payments + maintenance + documents
- Quick actions: Record Payment, New Utility Bill, Send Notice, View Reports
- Subscription card: current plan, property count, monthly cost
  calculated as: base_price + MAX(0, properties - included) × overage_rate

PAGE 2 — Tenant Management (/admin/tenants)
Reference: stitch/landlord_tenants_mobile

- Tenant cards: avatar, name, unit, lease dates, rent status badge,
  call/email/text buttons
- Permitted occupants shown with "No financial obligations" badge
- Click → /admin/tenants/[id]

PAGE 3 — Tenant Detail (/admin/tenants/[id])
- Full profile, lease info, payment history table, maintenance history,
  documents, landlord notes (private textarea, saved to rp_users or
  separate notes field)
- "Send message" button
- Payment history: table with all rp_payments for this tenant

PAGE 4 — Invite Tenant (/admin/tenants/invite)
Reference: stitch/tenant_invite_desktop + stitch/tenant_invite_mobile
- Select property + lease
- Enter tenant email(s)
- Role: tenant or permitted_occupant
- Send → magic link email via Resend
- Tenant clicks link → setup password → auto-linked to lease

PAGE 5 — Properties (/admin/properties)
Reference: stitch/landlord_properties_mobile
- Property list: address, status (occupied/vacant), current tenant names,
  monthly rent, lease expiry
- Click → /admin/properties/[id]

PAGE 6 — Property Detail (/admin/properties/[id])
- Property info: address, unit description, parking, furnished status
- Current lease summary
- "Add property" button (check plan limits):
  If property_count >= plan max_properties_hard (for free=1):
    Show upgrade prompt
  If property_count >= included_properties:
    Show overage notice: "Adding this property will increase your
    bill by ${overage_rate}/month"
  Else: add normally

PAGE 7 — Financials (/admin/financials)
Reference: stitch/landlord_financials_mobile

- Monthly revenue chart (Recharts, last 12 months)
- Rent tracker table: month, due date, amount, date paid, method,
  status, late fee
- E-transfer confirmation: pending e-transfers with "Confirm" button
  → UPDATE rp_payments status=confirmed, confirmed_by, confirmed_at
  → UPDATE rp_rent_schedule
  → Generate receipt PDF
  → Notify tenant

PAGE 8 — Utility Billing (/admin/financials/utilities)
- "New utility bill" button → form:
  * Select property
  * Billing period (start/end dates)
  * Utility type dropdown
  * Total amount
  * Upload bill image → rp-utility-bills bucket
  * Auto-calculate: tenant_share = total × lease.utility_split_percent
  * Preview: "Total: $120 → Tenant pays: $48 (40%)"
  * "Send to tenant" → INSERT rp_utility_bills, email tenant, notify
- Utility history table with status tracking

PAGE 9 — Security Deposits (/admin/financials/deposits)
- Deposit list: per lease, amount, date received, trust account,
  interest accrued, status
- Detail view: add/remove deductions with evidence URLs
- "Generate return statement" →
  Calculate: deposit + interest - deductions = refund
  Generate PDF statement
  Email to tenant
  Track tenant response (agree/dispute)

PAGE 10 — Maintenance Kanban (/admin/maintenance)
Reference: stitch/landlord_maintenance_mobile
- Kanban columns: New | In Progress | Scheduled | Completed
- Drag-drop between columns (desktop) or dropdown status change (mobile)
- Cards: title, tenant name, urgency badge, date, photo thumbnail
- Click → detail: update status, assign contractor, add notes,
  cost tracking, mark tenant_responsible, before/after photos

PAGE 11 — Documents (/admin/documents)
Reference: stitch/landlord_documents_mobile
- Document library by category
- Upload with drag-drop, set visible_to_tenant toggle
- Notice generator:
  * Select template from rp_notice_templates
  * Auto-fill placeholders from lease/property/tenant data
  * Preview rendered notice
  * "Send" → email via Resend + INSERT rp_messages (is_formal_notice=true)
  * Log delivery_method and deemed_received_at
- Lease signing:
  * "Send for signing" → create rp_signing_requests
  * Add signers in order (landlord(s) first, then tenant(s))
  * Each signer gets unique link emailed
  * Track status: pending → viewed → signed per participant
  * When all signed: generate final PDF with signatures + audit trail
  * Email signed PDF to all parties
  * Save to rp_documents linked to lease

PAGE 12 — Lease Signing Page (/sign/[token]) — PUBLIC route
- Verify token from rp_signing_participants
- Show full lease PDF in browser (pdf.js viewer)
- Track page views (scroll tracking → viewed_all_pages flag)
- At bottom: signature area with 3 options:
  * TYPE: text input rendered in signature font (e.g., Dancing Script)
  * DRAW: HTML5 canvas, finger/mouse/stylus, save as PNG
  * UPLOAD: file picker for signature image
- "I agree" checkbox + legal text referencing Electronic Transactions Act
- "Sign" button → capture signature + IP + timestamp + user_agent
  + geolocation + document hash
- INSERT rp_signing_audit_log
- UPDATE rp_signing_participants status=signed
- If all participants signed → generate final PDF, email all, save
- Confirmation page with download link

PAGE 13 — Messages (/admin/messages)
Reference: stitch/landlord_messages_mobile
- Thread per tenant with read/unread badges
- Compose message → INSERT rp_messages + email tenant
- Formal notice tab: filter is_formal_notice=true
  Show delivery method + deemed-received date
- Supabase Realtime for live updates

PAGE 14 — Settings (/admin/settings)
- Account info: name, email, phone, company name, business number
- Subscription management:
  * Current plan display with billing formula
  * Property count vs included properties
  * Monthly charge calculation shown
  * "Change plan" → plan selector with price comparison
  * Active add-ons list with monthly + setup fee paid status
  * "Add add-on" → add-on cards with pricing
    Each shows: monthly fee, setup fee (if not yet paid), features
    Purchase → Stripe Checkout for setup fee + create subscription
- Stripe Connect:
  * Connection status
  * "Connect your bank account" → Stripe Connect onboarding
  * Once connected: show account status, payout schedule
- PAD configuration:
  * View active mandates across all tenants
  * Platform fee display ($15 free / $10 paid)
- Late fee policy defaults:
  * Fee type: flat / percent / none
  * Amount / percentage
  * Grace period days
  * Monthly cap
  * These defaults apply to new leases
- Currency selection (locked to CAD for now, show "More coming soon")
- Notification preferences
```

### Phase 3 testing checklist
- [ ] Admin dashboard shows financial summary cards with real data
- [ ] E-transfer confirmation flow works (pending → confirmed → receipt)
- [ ] Utility bill: upload → calculate → send to tenant
- [ ] Security deposit: add deductions → generate return statement PDF
- [ ] Maintenance kanban: drag between columns, status updates
- [ ] Notice generator: select template → auto-fill → send → logged
- [ ] Lease signing: send → signer receives link → sign → PDF generated → emailed to all
- [ ] Draw signature works on mobile (touch canvas)
- [ ] Add property respects plan limits (overage notice or upgrade prompt)
- [ ] Subscription card shows correct billing calculation
- [ ] Settings: change plan, add add-on with setup fee payment
- [ ] Stripe Connect onboarding flow works
- [ ] All pages responsive on mobile

---

## PHASE 4: Automation & Email

### Prerequisites
- [ ] Phase 3 complete and tested
- [ ] Stripe webhook endpoint working
- [ ] Resend account created, domain verified

### Prompt — paste into Claude Code:

```
Read docs/Claude_Code_Prompt_TenantPorch_v2.md for schema.

Build Phase 4: Automation, cron jobs, and email system.

1. SUPABASE EDGE FUNCTIONS (Cron jobs):

a) rp-rent-reminder
   Schedule: 28th of each month at 9:00 AM America/Edmonton
   Logic:
   - Query rp_leases WHERE status=active
   - For each lease, check rp_rent_schedule for next month
   - If status='upcoming' (rent not yet paid for next month):
     → INSERT rp_notifications for each tenant on the lease
     → Send email via Resend using rent-reminder template
   - Read rp_settings for rent_reminder_day to confirm day

b) rp-rent-due-flipper
   Schedule: 1st of each month at 12:01 AM America/Edmonton
   Logic:
   - Query rp_rent_schedule WHERE due_date = first of current month
     AND status = 'upcoming'
   - UPDATE status = 'due'
   - INSERT rp_notifications for tenants: "Rent is due today"

c) rp-late-fee-check
   Schedule: daily at 9:00 AM America/Edmonton
   Logic:
   - For each active lease, read late_fee_grace_days
   - Check rp_rent_schedule WHERE status IN ('due', 'partial')
     AND due_date + grace_days < today
   - If match and no rp_late_fees row exists for that month:
     → Calculate fee based on lease.late_fee_type:
       'flat' → use late_fee_amount
       'percent' → use (monthly_rent × late_fee_percent / 100)
       'none' → skip
     → Cap at late_fee_max_per_month if set
     → INSERT rp_late_fees
     → UPDATE rp_rent_schedule status = 'overdue'
     → INSERT rp_notifications for tenant + landlord
     → Send email via Resend using late-notice template

d) rp-pad-auto-debit
   Schedule: 1st of each month at 6:00 AM America/Edmonton
   Read docs/Stripe_ACSS_Integration_Spec.md for exact Stripe API calls.
   Logic:
   - Query rp_pad_mandates WHERE status = 'active'
     JOIN rp_leases, rp_landlord_profiles (to get connected account + plan)
   - For each mandate:
     → Determine platform fee: check landlord plan
       Free plan = $15 (1500 cents), Paid plans = $10 (1000 cents)
     → Create Stripe PaymentIntent on landlord's connected account:
       {
         amount: mandate.amount in cents,
         currency: 'cad',
         customer: mandate.stripe_customer_id,
         payment_method: mandate.stripe_payment_method_id,
         payment_method_types: ['acss_debit'],
         confirm: true,
         off_session: true,  // recurring — tenant not present
         mandate: mandate.stripe_mandate_id,
         application_fee_amount: platformFee in cents,
         metadata: { lease_id, tenant_id, payment_for_month, payment_type: 'pad_rent_recurring' }
       }
     → INSERT rp_pad_debits: status=initiated, platform_fee, stripe_payment_intent_id
     → On Stripe error (e.g., mandate revoked): call handleDebitFailure()
   - Webhook payment_intent.succeeded → confirm payment, generate receipt
   - Webhook payment_intent.payment_failed → increment failure_count,
     pause mandate if failures >= max_failures (3), notify both parties

e) rp-deposit-interest
   Schedule: 1st of each month at midnight
   Logic:
   - Query rp_security_deposits WHERE status = 'held'
   - Calculate monthly interest per Alberta Ministerial Regulation rate
   - UPDATE interest_accrued
   - Log in rp_audit_log

f) rp-lease-expiry-reminders
   Schedule: daily at 9:00 AM
   Logic:
   - Query rp_leases WHERE status=active
   - If end_date - today = 90 days → send 90-day reminder to landlord
   - If end_date - today = 60 days → send 60-day reminder to both
   - If end_date - today = 30 days → send 30-day reminder to both
   - If end_date - today = 14 days → send "schedule move-out walkthrough"
   - If end_date - today = 7 days → send final reminder to both

2. RESEND EMAIL SYSTEM:

Install: resend
Create: /lib/email.ts — email service utility

Email templates (React Email or HTML, branded with TenantPorch header
in navy #041534, gold accent #D4A853, footer with tenantporch.com):

a) welcome.tsx
   Trigger: new tenant account created
   Content: Welcome to TenantPorch, your login details, link to portal

b) rent-reminder.tsx
   Trigger: rp-rent-reminder cron (28th)
   Content: "Rent of ${amount} is due on {date}", pay now link

c) rent-due.tsx
   Trigger: rp-rent-due-flipper cron (1st)
   Content: "Your rent is due today", pay now link

d) late-notice.tsx
   Trigger: rp-late-fee-check cron
   Content: "Late fee of ${fee} applied", pay now to avoid further action

e) payment-confirmed.tsx
   Trigger: payment confirmation (any method)
   Content: confirmation details, receipt PDF attached or linked

f) maintenance-update.tsx
   Trigger: maintenance request status change
   Content: request title, old → new status, any landlord notes

g) utility-bill.tsx
   Trigger: landlord sends utility bill
   Content: billing period, total, tenant share, bill image, pay link

h) notice-served.tsx
   Trigger: landlord sends formal notice
   Content: notice type, full notice text, deemed-received info

i) lease-signing-invite.tsx
   Trigger: landlord sends lease for signing
   Content: "You have a lease to review and sign", sign link, expiry date

j) lease-signed-complete.tsx
   Trigger: all parties have signed
   Content: "Lease fully executed", signed PDF attached, all parties CC'd

k) tenant-invite.tsx
   Trigger: landlord invites tenant
   Content: "You've been invited to join TenantPorch", setup link

l) lease-expiry-reminder.tsx
   Trigger: rp-lease-expiry-reminders cron
   Content: "Your lease expires in {X} days", renewal/move-out info

m) deposit-return-statement.tsx
   Trigger: landlord generates deposit return
   Content: itemized statement, refund amount, dispute info

All emails: from notifications@tenantporch.com, reply-to landlord email.
Configure Resend domain DNS for tenantporch.com.

3. IN-APP NOTIFICATIONS:

- NotificationBell component (already in Phase 2 shared components)
- Supabase Realtime subscription on rp_notifications
  WHERE user_id = current user
- New notifications: increment badge count, show in dropdown
- Click notification → mark read, navigate to action_url
- "Mark all as read" button
- Notification preferences respected (check rp_users notification flags
  before sending email/SMS)

4. AUDIT LOGGING:

Create Supabase database triggers on key tables:
- rp_payments: log INSERT and UPDATE (status changes)
- rp_maintenance_requests: log status changes
- rp_leases: log any modifications
- rp_signing_participants: log signing events
- rp_security_deposits: log deduction changes

Each trigger:
→ INSERT rp_audit_log with user_id (from auth.uid()),
  action, entity_type, entity_id, details (JSONB with old/new values)

5. RENT RECEIPT PDF GENERATION:

On every confirmed payment (card, PAD, or e-transfer):
- Generate PDF receipt:
  * TenantPorch header + logo
  * "Rent Receipt" title
  * Property address
  * Tenant name
  * Payment period (e.g., "May 2026")
  * Base rent amount
  * Surcharge (if card payment)
  * Total charged
  * Payment method
  * Date received / confirmed
  * Confirmation ID
  * Landlord name + signature
  * "Pursuant to s.20, Residential Tenancies Act, SA 2004"
- Upload to rp-documents bucket (category=receipt, visible_to_tenant=true)
- Set rp_payments.receipt_url
- Attach to payment-confirmed email
```

### Phase 4 testing checklist
- [ ] Rent reminder cron sends email on 28th (test manually)
- [ ] Rent status flips to 'due' on 1st
- [ ] Late fee created correctly after grace period
- [ ] Late fee respects lease-level settings (flat/percent/none)
- [ ] PAD auto-debit cron creates PaymentIntents
- [ ] PAD platform fee correct ($15 free / $10 paid)
- [ ] Deposit interest accrues monthly
- [ ] Lease expiry reminders at 90/60/30/14/7 days
- [ ] All 13 email templates render correctly
- [ ] Emails branded with TenantPorch design
- [ ] Receipt PDF generates with correct data
- [ ] Notifications appear in real-time via bell
- [ ] Audit log captures payment + maintenance + lease changes
- [ ] Notification preferences respected (no email if toggled off)

---

## PHASE 5: Payments & Billing (Stripe)

### Prerequisites
- [ ] Phase 4 complete
- [ ] Stripe account verified and live
- [ ] ACSS Debit approved
- [ ] Stripe Connect enabled

### Prompt — paste into Claude Code:

```
Build Phase 5: Complete Stripe integration for subscription billing
and payment processing.

1. STRIPE CONNECT ONBOARDING:
   - /admin/settings → "Connect your bank account"
   - Create Stripe Connect Standard account for the landlord
   - Redirect to Stripe's hosted onboarding
   - Webhook: account.updated → update rp_landlord_profiles.stripe_connect_account_id
   - Show connection status in settings

2. SUBSCRIPTION BILLING (landlord pays TenantPorch):
   - Create Stripe Products + Prices for each plan:
     * Free: no Stripe subscription needed
     * Starter: $14/month base
     * Growth: $40/month base
     * Pro: $60/month base
   - Overage billing: use Stripe metered billing or quantity-based
     subscription for extra properties
     Formula: base_price + MAX(0, property_count - included_properties) × overage_rate
   - When landlord adds a property beyond included:
     Update Stripe subscription quantity → prorated charge
   - Add-on billing: each add-on is a separate Stripe subscription item
     Setup fee: one-time Stripe Checkout for the setup fee amount
     Monthly: add subscription item to landlord's subscription
   - Billing portal: link to Stripe Customer Portal for
     payment method management, invoice history

3. RENT PAYMENT PROCESSING (tenant pays landlord):
   Card payments:
   - Use Stripe Connect Direct charges
   - Charge goes to landlord's connected Stripe account
   - Application fee = surcharge amount (your revenue)
   - Surcharge: 6% on free tier, 4% on paid tiers
     (read from landlord's plan.card_surcharge_percent)

   PAD payments (Stripe ACSS Debit — Direct API):
   Read docs/Stripe_ACSS_Integration_Spec.md for full implementation.
   - Direct API: tenant enters bank details (institution, transit, account)
     inside TenantPorch — no Stripe redirect or hosted form
   - First payment: PaymentIntent with payment_method_data creates
     the mandate + processes first debit simultaneously
   - Recurring: reuse saved payment_method + mandate via off_session PaymentIntent
   - Platform fee: $15 (free tier) or $10 (paid tiers)
     collected as application_fee_amount on each PaymentIntent
   - All charges are Direct charges on landlord's connected Stripe account
   - Handle failures: increment failure_count on mandate,
     auto-pause after 3 consecutive failures, notify both parties,
     fall back to manual payment
   - Handle mandate.updated webhook: if tenant revokes at their bank,
     update mandate status, notify landlord
   - Test mode: use institution=000, transit=11000, account=000123456789

4. WEBHOOK HANDLERS (expand existing):
   - payment_intent.succeeded → confirm payment, receipt, notify
   - payment_intent.payment_failed → log failure, notify, increment count
   - setup_intent.succeeded → create PAD mandate
   - checkout.session.completed → confirm card payment OR setup fee
   - customer.subscription.updated → sync plan changes
   - customer.subscription.deleted → downgrade to free
   - account.updated → Connect account status
   - invoice.payment_failed → landlord subscription payment failed
```

---

## PHASE 6: Landing Page, Onboarding & Polish

### Prerequisites
- [ ] Phase 5 complete, Stripe fully working

### Prompt — paste into Claude Code:

```
Build Phase 6: Public website, onboarding, and production polish.

1. LANDING PAGE (/) — if not already built in Phase 1c:
   Reference: stitch/landing_page_desktop + stitch/landing_page_mobile
   - Hero: "Your front porch to smarter renting"
     CTAs: "Get started free" → /signup, "Tenant login" → /login
   - Features section: 6 cards (PAD auto-debit, lease templates,
     tenant portal, maintenance, inspections, utility splitting)
   - How it works: 3 steps (Sign up → Add property → Invite tenants)
   - Pricing section: DYNAMIC from rp_plans table
     * Slider: "How many properties?" (1–50)
     * Show recommended plan with calculated monthly cost
     * Formula: base_price + MAX(0, n - included) × overage_rate
     * Plan cards with feature lists from rp_plans.features
     * Add-on cards below with monthly + setup fees from rp_plan_addons
     * "Start free" CTA on every option
   - Testimonials (placeholder for now)
   - FAQ accordion
   - Footer: TenantPorch, links, support email

2. PRICING PAGE (/pricing):
   - Full pricing calculator with slider
   - All 4 plans + Enterprise contact
   - Feature comparison table (features from rp_feature_flags)
   - Add-ons section with setup fees displayed
   - FAQ about billing, surcharges, PAD fees

3. ONBOARDING WIZARD (/onboarding):
   Reference: stitch/onboarding_desktop + stitch/onboarding_mobile
   Multi-step form with progress bar:
   Step 1: Account created (done at signup)
   Step 2: Add your property
     - Address, unit type, description, parking, furnished
     - INSERT rp_properties
   Step 3: Set up your lease
     - Lease type, dates, rent amount, deposit, utility split
     - Late fee policy (type, amount, grace days)
     - INSERT rp_leases + rp_rent_schedule
   Step 4: Invite your tenants
     - Enter tenant email(s), select role (tenant/occupant)
     - Send invite emails via Resend
   Step 5: Upload documents
     - Lease PDF, Schedule A, Schedule B
     - Upload to rp-documents bucket
   Step 6: Choose your plan
     - Show plan options based on property count
     - If 1 property: "You're on Free — upgrade anytime"
     - If 2+: Stripe Checkout for Starter/Growth/Pro
   Step 7: Connect your bank (Stripe Connect)
     - "Connect now" or "Skip for later"
   Each step saves progress (can resume later)

4. TENANT INVITE FLOW:
   Reference: stitch/tenant_invite_desktop + stitch/tenant_invite_mobile
   - Landlord sends invite → tenant gets email with magic link
   - /invite/[token] → verify token, show:
     * Property address, landlord name, lease term
     * "Create your password" form
     * Submit → create auth user, INSERT rp_users, link to lease
     * Redirect to /tenant/dashboard

5. MOVE-OUT WORKFLOW:
   - 30/14/7 day automated reminders (already in Phase 4 crons)
   - Landlord → /admin/properties/[id]/moveout:
     * Schedule walkthrough date
     * Digital move-out inspection form (same structure as move-in)
     * Side-by-side comparison: auto-load move-in inspection,
       show move-out entries next to each item, highlight differences
     * Damage documentation: add photos, descriptions, cost estimates
     * INSERT rp_moveout_reports
   - Deposit return:
     * Auto-calculate: deposit + interest - deductions = refund
     * Itemize deductions with evidence (linked photos/invoices)
     * Generate PDF deposit return statement
     * Email to tenant
     * Tenant reviews in portal: agree or dispute
     * INSERT rp_deposit_returns, track status

6. PWA SUPPORT:
   - Install next-pwa
   - manifest.json: TenantPorch branding, #041534 theme
   - Service worker: cache dashboard shell for offline
   - App icons: multiple sizes from TenantPorch logo
   - "Add to home screen" prompt on mobile

7. PRODUCTION POLISH:
   - Loading skeletons on all data-fetching pages
   - Empty states with illustrations + CTAs
   - Toast notifications (sonner) for success/error
   - Confirmation modals for destructive actions
   - 404 page matching design system
   - SEO: meta tags, Open Graph images, structured data
   - Accessibility: ARIA labels, keyboard nav, focus management
   - Performance: next/image optimization, lazy loading, code splitting
   - Error boundaries with friendly error pages
   - Rate limiting on API routes
```

### Phase 6 testing checklist
- [ ] Landing page renders, responsive, pricing reads from database
- [ ] Pricing slider calculates correctly for all plan tiers
- [ ] Add-ons show with setup fees
- [ ] Onboarding wizard: complete all 7 steps
- [ ] Tenant invite: email received → click link → create account → see dashboard
- [ ] Move-out inspection: side-by-side comparison works
- [ ] Deposit return statement PDF generates correctly
- [ ] PWA: installable on iPhone + Android
- [ ] Lighthouse score > 90 for performance
- [ ] All pages have proper meta tags
- [ ] 404 page looks correct
- [ ] No console errors in production build

---

## DEPLOYMENT CHECKLIST

Before going live at tenantporch.com:

### Infrastructure
- [ ] All Supabase migrations applied (verify with list_tables)
- [ ] RLS policies on all rp_ tables (run security advisor)
- [ ] Storage buckets with correct policies
- [ ] Edge functions deployed and scheduled

### Stripe
- [ ] Live mode keys in Vercel env vars
- [ ] Webhook endpoint registered with live secret
- [ ] ACSS Debit enabled on live account
- [ ] Connect configured for CA
- [ ] Test: card payment end-to-end
- [ ] Test: PAD mandate + debit end-to-end

### Email
- [ ] Resend domain verified (tenantporch.com DNS)
- [ ] All 13 email templates tested
- [ ] From address: notifications@tenantporch.com

### DNS & Hosting
- [ ] tenantporch.com → Vercel
- [ ] SSL active
- [ ] www redirect configured

### Data
- [ ] Seed data verified (plans, currencies, features, add-ons, templates)
- [ ] Shah property data loaded for first real tenant

### Smoke test
- [ ] Landlord: signup → onboard → add property → create lease → invite tenant
- [ ] Tenant: accept invite → login → view dashboard → pay rent (card)
- [ ] PAD: setup mandate → first debit processes
- [ ] Maintenance: tenant creates → landlord responds → real-time chat
- [ ] Notice: landlord generates → tenant receives email + in-app
- [ ] Lease: send for signing → all sign → PDF emailed to everyone
- [ ] Mobile: all flows work on 390px width
