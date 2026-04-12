# TenantPorch — Add-on Packs (Detailed)

All add-ons available on every plan including Free. One-time setup fee + monthly subscription.

---

## 1. Compliance pack — $5/month + $29 one-time setup

**What it solves**: Canadian landlords spend 5–10 hours per year on tax reporting and constantly Google "how to serve a notice in Alberta." This pack automates both.

### Included features:

**CRA T776 rental income export**
- One-click year-end report mapped to every T776 line item
- Automatically pulls: rent collected, insurance, mortgage interest, maintenance costs, property taxes, utilities (landlord's share)
- Exports as CSV (for accountants) or PDF (for self-filers)
- Supports multiple properties — one consolidated T776 or per-property breakdown
- Saves 5+ hours per property per year vs manual spreadsheet
- Disclaimer displayed: "For informational purposes only — consult a tax professional"

**Rent increase calculator**
- Enter current rent → shows maximum allowable increase by province
- Alberta: no cap, but calculates notice period required
- Ontario: shows annual guideline percentage (set by the province each year)
- BC: shows maximum allowable increase (RTB published rate)
- Auto-generates the correct rent increase notice with proper notice periods
- Warns if the increase is attempted during a fixed-term lease (not allowed in AB)

**Provincial notice templates (15 templates)**
- All 15 Alberta notice templates with auto-fill from lease data
- Entry notice, breach notice, non-payment, rent increase, vacate reminder, deposit statement, lease renewal offer, pet violation, smoking violation, noise complaint, unauthorized occupant, maintenance access, rent receipt, utility bill statement
- Each notice: landlord clicks "Generate" → reviews pre-filled content → clicks "Send"
- Delivered via email + saved to document profile + logged with deemed-received date
- Audit trail admissible as evidence at RTDRS hearings

**Why the $29 setup fee**: We configure your property's tax categories, map your existing expenses to T776 lines, and set up your province-specific notice templates. One-time effort that makes everything work correctly from day one.

---

## 2. AI assistant — $5/month + $19 one-time setup

**What it solves**: Landlords constantly ask "can I include this clause in my lease?" or "how do I word this message to my tenant?" The AI handles both without needing a lawyer for routine questions.

### Included features:

**Lease clause suggestions**
- Landlord building a lease → AI suggests clauses based on property type and province
- "Add a clause about snow removal" → AI drafts Alberta-compliant language
- "Is this pet clause enforceable?" → AI reviews against RTA and flags issues
- Powered by Claude Haiku (fast, cheap) with Alberta tenancy law context
- Disclaimer: "AI suggestions are not legal advice — consult a lawyer for complex situations"

**Tenant communication templates**
- Pre-written message templates for common scenarios:
  - "Rent is late" (gentle → firm → final escalation sequence)
  - "Maintenance scheduled for Tuesday"
  - "Lease renewal offer"
  - "Move-out instructions"
  - "Welcome new tenant"
- AI personalizes each template with tenant name, property details, and dates
- Landlord can edit before sending

**Smart response drafting**
- Tenant sends a maintenance request → AI drafts a response for the landlord
- "I'll have a plumber come look at this on [suggested date]. In the meantime, [suggested interim steps]."
- Landlord reviews, edits if needed, and sends with one click

**Why the $19 setup fee**: We configure the AI with your property details, lease terms, and communication preferences so responses match your tone and your specific lease clauses.

---

## 3. SMS notifications — $3/month + $9 one-time setup

**What it solves**: Email rent reminders get buried. SMS gets read within 3 minutes. For landlords who want tenants to never miss a reminder.

### Included features:

**Rent reminders via SMS**
- Day 28: "Reminder: your rent of $1,300 is due on May 1st"
- Day 1: "Rent is due today — pay via TenantPorch: [link]"
- Day 3 (if unpaid): "Your rent is overdue. Please pay to avoid a late fee."
- Day [grace period]: "A late fee of $50 has been applied to your account."

**Maintenance updates via SMS**
- "Your maintenance request #1234 has been updated — status: In Progress"
- "A plumber is scheduled for May 15 between 10 AM–12 PM"
- "Your maintenance request has been completed"

**Custom SMS from landlord**
- Landlord can send one-off SMS to tenant through the portal
- "Hey, utility bill for April is ready in your portal — $48 due"
- All SMS logged in communication history

**Delivery specs**
- Powered by Twilio
- Canadian phone numbers only at launch
- Tenant must opt in (consent tracked in rp_users.notification_sms)
- ~$0.01 per SMS (cost absorbed by the $3/month add-on at typical volume of ~10–15 SMS/tenant/month)

**Why the $9 setup fee**: We verify your tenant phone numbers, set up SMS consent, and configure your reminder schedule preferences.

---

## 4. API access — $10/month + $49 one-time setup

**What it solves**: Landlords with 10+ properties who use other tools (accounting software, spreadsheets, custom dashboards) and want to pull TenantPorch data programmatically.

### Included features:

**REST API endpoints**
- `GET /api/v1/properties` — list all properties
- `GET /api/v1/leases` — list all leases with tenant info
- `GET /api/v1/payments` — payment history with filters (date, status, method)
- `GET /api/v1/maintenance` — maintenance requests with status
- `GET /api/v1/documents` — document metadata and download URLs
- `GET /api/v1/financials/summary` — revenue, expenses, NOI per property
- `POST /api/v1/payments/record` — record a manual payment
- `POST /api/v1/maintenance` — create a maintenance request

**Webhooks**
- Payment received → POST to your URL
- Maintenance request created → POST to your URL
- Lease signed → POST to your URL
- Configurable per event type

**Rate limits**
- 1,000 requests/hour per API key
- Bulk export endpoint for full data dumps (CSV)

**Authentication**
- API key generated in landlord settings
- Bearer token auth on all endpoints
- Scoped to landlord's own data only (RLS enforced)

**Minimum plan**: Growth (this is a Growth+ add-on, not available on Free or Starter)

**Why the $49 setup fee**: We provision your API key, configure webhook endpoints, provide API documentation, and verify your integration works with a test call.

---

## 5. Bulk operations — $8/month + $29 one-time setup

**What it solves**: Landlords with 10+ properties waste hours doing the same action across every unit. Bulk ops lets them do it once for all properties.

### Included features:

**Bulk notices**
- Select multiple tenants → send the same notice to all (e.g., "Building maintenance on Saturday")
- Each notice auto-filled with individual tenant/property details
- Sent individually (not as a mass email) so each tenant sees their own info

**Bulk rent tracking**
- View all units' rent status on one screen
- One-click "confirm all" for e-transfers received
- Filter: show only overdue, show only pending

**Bulk utility billing**
- Upload one utility bill → split across multiple units by percentage or square footage
- Send all utility statements at once

**Bulk lease renewals**
- Select multiple expiring leases → generate renewal offers for all
- Each offer auto-filled with current terms + proposed new rent
- Track acceptance/decline per tenant

**Bulk document upload**
- Upload one document and assign to multiple properties
- E.g., insurance certificate that covers all units in a building

**Minimum plan**: Growth (this is a Growth+ add-on)

**Why the $29 setup fee**: We configure your bulk templates, set up multi-property groupings, and customize your default bulk actions.

---

## 6. Advanced analytics — $8/month + $29 one-time setup

**What it solves**: Landlords with growing portfolios need to know which properties perform well, which tenants are risky, and where to invest next.

### Included features:

**Portfolio dashboard**
- Total revenue, expenses, and NOI across all properties
- Revenue per property (bar chart)
- Vacancy rate trend (line chart over 12 months)
- Rent collection rate (% of expected rent actually collected)

**Property performance comparison**
- Side-by-side comparison of any 2+ properties
- Metrics: NOI, vacancy days, maintenance costs, rent growth, tenant turnover
- "Best performing" and "needs attention" flags

**Tenant payment scoring**
- Internal score based on payment history (always on time, sometimes late, frequently late)
- "Flight risk" flag based on late payments + lease expiry approaching
- Helps landlords prioritize lease renewals

**Market rent comparison**
- Average rents in the same postal code area (data from CMHC or RentFaster — Phase 4 integration)
- "Your unit at $1,300 is 8% below market average of $1,414"
- Helps landlords price competitively

**Expense trending**
- Month-over-month expense tracking per category
- Flag unusual spikes: "Maintenance costs up 300% this month"
- Annual expense forecast based on historical data

**Export**
- All charts downloadable as PDF or PNG
- Raw data exportable as CSV
- Scheduled monthly summary email (auto-generated PDF report)

**Minimum plan**: Growth (this is a Growth+ add-on)

**Why the $29 setup fee**: We configure your dashboard with historical data import, set up property groupings, and calibrate market comparison data for your area.

---

## Summary: add-ons + setup fees

| Add-on | Monthly | Setup fee (one-time) | Min plan | Cost to you |
|--------|---------|---------------------|----------|-------------|
| Compliance pack | $5/mo | $29 | Free | ~$0 (data already in DB) |
| AI assistant | $5/mo | $19 | Free | ~$0.02/query (Claude Haiku) |
| SMS notifications | $3/mo | $9 | Free | ~$0.10–$0.15/mo per tenant (Twilio) |
| API access | $10/mo | $49 | Growth | ~$0 (Supabase handles it) |
| Bulk operations | $8/mo | $29 | Growth | ~$0 (frontend feature) |
| Advanced analytics | $8/mo | $29 | Growth | ~$0 (queries on existing data) |

### Setup fee revenue projection

| Customers | Avg add-ons bought | Avg setup fee | Setup revenue |
|-----------|-------------------|---------------|--------------|
| 20 | 1.2 add-ons each | ~$22 avg | $528 |
| 100 | 1.5 add-ons each | ~$25 avg | $3,750 |
| 500 | 1.8 add-ons each | ~$27 avg | $24,300 |

Setup fees are one-time revenue that front-loads cash flow in the early months. At 100 customers buying an average of 1.5 add-ons each, you collect **$3,750 in setup fees** on top of recurring monthly revenue.

---

## Pricing page display

Show add-ons as cards below the main plan selector:

```
┌─────────────────────────────────────┐
│  ⚡ Compliance pack                 │
│  CRA T776 export • Rent increase    │
│  calculator • 15 notice templates   │
│                                     │
│  $5/month + $29 one-time setup      │
│  [Add to my plan]                   │
└─────────────────────────────────────┘
```

When a Pro plan user views add-ons, show them as "Included in your plan" with a checkmark — reinforcing the value of Pro.
