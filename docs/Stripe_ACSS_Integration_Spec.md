# TenantPorch — Stripe ACSS Debit (PAD) Integration Spec

## Overview

Stripe ACSS Debit lets you pull rent directly from a tenant's Canadian bank account. Using the **Direct API** approach (not Stripe Elements), TenantPorch controls the entire UI — the tenant enters their bank details inside the TenantPorch portal, not on a Stripe-hosted page.

## Architecture: Destination charges (not Direct charges)

**CRITICAL**: TenantPorch uses **Destination charges**, not Direct charges. This means:
- All charges (card + PAD) happen on **TenantPorch's platform Stripe account**
- ACSS Debit only needs to be enabled on TenantPorch's account (already done)
- Landlords do NOT need to enable ACSS on their connected accounts
- Money is automatically transferred to the landlord's connected account after charge
- Platform fee (application_fee) is deducted before transfer
- Tenant's bank statement shows "TenantPorch" (not landlord's name)

```
Payment flow:
Tenant's bank → ACSS Debit → TenantPorch Stripe account → Transfer → Landlord's bank
                                    ↓
                              Platform fee retained by TenantPorch
```

Landlord onboarding for Stripe Connect only requires:
- Bank account details (for receiving payouts)
- Identity verification (Stripe KYC)
- No ACSS setup, no payment method configuration


---

## Flow: Setting up PAD for a tenant

### Step 1: Create Stripe Customer (if not exists)

When a tenant first sets up PAD, create a Stripe Customer on the **landlord's connected account** (via Stripe Connect):

```typescript
// /api/stripe/pad/setup — POST
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create customer on TenantPorch's PLATFORM account (not connected account)
// because we use Destination charges — all charges happen on our account
const customer = await stripe.customers.create({
  email: tenant.email,
  name: `${tenant.first_name} ${tenant.last_name}`,
  metadata: {
    tenant_id: tenant.id,
    lease_id: lease.id,
    landlord_id: landlord.id,
    property_address: property.address_line1,
  },
});

// Save customer ID to rp_pad_mandates or rp_users
```

### Step 2: Create PaymentIntent with ACSS Debit

Create a PaymentIntent to collect the first payment AND set up the mandate for future payments:

```typescript
const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: rentAmountInCents, // $1,300 = 130000
    currency: 'cad',
    customer: customer.id,
    payment_method_types: ['acss_debit'],
    payment_method_data: {
      type: 'acss_debit',
      acss_debit: {
        institution_number: formData.institution_number, // 3 digits (e.g., '004' for TD)
        transit_number: formData.transit_number,         // 5 digits
        account_number: formData.account_number,         // 7-12 digits
      },
      billing_details: {
        name: `${tenant.first_name} ${tenant.last_name}`,
        email: tenant.email,
      },
    },
    payment_method_options: {
      acss_debit: {
        mandate_options: {
          payment_schedule: 'interval',        // recurring
          interval_description: 'Monthly rent payment on the 1st', // shown to tenant
          transaction_type: 'personal',        // personal PAD (not business)
        },
        verification_method: 'automatic',      // Stripe chooses best method
      },
    },
    // Destination: landlord's connected account receives the funds
    transfer_data: {
      destination: landlord.stripe_connect_account_id,
    },
    // Application fee = TenantPorch platform fee (deducted before transfer)
    application_fee_amount: platformFeeInCents, // $15 (free) or $10 (paid) = 1500 or 1000
    confirm: true, // Confirm immediately
    mandate_data: {
      customer_acceptance: {
        type: 'online',
        online: {
          ip_address: request.ip,
          user_agent: request.headers['user-agent'],
        },
      },
    },
    metadata: {
      lease_id: lease.id,
      tenant_id: tenant.id,
      landlord_id: landlord.id,
      property_address: property.address_line1,
      payment_for_month: paymentForMonth, // '2026-05-01'
      platform_fee: platformFee,
      payment_type: 'pad_rent',
    },
  }
  // NOTE: No stripeAccount parameter — charge happens on TenantPorch's account
);
```

### Step 3: Handle PaymentIntent status

After creation, the PaymentIntent will be in one of these states:

```typescript
switch (paymentIntent.status) {
  case 'processing':
    // Normal — ACSS debits take 3-5 business days to clear
    // Save mandate info and wait for webhook
    await saveMandate(paymentIntent);
    return { status: 'processing', message: 'Your bank debit has been initiated. It will clear in 3-5 business days.' };

  case 'requires_action':
    // Micro-deposit verification needed (rare with automatic verification)
    // Tenant will need to verify amounts deposited to their account
    return { status: 'requires_verification', next_action: paymentIntent.next_action };

  case 'succeeded':
    // Instant success (rare for first ACSS payment)
    await confirmPayment(paymentIntent);
    return { status: 'succeeded' };

  case 'requires_payment_method':
    // Bank details invalid
    return { status: 'failed', error: 'Invalid bank account details. Please check and try again.' };
}
```

