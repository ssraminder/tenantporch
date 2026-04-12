# TenantPorch — Pricing & Services (v4 — Final)

---

## Pricing model: flat base + included properties + per-property overage

| Plan | Monthly price | Properties included | Additional properties |
|------|-------------|--------------------|-----------------------|
| **Free** | $0 | 1 | Not available |
| **Starter** | $14/month | 3 | +$5/property/month |
| **Growth** | $40/month | 10 | +$4/property/month |
| **Pro** | $60/month | 20 | +$3/property/month |

**Billing formula**: `monthly_charge = base_price + MAX(0, (property_count - included_properties)) × overage_rate`

**Examples:**

| Landlord has | Free | Starter | Growth | Pro |
|-------------|------|---------|--------|-----|
| 1 property | $0 | $14 | $40 | $60 |
| 3 properties | — | $14 | $40 | $60 |
| 5 properties | — | $24 | $40 | $60 |
| 10 properties | — | $49 | $40 | $60 |
| 15 properties | — | $74 | $60 | $60 |
| 20 properties | — | $99 | $80 | $60 |
| 30 properties | — | $149 | $120 | $90 |
| 50 properties | — | $249 | $200 | $150 |

**Natural upgrade points:**

| Properties | Cheapest plan | Monthly cost |
|-----------|--------------|-------------|
| 1–3 | Starter | $14 |
| 4–8 | Starter | $19–$39 |
| 9+ | Growth | $40 |
| 16+ | Pro | $60 |

---

## What's included per plan

### Free plan ($0/month — 1 property)

| Feature | Included |
|---------|----------|
| Tenant portal (dashboard, docs, messages) | Yes |
| E-transfer rent tracking | Yes |
| Alberta lease template | Yes |
| Document storage (50MB) | Yes |
| Maintenance requests (with photos + chat) | Yes |
| Rent reminders (email, 28th of month) | Yes |
| Late fee tracking (landlord-configurable) | Yes |
| Move-in / move-out inspections | Yes |
| Furnished inventory tracking | Yes |
| Card payments (6% tenant surcharge) | Yes |
| Lease signing (1 per year) | Yes |
| Tenant application form (public link) | Yes |
| Screening (pay-per-use via SingleKey) | Yes |
| Add-ons available | Yes (all 9 add-ons purchasable) |

### Starter plan ($14/month — up to 3 properties)

Everything in Free, plus:

| Feature | Included |
|---------|----------|
| PAD auto-debit ($10/transaction, no setup fee) | Yes |
| Card payments (4% tenant surcharge) | Yes |
| Utility bill splitting | Yes |
| Financial reports (monthly P&L per property) | Yes |
| Multi-property dashboard | Yes |
| Custom lease builder | Yes |
| Unlimited lease signing | Yes |
| Vacancy tracker | Yes |
| Shared expense tracker | Yes |
| Co-signer / guarantor management | Yes |
| Additional properties | +$5/each |

### Growth plan ($40/month — up to 10 properties)

Everything in Starter, plus:

| Feature | Included |
|---------|----------|
| CRA T776 rental income export | Yes |
| Lease renewal workflow | Yes |
| Rent increase calculator | Yes |
| Annual landlord summary (year-end PDF) | Yes |
| Tenant application form + reference automation | Yes |
| Contractor dispatch (email/SMS) | Yes |
| Appliance warranty tracker | Yes |
| Mortgage / expense tracker | Yes |
| Net operating income dashboard | Yes |
| 1 free ID verification per month (Stripe Identity) | Yes |
| Additional properties | +$4/each |

### Pro plan ($60/month — up to 20 properties)

Everything in Growth, plus:

| Feature | Included (no add-on needed) |
|---------|----------|
| API access | Yes |
| Bulk operations | Yes |
| Advanced analytics & benchmarking | Yes |
| Priority email support | Yes |
| Tenant insurance verification | Yes |
| Comparable rent analysis | Yes |
| Accounting sync (QuickBooks, Wave) | Yes |
| 2 free ID verifications per month | Yes |
| All add-ons included | Yes |
| Additional properties | +$3/each |

---

## Add-ons

Available on **ALL plans including Free**. Pro plan includes all add-ons at no extra cost.

### Payment add-ons

| Add-on | Monthly | Setup fee | Min plan | Details |
|--------|---------|----------|----------|---------|
| PAD auto-debit | $10/month | $100 | Free | Auto-debit tenant's bank on the 1st. $15/txn on Free, $10/txn on Starter+. Included in Starter+ (no monthly fee, no setup fee, $10/txn only). |
| Reduced card rate | $5/month | $0 | Free | Lower card surcharge from 6% to 4% for tenants |
| Recurring card payments | $3/month | $9 | Free | Auto-charge saved card monthly |

### Feature add-ons

| Add-on | Monthly | Setup fee | Min plan | Details |
|--------|---------|----------|----------|---------|
| Compliance pack | $5/month | $29 | Free | CRA T776 export, rent increase calculator, 15 notice templates |
| AI assistant | $5/month | $19 | Free | Lease clause suggestions, communication templates, smart drafts |
| SMS notifications | $3/month | $9 | Free | Twilio SMS rent reminders + maintenance updates |

### Pro-level add-ons (Growth users can purchase individually)

| Add-on | Monthly | Setup fee | Min plan | Details |
|--------|---------|----------|----------|---------|
| API access | $10/month | $49 | Growth | REST API + webhooks for integrations |
| Bulk operations | $8/month | $29 | Growth | Multi-tenant notices, bulk tracking, bulk utility billing |
| Advanced analytics | $8/month | $29 | Growth | Portfolio dashboard, property comparison, market analysis |

---

## Pay-per-use services

