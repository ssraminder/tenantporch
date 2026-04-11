# TenantPorch — Services & Pricing (Final)

## Pricing: per-unit with volume discount

| Properties | Tier | Per unit/month | Example total |
|-----------|------|---------------|--------------|
| 1 | Free | $0 | $0 |
| 1 | Starter (upgrade) | $7 | $7 |
| 2 | Starter | $7 | $14 |
| 5 | Starter | $7 | $35 |
| 6 | Growth | $6 | $36 |
| 15 | Growth | $6 | $90 |
| 21 | Pro | $4 | $84 |
| 50 | Pro | $4 | $200 |
| 51+ | Enterprise | Custom | Contact us |

Default currency: CAD (USD, GBP, EUR, AUD, INR ready in database, activated when needed)

**Important**: Landlords with just 1 property can upgrade from Free to Starter at any time. Free is the default, not a restriction. A single-property landlord who wants PAD auto-debit pays $7/month (subscription) + $10/month (PAD platform fee) = $17/month for fully automated rent collection.

---

## Services by phase

### Phase 1: Launch (0–20 customers)

| Service | Free | Starter | Growth | Pro |
|---------|------|---------|--------|-----|
| Tenant portal | Y | Y | Y | Y |
| E-transfer rent tracking | Y | Y | Y | Y |
| Alberta lease template | Y | Y | Y | Y |
| Document storage | Y | Y | Y | Y |
| Maintenance requests | Y | Y | Y | Y |
| Rent reminder emails | Y | Y | Y | Y |
| Late fee tracking | Y | Y | Y | Y |
| Move-in/out inspections | Y | Y | Y | Y |
| Inventory tracking | Y | Y | Y | Y |
| Card payments (4% surcharge) | - | Y | Y | Y |
| Utility bill splitting | - | Y | Y | Y |
| Financial reports | - | Y | Y | Y |
| Multi-property dashboard | - | Y | Y | Y |
| Custom lease builder | - | Y | Y | Y |

**Your cost**: ~$21/month | **Revenue at 20 customers**: ~$460/month

### Phase 2: Growth (20–100 customers)

All Phase 1 services plus:

| Service | Free | Starter | Growth | Pro |
|---------|------|---------|--------|-----|
| Tenant screening (SingleKey) | - | - | Y | Y |
| Rent guarantee referral | - | - | Y | Y |
| AI lease assistant | - | - | Y | Y |
| SMS notifications | - | - | Y | Y |
| CRA T776 export | - | - | Y | Y |

**Your cost**: ~$170/month | **Revenue at 100 customers**: ~$3,573/month

### Phase 3: Scale (100–500 customers)

All Phase 1–2 services plus:

| Service | Free | Starter | Growth | Pro |
|---------|------|---------|--------|-----|
| Ontario lease template | - | Y | Y | Y |
| BC lease template | - | Y | Y | Y |
| Insurance referral (Duuo) | - | Y | Y | Y |
| E-signing (built-in) | - | Y | Y | Y |
| Lease renewal reminders | - | Y | Y | Y |
| Listing syndication | - | - | Y | Y |

**Your cost**: ~$3,500/month (incl. contractor) | **Revenue at 500 customers**: ~$18,915/month

### Phase 4: Expansion (500+ customers)

All Phase 1–3 services plus:

| Service | Free | Starter | Growth | Pro |
|---------|------|---------|--------|-----|
| API access | - | - | - | Y |
| Bulk operations | - | - | - | Y |
| Advanced analytics | - | - | - | Y |
| White-label | - | - | - | Enterprise |
| All-province compliance | - | Y | Y | Y |
| Multi-currency active | - | Y | Y | Y |

---

## Revenue streams

| Stream | How it works | Revenue per event | Available from |
|--------|-------------|------------------|---------------|
| SaaS subscription | Per-unit monthly billing | $4–$7/property/month | Phase 1 |
| Card surcharge (free tier) | 6% charged to tenant, ~$30.60 net to you per $1,300 | ~$30.60/payment | Phase 1 |
| Card surcharge (paid tiers) | 4% charged to tenant, ~$5.48 net to you per $1,300 | ~$5.48/payment | Phase 1 |
| Screening referral | SingleKey API, 20% commission | ~$8–$10/screen | Phase 2 |
| Rent guarantee referral | SingleKey, 20% of premium | ~$109/year per policy | Phase 2 |
| Insurance referral | Duuo/Square One, 15% commission | ~$3–$5/month per policy | Phase 3 |