### Step 4: Save mandate for recurring payments

After the first successful payment, Stripe automatically creates a Mandate. Save it for future use:

```typescript
async function saveMandate(paymentIntent) {
  // Get the payment method from platform account (Destination charges)
  const paymentMethod = await stripe.paymentMethods.retrieve(
    paymentIntent.payment_method
    // No stripeAccount — customer + payment method live on platform account
  );

  // Save to rp_pad_mandates
  await supabase.from('rp_pad_mandates').insert({
    lease_id: lease.id,
    tenant_id: tenant.id,
    stripe_mandate_id: paymentIntent.mandate,
    stripe_payment_method_id: paymentIntent.payment_method,
    stripe_customer_id: paymentIntent.customer,
    bank_institution: paymentMethod.acss_debit.institution_number,
    bank_transit: paymentMethod.acss_debit.transit_number,
    bank_last_four: paymentMethod.acss_debit.last4,
    bank_name: paymentMethod.acss_debit.bank_name, // e.g., "TD Canada Trust"
    amount: lease.monthly_rent,
    currency_code: lease.currency_code,
    debit_day: 1,
    status: 'active',
    authorized_at: new Date(),
    next_debit_date: getNextFirstOfMonth(),
  });
}
```

### Step 5: Monthly recurring debits (cron job)

On the 1st of each month, the cron job creates a new PaymentIntent reusing the saved payment method:

```typescript
// rp-pad-auto-debit edge function — runs 1st of each month
async function processMonthlyDebits() {
  const activeMandates = await supabase
    .from('rp_pad_mandates')
    .select('*, rp_leases(*), rp_users(*), rp_landlord_profiles(*)')
    .eq('status', 'active');

  for (const mandate of activeMandates.data) {
    const landlord = mandate.rp_leases.rp_landlord_profiles;
    
    // Determine platform fee based on landlord's plan
    const platformFee = landlord.plan_slug === 'free' ? 1500 : 1000; // cents

    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(mandate.amount * 100), // cents
          currency: 'cad',
          customer: mandate.stripe_customer_id,
          payment_method: mandate.stripe_payment_method_id,
          payment_method_types: ['acss_debit'],
          confirm: true,
          off_session: true, // recurring — tenant not present
          mandate: mandate.stripe_mandate_id,
          application_fee_amount: platformFee,
          metadata: {
            lease_id: mandate.lease_id,
            tenant_id: mandate.tenant_id,
            payment_for_month: getCurrentMonthFirst(),
            payment_type: 'pad_rent_recurring',
            platform_fee: platformFee / 100,
          },
        },
        {
          stripeAccount: landlord.stripe_connect_account_id,
        }
      );

      // Insert debit tracking record
      await supabase.from('rp_pad_debits').insert({
        mandate_id: mandate.id,
        amount: mandate.amount,
        currency_code: mandate.currency_code,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'initiated',
        platform_fee: platformFee / 100,
        initiated_at: new Date(),
      });

    } catch (error) {
      // Handle failure
      await handleDebitFailure(mandate, error);
    }
  }
}
```

---

## Webhooks to handle

Register these webhook events at `/api/stripe/webhook`:

```typescript
// Webhook handler
switch (event.type) {
  // === PAD PAYMENT EVENTS ===

  case 'payment_intent.processing':
    // ACSS debit initiated — takes 3-5 business days
    // Update rp_pad_debits status = 'processing'
    // No notification yet — wait for success/failure
    break;

  case 'payment_intent.succeeded':
    // Payment cleared!
    // 1. Update rp_pad_debits status = 'succeeded'
    // 2. Insert rp_payments with status = 'confirmed'
    // 3. Update rp_rent_schedule status = 'paid'
    // 4. Generate receipt PDF
    // 5. Notify tenant: "Rent payment of $1,300 confirmed"
    // 6. Notify landlord: "Rent received from [tenant]"
    // 7. Update mandate.last_debit_date and next_debit_date
    break;

  case 'payment_intent.payment_failed':
    // Debit failed (insufficient funds, account closed, etc.)
    // 1. Update rp_pad_debits status = 'failed', failure_reason
    // 2. Increment mandate.failure_count
    // 3. If failure_count >= mandate.max_failures (default 3):
    //    → Update mandate status = 'paused'
    //    → Notify landlord: "Auto-debit paused after 3 failures"
    // 4. Notify tenant: "Rent debit failed — please pay manually"
    // 5. Notify landlord: "Rent debit failed for [tenant]"
    break;

  // === MANDATE EVENTS ===

  case 'mandate.updated':
    // Mandate status changed (e.g., tenant revoked at their bank)
    // Update rp_pad_mandates.status accordingly
    // If revoked: notify landlord, mark mandate as cancelled
    break;

  // === CONNECT EVENTS ===

  case 'account.updated':
    // Landlord's Stripe Connect account status changed
    // Update rp_landlord_profiles.stripe_connect_status
    break;
}
```