| Service | Cost | Who pays | Available | Details |
|---------|------|----------|-----------|---------|
| Tenant screening | ~$40–$50/check | Landlord | All plans | Via SingleKey referral. TenantPorch earns 15–25% commission. |
| ID verification (Stripe Identity) | $3.99/check | Landlord | All plans | Front + back of ID + selfie + face match. Growth gets 1 free/month, Pro gets 2 free/month. |

---

## Transaction fees

| Fee | Free plan | Starter+ |
|-----|-----------|----------|
| PAD platform fee | $15/transaction | $10/transaction |
| PAD Stripe fee (ACSS) | ~$5 (0.8% capped) | ~$5 |
| PAD Connect fee | ~$6.75 (0.5% + $0.25) | ~$6.75 |
| Card surcharge | 6% (tenant pays) | 4% (tenant pays) |
| Failed PAD debit | $7 | $7 |
| ID verification | $3.99 | $3.99 (Growth: 1 free/mo, Pro: 2 free/mo) |

**Total landlord cost per PAD transaction on $1,300 rent:**
- Free plan: ~$26.75 ($15 platform + $11.75 Stripe)
- Starter+: ~$21.75 ($10 platform + $11.75 Stripe)

---

## Lease signing

Built-in e-signatures pursuant to the Electronic Transactions Act, SA 2001, c. E-5.5.

| Feature | Free | Starter+ |
|---------|------|----------|
| Signatures per year | 1 | Unlimited |
| Signature methods | Type, draw, or upload | Type, draw, or upload |
| Signed PDF emailed to all parties | Yes | Yes |
| SHA-256 document hash (tamper-proof) | Yes | Yes |
| Full audit trail (IP, timestamp, user agent) | Yes | Yes |
| Sequential signing order | Yes | Yes |

---

## Tenant application form

Available on **all plans** (including Free). Public shareable link — no login required for applicants.

| Feature | Details |
|---------|---------|
| Public application link | Shareable URL for Kijiji, Facebook, text messages |
| 6-step form | Personal info, rental history, employment, occupancy, references, consent |
| Alberta Human Rights Act compliant | Asks income amount, never source |
| PIPA consent | Full consent statement included |
| Credit check consent | Written authorization checkbox |
| Reference check automation | Auto-email previous landlords |
| Approve → create lease flow | One click pre-fills lease from application data |

---

## ID verification

| Method | Cost | How it works |
|--------|------|-------------|
| Stripe Identity | $3.99/check | Front + back of ID + selfie + AI face match. Data auto-extracted. |
| Manual upload | Free | Tenant uploads photo, landlord reviews manually. No face match. |

**Free verifications included in plans:**
- Free: 0 (always $3.99)
- Starter: 0 (always $3.99)
- Growth: 1 free per month, then $3.99
- Pro: 2 free per month, then $3.99

---

## Rent tracking

| Status | Trigger |
|--------|---------|
| Upcoming | Lease created — schedule auto-generated |
| Due | 1st of month (cron) |
| Pending | Tenant marks e-transfer sent or card initiated |
| Partial | Less than full amount confirmed |
| Paid | Full amount confirmed — receipt auto-generated |
| Overdue | Grace period expires — late fee per lease policy |

**Late fee policy**: landlord-configurable per lease (flat amount, % of rent, or none).

---

## Move-out & security deposit return

1. 30/14/7 day reminders before lease end
2. Joint walkthrough — digital inspection with photos
3. Side-by-side comparison: move-in vs move-out condition
4. Deposit calculation: deposit + interest − itemized deductions = refund
5. Statement PDF generated and emailed to tenant
6. Tenant reviews/disputes in portal
7. Deposit returned, tracked in system

---

## Notices — 15 Alberta templates

Auto-filled from lease data, emailed + logged with deemed-received dates:
Entry notice, breach notice, non-payment notice, rent increase, vacate reminder, deposit return statement, lease renewal offer, pet violation, smoking violation, noise complaint, unauthorized occupant, maintenance access, rent receipt, utility bill statement.

---

## Partner integrations

| Partner | Type | Your revenue | Phase |
|---------|------|-------------|-------|
| SingleKey | Screening referral | ~$8–$10/screen | 2 |
| SingleKey | Rent guarantee referral | ~20% of premium | 2 |
| Duuo | Renter's insurance referral | ~15% per policy | 3 |
| FrontLobby | Rent reporting to credit bureaus | Tenant pays $5–$10/mo | 4 |
| Certn | Direct screening API | ~$25–$30 margin/screen | 4 |

---

## Revenue per customer examples

| Customer type | Subscription | Add-ons | PAD fees | Total monthly |
|--------------|-------------|---------|---------|--------------|
| 1 property, Free + PAD add-on | $0 | $10 (PAD) | $15 | $25 |
| 1 property, Starter + compliance | $14 | $5 | $10 | $29 |
| 3 properties, Starter + PAD | $14 | $0 | $30 | $44 |
| 5 properties, Starter + screening | $24 | $0 | $50 | $74 |
| 10 properties, Growth | $40 | $0 | $100 | $140 |
| 15 properties, Growth | $60 | $0 | $150 | $210 |
| 20 properties, Pro | $60 | $0 | $200 | $260 |
| 30 properties, Pro | $90 | $0 | $300 | $390 |

---

## Currency support

| Currency | Code | Symbol | Status |
|----------|------|--------|--------|
| Canadian Dollar | CAD | $ | Active (default) |
| US Dollar | USD | $ | Ready, inactive |
| British Pound | GBP | £ | Ready, inactive |
| Euro | EUR | € | Ready, inactive |
| Australian Dollar | AUD | $ | Ready, inactive |
| Indian Rupee | INR | ₹ | Ready, inactive |