---

## Partner integrations

| Partner | Type | Commission | Phase | Status |
|---------|------|-----------|-------|--------|
| SingleKey | Screening | 20% per screen | 2 | Pending outreach |
| SingleKey | Rent guarantee | 20% of premium | 2 | Pending outreach |
| Duuo | Renter's insurance | 15% per policy | 3 | Future |
| Square One | Renter's insurance | 15% per policy | 3 | Future |
| RentFaster | Listing syndication | $0 (stickiness play) | 3 | Future |
| TransUnion Canada | Direct screening | ~$30 margin/screen | 4 | Replaces SingleKey |

---


## Late fee policy (landlord-configurable)

Each landlord sets their own late fee policy during lease setup:

| Setting | Options | Default |
|---------|---------|---------|
| Fee type | Flat amount, percentage of rent, or none | Flat |
| Flat amount | Any amount (e.g., $25, $50, $100) | $50 |
| Percentage | % of monthly rent (e.g., 3%, 5%) | 0% |
| Grace period | Days after due date before fee triggers | 5 days |
| Monthly cap | Optional maximum per month | No cap |

The late fee cron checks each lease individually — Lease A might have "$50 flat on day 5" while Lease B has "5% on day 3." All stored on the lease record, not a global setting.

## Card surcharge by tier

| Tier | Surcharge | On $1,300 rent | Tenant pays | Net to TenantPorch |
|------|-----------|---------------|-------------|-------------------|
| Free | 6% | $78.00 | $1,378.00 | ~$30.60 |
| Starter | 4% | $52.00 | $1,352.00 | ~$5.48 |
| Growth | 4% | $52.00 | $1,352.00 | ~$5.48 |
| Pro | 4% | $52.00 | $1,352.00 | ~$5.48 |
| Enterprise | 3.5% | $45.50 | $1,345.50 | ~$0.74 |

The higher free-tier surcharge makes the free tier self-funding and incentivizes landlords to upgrade to paid plans for a lower tenant fee.

## Notices & compliance documents

15 Alberta notice templates auto-filled from lease data, delivered via email with audit trail:

| Notice | When needed | Tier |
|--------|-----------|------|
| 24-hour entry notice | Before non-emergency entry | All (incl. Free) |
| 14-day substantial breach | Tenant violates lease | All |
| 14-day non-payment | Rent unpaid | All |
| Rent increase notice | Raising rent (periodic tenancy) | All |
| Notice to vacate (fixed term end) | Lease ending reminder | All |
| Security deposit return statement | Itemized deductions at move-out | All |
| Lease renewal offer | Offering tenant a new term | Starter+ |
| Pet violation notice | Pet detected on premises | All |
| Smoking violation notice | Smoking detected | All |
| Noise complaint notice | Noise complaint received | All |
| Unauthorized occupant notice | Extra people living in unit | All |
| Maintenance access notice | Scheduled contractor visit | All |
| Rent receipt | After every confirmed payment | All (auto-generated) |
| Utility bill statement | With each utility bill | All (auto-generated) |

All notices are timestamped, logged with delivery method, and track deemed-received dates per the RTA. The communication log is admissible evidence at RTDRS hearings.


## Lease signing (built-in, zero cost)

Built-in e-signature system — no Adobe Sign or DocuSign needed. Legally valid in Alberta under the Electronic Transactions Act (SA 2001, c. E-5.5). Each lease includes the clause: "This Agreement may be executed electronically pursuant to the Electronic Transactions Act, SA 2001, c. E-5.5."