---

## Tenant UI: PAD setup form

The tenant sees this form inside TenantPorch (no Stripe redirect):

```
┌──────────────────────────────────────────────┐
│  Set up automatic rent payments              │
│                                              │
│  Your rent of $1,300 will be debited from    │
│  your bank account on the 1st of each month. │
│  No surcharges.                              │
│                                              │
│  Institution number (3 digits)               │
│  ┌──────────────────┐                        │
│  │ 004              │  ← e.g., TD = 004     │
│  └──────────────────┘                        │
│                                              │
│  Transit number (5 digits)                   │
│  ┌──────────────────┐                        │
│  │ 12345            │                        │
│  └──────────────────┘                        │
│                                              │
│  Account number (7-12 digits)                │
│  ┌──────────────────┐                        │
│  │ •••••••1234      │                        │
│  └──────────────────┘                        │
│                                              │
│  ☑ I authorize TenantPorch to debit my       │
│    account monthly for rent at               │
│    220B Red Sky Terrace NE.                  │
│                                              │
│  [ Cheque image helper: show where to find   │
│    institution, transit, and account numbers  │
│    on a void cheque ]                        │
│                                              │
│  [Set up auto-debit]                         │
│                                              │
│  🔒 Bank details are securely processed      │
│     by Stripe. TenantPorch never stores      │
│     your full account number.                │
└──────────────────────────────────────────────┘
```

### Canadian institution numbers (common banks — for helper tooltip):

| Bank | Institution # |
|------|--------------|
| BMO | 001 |
| Scotiabank | 002 |
| RBC | 003 |
| TD | 004 |
| National Bank | 006 |
| CIBC | 010 |
| HSBC | 016 |
| ATB Financial | 219 |
| Tangerine | 614 |
| Simplii | 010 (same as CIBC) |

---

## Database updates needed

```sql
-- Add Stripe customer ID to rp_pad_mandates (for recurring charges)
ALTER TABLE rp_pad_mandates ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE rp_pad_mandates ADD COLUMN IF NOT EXISTS bank_transit TEXT;
ALTER TABLE rp_pad_mandates ADD COLUMN IF NOT EXISTS bank_name TEXT;
```

---

## Error handling

| Error | What to show tenant | What to do |
|-------|-------------------|-----------|
| Invalid institution number | "Please check your institution number (3 digits)" | Validate against known list |
| Invalid transit number | "Please check your transit number (5 digits)" | Regex: `/^\d{5}$/` |
| Invalid account number | "Please check your account number (7-12 digits)" | Regex: `/^\d{7,12}$/` |
| Account closed | "This bank account appears to be closed" | Prompt to enter different account |
| Insufficient funds | "Payment could not be processed — insufficient funds" | Notify both parties, fall back to manual |
| Debit returned | "Your bank returned the debit" | Increment failure count, notify |
| Mandate revoked | "Auto-debit has been cancelled by your bank" | Update mandate status, notify landlord |

---

## Testing in Stripe test mode

| Scenario | Test institution | Test transit | Test account |
|----------|-----------------|-------------|-------------|
| Successful debit | 000 | 11000 | 000123456789 |
| Failed (insufficient funds) | 000 | 11000 | 000222222227 |
| Debit returned | 000 | 11000 | 000333333335 |
| Account closed | 000 | 11000 | 000444444440 |

---

## Security notes

1. **Never store full account numbers** — Stripe tokenizes them. You only store last 4 digits via `paymentMethod.acss_debit.last4`
2. **PIPEDA compliance** — bank details are processed by Stripe (PCI-DSS Level 1). TenantPorch only handles the form input transiently and never persists raw account numbers
3. **Mandate = tenant consent** — the `customer_acceptance` object with IP + user_agent serves as the digital PAD agreement
4. **Tenant can cancel** — via their bank (30-day notice) or via TenantPorch portal. Both paths must update the mandate status