| Feature | Details |
|---------|---------|
| Signature methods | Three options per signer: (1) TYPE — enter full legal name rendered in signature font, (2) DRAW — draw signature on canvas with finger/mouse/stylus, saved as PNG, (3) UPLOAD — upload image of handwritten signature |
| Signing order | Sequential — landlord(s) sign first, then each tenant in order |
| Audit trail | IP address, timestamp (UTC), user agent, browser fingerprint, geolocation (if permitted), document SHA-256 hash |
| Tamper proof | SHA-256 hash of document at creation — proves no modification after signing |
| Delivery | Unique secure link per signer, sent via email (no login required to sign) |
| Expiry | Signing links expire after 14 days (configurable) |
| Reminders | Auto-reminder at 3 days and 7 days if not signed |
| Viewer tracking | Records that signer scrolled through all pages before signing |
| Final output | PDF with embedded signatures + audit trail page appended |
| Post-signing delivery | Signed PDF emailed to ALL parties (landlord + every tenant), saved to each user's document profile, and linked to the lease record |
| Cost to you | $0 — PDF via pdf-lib, signature canvas via HTML5 Canvas API, emails via Resend |

| Tier availability | Free | Starter | Growth | Pro |
|-------------------|------|---------|--------|-----|
| Sign 1 lease/year | Y | - | - | - |
| Unlimited signing | - | Y | Y | Y |

## Move-out reports & security deposit return

Full end-of-tenancy workflow built in:

### Move-out timeline

| Day | What happens | Who |
|-----|-------------|-----|
| 30 days before lease end | "Schedule move-out walkthrough" reminder | Landlord |
| 14 days before | "Prepare to vacate" reminder with checklist | Tenant |
| 7 days before | Walkthrough scheduling reminder if not yet scheduled | Both |
| Walkthrough day | Joint inspection — landlord fills digital report with photos | Both |
| Within 1 week of move-out | Move-out inspection report finalized | Both sign |
| Per RTA timeline | Deposit return statement generated + deposit returned | Landlord → Tenant |

### Move-out report includes

| Section | Details |
|---------|---------|
| Keys returned | Count + confirmation |
| Premises condition | Clean/not clean, belongings removed/not removed |
| Side-by-side inspection comparison | Auto-generated: move-in condition vs move-out condition per item, differences highlighted |
| Damage documentation | Photos, description, estimated repair cost per item |
| Cleaning assessment | Required/not required, estimated cost |
| Final meter readings | Electricity, gas — for final utility bill |
| Forwarding address | For deposit return mailing if needed |
| Tenant agreement | Tenant signs off or disputes with written notes |

### Security deposit return workflow

| Step | What happens |
|------|-------------|
| 1. Calculate | System auto-calculates: deposit + accrued interest - deductions = refund |
| 2. Itemize deductions | Each deduction categorized: unpaid rent, unpaid utilities, damages, cleaning, other |
| 3. Attach evidence | Photos from move-out inspection + repair invoices linked to each deduction |
| 4. Generate statement | PDF deposit return statement auto-generated with full breakdown |
| 5. Send to tenant | Statement emailed + available in tenant portal |
| 6. Tenant reviews | Tenant agrees or disputes (with written notes) in portal |
| 7. Return deposit | Landlord sends refund via e-transfer/cheque, records in system |
| 8. Track disputes | If disputed: system tracks RTA deadline, provides RTDRS filing guidance |
| 9. Archive | All documents (inspections, statement, photos) saved to both profiles permanently |

### Deposit calculation example

```
Original deposit:                    $1,300.00
Interest accrued (5 months):         +   $5.42
                                    ----------
Gross amount:                        $1,305.42

Deductions:
  Unpaid utilities (Sept):           -  $48.00
  Wall damage (bedroom 2, photos):   - $150.00
  Professional cleaning:             - $200.00
                                    ----------
Total deductions:                    - $398.00

REFUND TO TENANT:                    $  907.42
```

All deductions must be supported by move-in vs move-out inspection comparison and photographic evidence, as required by the RTA.

## Rent tracking (full lifecycle)

| Status | Trigger | What happens |
|--------|---------|-------------|
| Upcoming | Lease created | Schedule auto-generated for each month |
| Due | 1st of month (cron) | Status flips, dashboard updates, badge shows "Due" |
| Pending | Tenant marks e-transfer sent or card payment initiated | Awaiting landlord confirmation (e-transfer) or Stripe webhook (card) |
| Partial | Payment less than full amount confirmed | Balance carries forward |
| Paid | Full amount confirmed | Receipt auto-generated, badge shows "Paid" |
| Overdue | Grace period expires, unpaid | Late fee created per lease policy, notifications sent |
| Waived | Landlord waives rent for a month | Rare — for special circumstances |

**Payment methods supported:**

| Method | How it works | Tenant pays | Landlord cost | Auto? | Available |
|--------|-------------|------------|--------------|-------|-----------|
| E-transfer (Interac) | Tenant sends to landlord's email, marks "sent", landlord confirms | $0 surcharge | $0 | No | All tiers |
| Credit card | Stripe Connect Direct charge, money to landlord | 6% (free) / 4% (paid) | $0 | One-click | All tiers |
| Debit card | Same as credit card | 6% (free) / 4% (paid) | $0 | One-click | All tiers |
| **PAD (auto-debit)** | **Stripe ACSS — auto-pulls from tenant's bank on the 1st** | **$0** | **~$11.75/month** | **Fully automatic** | **Starter+ only** |
| Cash | Landlord manually records | $0 | $0 | No | All tiers |
| Cheque | Landlord manually records | $0 | $0 | No | All tiers |

### Pre-authorized debit (PAD) details

PAD is the premium payment method and the strongest upgrade incentive from Free to Starter.

| Detail | Value |
|--------|-------|
| Stripe product | ACSS Debit (Canadian PAD) |
| Stripe ACSS fee | 0.8% capped at $5.00 CAD |
| Connect payout fee | 0.5% + $0.25 per payout |
| **TenantPorch platform fee** | **$10.00 CAD flat per successful debit** |
| Total landlord cost on $1,300 rent | ~$21.75 ($5 ACSS + $6.75 Connect + $10 platform) |
| Tenant pays | $0 — exactly the lease amount |
| Failed debit fee | $7.00 CAD (Stripe, passed to landlord) |
| Dispute fee | $15.00 CAD |
| Settlement time | 3–5 business days |
| Who pays all fees | Landlord — positioned as "never chase rent again" |
| Free tier | NOT available — this is the upgrade trigger |
| 1-property landlord | CAN upgrade to Starter ($7/mo) to unlock PAD |
| Compliance | Stripe handles PAD mandate, pre-notification, and dispute |
| Tenant consent | One-time authorization via Stripe-hosted mandate form |
| Cancellation | Tenant can cancel with 30 days notice |

**TenantPorch revenue from PAD: $10.00 per successful debit per property per month**

| Scale | PAD-enabled landlords | Monthly PAD revenue | Annual |
|-------|----------------------|--------------------:|-------:|
| 20 customers | ~12 using PAD | $120 | $1,440 |
| 100 customers | ~65 using PAD | $650 | $7,800 |
| 500 customers | ~350 using PAD | $3,500 | $42,000 |
| 1,000 customers | ~700 using PAD | $7,000 | $84,000 |

This is pure platform revenue on top of SaaS subscriptions. At 500 landlords, PAD fees alone ($42K/year) cover all infrastructure costs several times over.

**Why PAD is excluded from free tier:** It's your single strongest conversion lever. Free users deal with manual e-transfers or 6% card surcharges. Upgrading to Starter unlocks automatic rent collection with zero tenant surcharge.

**The landlord's math (1 property):**
- Free tier: chase e-transfers every month, or tenant pays 6% surcharge ($78/month)
- Starter: $7/month subscription + $10/month PAD fee = **$17/month total**
- Result: rent auto-hits your bank on the 1st, tenant pays exactly $1,300, zero chasing

**The landlord's math (3 properties):**
- Starter: $21/month subscription + $30/month PAD fees (3 units) = **$51/month total**
- Result: $3,900 in rent collected automatically every month for $51 — that's 1.3% of gross rent
- A property manager would charge 10% ($390/month) for the same service

**The tenant's math:**
- Before TenantPorch: write an e-transfer every month, remember the memo, hope landlord confirms
- With PAD: set it once, forget it, rent is always on time, build a good payment history
- No surcharge, no effort, never accidentally late, never a late fee

**Automated reminder timeline:**

| Day | Action | Recipient |
|-----|--------|-----------|
| 28th prior month | Rent reminder email | Tenant |
| 1st | Status → "due" | Both (dashboard) |
| 3rd (if unpaid) | Gentle reminder | Tenant |
| Grace day (per lease) | Late fee created | Both |
| 10th (if unpaid) | Urgent reminder | Both |
| 14th+ | "Generate non-payment notice" button appears | Landlord |

All reminder days, grace periods, and fee amounts read from the lease record — fully landlord-configurable.

**Partial payments:** Supported. Two payments of $650 each are tracked separately, balance updates in real time.

**Carry-forward:** Unpaid balance from Month 1 shows on Month 2 dashboard: "June rent: $1,300 + Previous balance: $500 = Total due: $1,800"

## Additional services by phase

### Phase 1 — zero cost to deliver

| Service | Tier | Revenue |
|---------|------|---------|
| Rent receipts (auto-generated PDF) | All | Free — stickiness |
| Lease expiry countdown + 90/60/30 day alerts | All | Free — stickiness |
| Tenant communication log (timestamped) | All | Free — RTDRS evidence |
| Emergency contact directory | All | Free |
| Property photo gallery (dated) | All | Free |
| Vacancy tracker (days vacant, vacancy loss) | Starter+ | Free — stickiness |
| Shared expense tracker (snow removal, etc.) | Starter+ | Free — stickiness |
| Co-signer/guarantor management | Starter+ | Free — stickiness |

### Phase 2 — low cost

| Service | Tier | Revenue |
|---------|------|---------|
| Online tenant application form | All | Free — feeds into screening |
| Reference check automation (email to prev. landlord) | All | Free — feeds into screening |
| Lease renewal workflow | Growth+ | Included |
| Rent increase calculator (province-specific rules) | Growth+ | Included |
| Annual landlord summary (year-end PDF) | Growth+ | Included |
| CRA T776 rental income report | Growth+ | Included |

### Phase 3 — medium cost

| Service | Tier | Revenue |
|---------|------|---------|
| Tenant insurance verification + expiry tracking | Starter+ | Included |
| Contractor directory (saved contacts) | All | Free |
| Contractor dispatch (send request via email/SMS) | Growth+ | Included |
| Appliance warranty tracker | Starter+ | Included |
| Mortgage/expense tracker | Growth+ | Included |
| Net operating income dashboard | Growth+ | Included |

### Phase 4 — partner integrations

| Service | Tier | Revenue |
|---------|------|---------|
| Rent reporting to credit bureaus (FrontLobby) | All (tenant pays) | $5-$10/tenant/month |
| Tenant credit monitoring (Certn/Equifax) | Pro+ | $3-$5/tenant/month |
| Accounting sync (QuickBooks, Wave, FreshBooks) | Pro+ | Included |
| Comparable rent analysis | Pro+ or AI add-on | $5/month add-on |
| Legal document library (province-specific guides) | Growth+ | Included |

### Rent reporting — the tenant acquisition flywheel

Rent reporting to credit bureaus is the most strategic Phase 4 service. It works like this:
- TenantPorch reports on-time rent payments to Equifax/TransUnion via a partner (FrontLobby or Landlord Credit Bureau)
- Tenants build credit by paying rent — something that normally doesn't happen in Canada
- Tenants pay $5-$10/month for the service (landlord offers it as a perk)
- Tenants with thin credit files (newcomers, young Canadians) actively ask their landlords to use TenantPorch
- This creates tenant-driven acquisition: tenants pull landlords onto the platform


---

## Currency support

| Currency | Code | Symbol | Status at launch |
|----------|------|--------|-----------------|
| Canadian Dollar | CAD | $ | Active (default) |
| US Dollar | USD | $ | Ready, inactive |
| British Pound | GBP | £ | Ready, inactive |
| Euro | EUR | € | Ready, inactive |
| Australian Dollar | AUD | $ | Ready, inactive |
| Indian Rupee | INR | ₹ | Ready, inactive |

Landlord selects currency in settings. Plans are priced per currency in the database. To launch in a new market: activate the currency, add plan rows with local pricing, add jurisdiction-specific lease templates.
