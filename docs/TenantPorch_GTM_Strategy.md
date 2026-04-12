# TenantPorch — Go-to-Market Strategy

## Positioning

**Tagline**: "Your front porch to smarter renting."

**One-liner pitch**: TenantPorch is a Canadian-native property management portal for self-managing landlords with 1–20 units. Free tenant portal, Alberta-specific lease templates, and automated rent collection via PAD.

**Competitive positioning**: SingleKey collects rent. TenantPorch runs your rental business.

---

## Target market

**Beachhead**: Alberta landlords with 1–10 units who self-manage.

**Why Alberta first**:
- You're here, you know the RTA inside out
- Alberta-specific lease templates and 15 notice templates already built
- No competitor owns this niche (SingleKey = Ontario-first, liv.rent = BC-first)
- Calgary + Edmonton = ~500K rental units, ~60% managed by small landlords
- RTDRS (Alberta's dispute resolution) is unique — your notice templates are built for it

**Ideal customer profile**:
- Owns 1–10 residential rental units in Alberta
- Self-manages (no property management company)
- Currently uses spreadsheets, Word docs, and e-transfers
- Frustrated by chasing rent, generating compliant notices, and tracking expenses
- Age 30–55, somewhat tech-savvy (uses banking apps, e-transfer)

**Who we are NOT targeting (yet)**:
- Property management companies (they want Buildium/AppFolio)
- Commercial landlords (different legal framework)
- Landlords outside Alberta (until Phase 4 — Ontario and BC expansion)

---

## Competitive landscape

### Direct competitors

| Competitor | Focus | Pricing | Gap |
|-----------|-------|---------|-----|
| SingleKey | Screening + rent guarantee + rent collection | Free collect (3 units), $25–$50/screen | No lease management, no maintenance, no tenant portal beyond payments |
| liv.rent | BC listings + rent collection | Free (basic), $8–$20/unit | BC-focused, weak in Alberta, no lease builder |
| RentFaster | Alberta listings | Free listings, paid boosts | Listings only — zero management tools |
| Buildium | Full property management | $58+ CAD/month | Enterprise pricing, overkill for 1–10 units |
| AppFolio | Full property management | $104+ CAD/month | Enterprise pricing, US-focused |
| TurboTenant | Free screening + rent collection | Free (US only) | Not available in Canada |
| Innago | Free property management | Free (US only) | Not available in Canada |

### Key gap in the market

No Canadian-native property management portal for 1–20 unit landlords under $15/month with province-specific legal compliance. TenantPorch fills this gap.

### How we compare to SingleKey

| Feature | SingleKey | TenantPorch |
|---------|-----------|-------------|
| Rent collection (PAD) | Free (3 units) | $10–$15/txn or included in plan |
| Card surcharge | 2.9% + $0.30 | 4–6% |
| Tenant screening | Yes (core product) | Via SingleKey referral |
| Rent guarantee | Yes (core product) | Referral to SingleKey |
| Lease management | No | Yes (builder + e-signing) |
| Maintenance tracking | No | Yes (photos + real-time chat) |
| Utility splitting | No | Yes |
| Move-in/out inspections | No | Yes (digital + side-by-side comparison) |
| Document storage | No | Yes |
| Tenant portal | Payment page only | Full portal (dashboard, maintenance, docs, messages) |
| Notice generation | No | Yes (15 Alberta templates, RTA-compliant) |
| Late fee tracking | No | Yes (landlord-configurable) |
| Security deposit tracking | No | Yes (full return workflow with RTDRS evidence) |
| T776 tax export | No | Yes (compliance add-on) |
| Province-specific compliance | Generic | Alberta-specific (ON, BC coming) |

**Strategy**: Don't compete with SingleKey on rent collection price. Partner with them for screening. Position TenantPorch as the management layer SingleKey doesn't offer.

---

## Pricing (v3 final)

### Plans

| Plan | Price | Included | Extra properties |
|------|-------|----------|-----------------|
| Free | $0 | 1 property | Not available |
| Starter | $14/month | 3 properties | +$5/each |
| Growth | $40/month | 10 properties | +$4/each |
| Pro | $60/month | 20 properties | +$3/each |

### Transaction fees

| Fee | Amount | Who pays |
|-----|--------|----------|
| PAD platform fee (free tier) | $15/transaction | Landlord |
| PAD platform fee (paid tiers) | $10/transaction | Landlord |
| Card surcharge (free tier) | 6% | Tenant |
| Card surcharge (paid tiers) | 4% | Tenant |

### Add-ons (available on all plans including Free)

| Add-on | Monthly | Setup fee |
|--------|---------|----------|
| PAD auto-debit | $10/month (Free only) | $100 (Free) / $0 (Starter+) |
| Reduced card rate (6%→4%) | $5/month | $0 |
| Recurring card payments | $3/month | $9 |
| Compliance pack (T776, notices) | $5/month | $29 |
| AI assistant | $5/month | $19 |
| SMS notifications | $3/month | $9 |
| API access | $10/month | $49 |
| Bulk operations | $8/month | $29 |
| Advanced analytics | $8/month | $29 |

### Screening

Pay-per-use via SingleKey referral. Available on all tiers. TenantPorch earns 15–25% referral commission (~$8–$10 per screening).

---

## Go-to-market phases

### Phase 1: Free + viral (Months 1–3)

**Goal**: Get 50 landlords on the platform.

**Strategy**: Give away the full tenant portal for free. Make money on transactions.

**What's free**:
- Tenant portal (dashboard, docs, messages)
- Alberta lease template + e-signing (1/year)
- Maintenance tracking
- E-transfer tracking
- Move-in/out inspections
- 1 property forever

**What costs money**:
- Card payments: 6% surcharge (tenant pays, ~$30/payment net to you)
- PAD: $10–$15/transaction (landlord pays for automation)
- Add-ons: compliance, AI, SMS ($3–$10/month each)

#### Acquisition channels (ranked by cost-effectiveness)

**1. Alberta landlord Facebook groups (free, immediate)**

Target groups:
- Calgary Landlords
- Edmonton Rental Property Owners
- Alberta Landlords
- Red Deer Property Investors
- Lethbridge Landlords

Approach:
- Don't pitch TenantPorch directly — introduce yourself as a landlord who built a tool
- Post: "I built a free tenant portal specifically for Alberta landlords — built around the RTA and RTDRS"
- Share a 60-second screen recording of the tenant portal
- Offer to set up their first property for free
- Respond to "how do I serve a notice in Alberta?" questions with helpful answers + mention your tool

**2. SEO content (free, slow burn)**

Target keywords:
- "Alberta residential lease template 2026 free"
- "How to serve a 14-day breach notice Alberta"
- "RTDRS dispute guide for Alberta landlords"
- "Move-out inspection checklist Alberta"
- "Alberta landlord utility splitting rules"
- "CRA T776 rental income guide"
- "Late fee policy Alberta residential tenancy"

Each article: helpful legal guide → free tool CTA → TenantPorch signup

Blog infrastructure: add a /blog route to TenantPorch (Phase 6) or use a subdomain blog.tenantporch.com on a free platform (Ghost, WordPress) while the product is being built.

**3. Local landlord meetups (free, high conversion)**

Target events:
- Calgary Real Estate Investors Club
- Edmonton Landlord Association
- REIN (Real Estate Investment Network) Alberta chapters
- Local REI meetup groups

Approach:
- Attend as a fellow landlord, not as a vendor
- 15-minute demo: "Here's how I generate a compliant lease in 2 minutes"
- Bring your phone, show the tenant portal live
- Offer to set up attendees for free
- Collect emails for a "launch list"

**4. Referral from tenants (free, viral)**

The viral loop:
1. Landlord signs up → invites tenant to TenantPorch
2. Tenant uses the portal daily (pays rent, submits maintenance, views docs)
3. Tenant moves to a new place
4. Tenant tells new landlord: "My last landlord used TenantPorch — it was great"
5. New landlord signs up

This is the growth flywheel no B2B SaaS competitor has — TenantPorch has a B2B2C distribution channel.

Accelerate with: "Invite your landlord" button in tenant portal, tenant referral incentive ($10 credit), landlord referral program ($25 credit per referral).

**5. SingleKey partnership (free, strategic)**

Approach:
- Contact SingleKey partnerships: "We're the property management layer for your customers"
- Proposition: landlords using SingleKey Collect still need lease management, maintenance tracking, inspections, notices
- Deal: SingleKey refers landlords to TenantPorch for management, TenantPorch refers landlords to SingleKey for screening
- Revenue share: they get screening commissions, you get SaaS subscriptions
- Both products get stronger — SingleKey's free rent collection + TenantPorch's management = complete solution

### Phase 2: Prove value, convert to paid (Months 3–6)

**Goal**: Convert 30% of free users to Starter ($14/month).

**Conversion triggers** (what makes a free user upgrade):
- Tired of chasing e-transfers monthly → upgrade for PAD
- Needs to split utility bills → upgrade for utility splitting
- Needs to renew a lease → upgrade for lease builder
- Wants financial reports → upgrade for reporting
- Tenant complains about 6% card surcharge → upgrade for 4% rate

**Conversion tactics**:

| Tactic | Implementation |
|--------|---------------|
| In-app nudge | "You confirmed 3 e-transfers this month. Set up PAD and never chase rent again." |
| Milestone email | After 30 days: "You've managed $2,600 in rent. Upgrade to track utilities too." |
| Feature gate timing | Show utility splitting UI but gate it: "Available on Starter" |
| Tenant pressure | Tenants see 6% surcharge → tell landlord → landlord upgrades for PAD |
| Tax season trigger | January/February: "Need your T776? Upgrade to Compliance pack for $5/month" |
| Lease renewal trigger | 60 days before lease expiry: "Renew with our lease builder — upgrade to Starter" |

### Phase 3: Expand within accounts (Months 6–12)

**Goal**: Increase average revenue per landlord from $24 to $49/month.

**Revenue expansion playbook**:
1. Landlord adds second property → +$5/month overage
2. Enables PAD on both properties → +$20/month transaction fees
3. Tax season → buys compliance pack → +$5/month
4. Vacancy → buys screening → +$40 per check
5. Tenant wants credit reporting → +$8/month rent reporting

**Revenue per customer over time**:
```
Month 1:  $0 (free) + $15 (PAD transaction) = $15
Month 3:  $14 (Starter) + $10 (PAD) = $24
Month 6:  $14 + $10 + $5 (compliance) + $40 (screening) = $69
Month 12: $24 (2 properties) + $20 (2× PAD) + $5 (compliance) = $49 recurring
```

### Phase 4: Province expansion (Month 12+)

**Goal**: Add Ontario and BC.

**Ontario** (10x market size of Alberta):
- Build Ontario standard lease template (mandatory form — landlords must use it)
- Ontario-specific notices (N-forms)
- LTB (Landlord and Tenant Board) guidance
- Same playbook: SEO + Facebook groups + meetups
- Target: GTA (Greater Toronto Area) landlords first

**BC**:
- Build BC lease templates (RTB forms)
- BC-specific notices
- Target: Vancouver + Victoria landlords
- Partnership with liv.rent competitors

---

## Revenue projections (realistic)

| Month | Landlords | Free | Paid | MRR (subs) | PAD txn revenue | Add-on revenue | Total monthly |
|-------|----------|------|------|-----------|----------------|---------------|--------------|
| 1 | 10 | 8 | 2 | $28 | $20 | $0 | $48 |
| 3 | 30 | 20 | 10 | $140 | $100 | $25 | $265 |
| 6 | 80 | 45 | 35 | $560 | $350 | $100 | $1,010 |
| 9 | 150 | 75 | 75 | $1,200 | $750 | $225 | $2,175 |
| 12 | 250 | 100 | 150 | $2,700 | $1,500 | $450 | $4,650 |
| 18 | 500 | 175 | 325 | $5,850 | $3,250 | $1,200 | $10,300 |
| 24 | 1,000 | 300 | 700 | $12,600 | $7,000 | $2,800 | $22,400 |

**Year 1 total revenue**: ~$25K–$35K
**Year 2 total revenue (with ON/BC)**: ~$150K–$250K ARR

**Key assumptions**:
- 60% free-to-paid conversion (over 6 months, not immediate)
- 65% PAD adoption among paid users
- 1.2 add-ons per paid customer average
- 5% monthly churn on paid (realistic for SMB SaaS)
- 15 new signups/month (months 1–6), 30/month (months 7–12)

---

## Key metrics to track

### Acquisition
- Total signups (free + paid) per month
- Signup source (Facebook, SEO, referral, direct, meetup)
- Free-to-paid conversion rate (target: 30% within 90 days)
- Time to first value (signup → first rent tracked)

### Revenue
- MRR (monthly recurring revenue)
- PAD transaction revenue per month
- Average revenue per landlord (ARPU)
- Revenue by stream: subscriptions / PAD fees / card surcharges / add-ons / referral commissions

### Engagement
- DAU/MAU ratio (target: >30% — landlords check in weekly minimum)
- PAD adoption rate (% of paid landlords using auto-debit)
- Payment method split: e-transfer vs card vs PAD
- Maintenance requests per property per month
- Documents uploaded per landlord

### Retention
- Monthly churn rate (target: <5%)
- Net revenue retention (target: >110% — expansion within accounts)
- Reasons for churn (survey cancelled users)

### Tenant engagement (the viral metric)
- Tenant portal logins per month
- % of tenants who use portal vs just receive emails
- Tenant referrals (tenants who recommended TenantPorch to new landlords)

---

## What NOT to do

| Don't | Why |
|-------|-----|
| Don't compete with SingleKey on price | They have funding. Compete on depth of management features. |
| Don't launch in 3 provinces at once | Be excellent in Alberta rather than mediocre everywhere. |
| Don't build for property managers | They want Buildium/AppFolio at $100+/month. Your market is self-managing landlords. |
| Don't spend money on paid ads yet | CAC will be too high with no social proof. Get 50 testimonials first. |
| Don't build Phase 4+ features before getting 50 users | Ship what you have, learn what they actually need. |
| Don't over-engineer the pricing page | Start simple: Free + Starter. Add Growth/Pro when someone asks for it. |
| Don't wait for perfection to launch | A working tenant portal + lease template is enough to get first users. |

---

## First 10 actions after Phase 3 build

1. **Invite your own tenants** (Lovepreet, Anmol) to use the portal — get real feedback from real users
2. **Join 5 Alberta landlord Facebook groups** — introduce yourself as a landlord, not a vendor
3. **Write your first SEO article**: "Free Alberta residential lease template for 2026" with downloadable template
4. **Record a 60-second screen recording** of the tenant portal and post in Facebook groups
5. **Find 5 landlords in your personal network** — set them up for free, hands-on
6. **Create a simple landing page** with "Get started free" CTA and a demo video
7. **Set up Google Analytics + Mixpanel** for tracking the key metrics above
8. **Register for the next Calgary REI meetup** — plan a 5-minute casual demo
9. **Email SingleKey partnerships** — propose the referral partnership
10. **Set up a support email** (support@tenantporch.com) and respond to every message within 2 hours

---

## The one thing that matters most

**Your #1 priority for the first 3 months is not revenue — it's getting 50 landlords to actually use the product.**

Every decision should optimize for adoption, not monetization. Give stuff away. Set up accounts for people manually. Answer support messages at midnight. Make the first 50 landlords feel like you built TenantPorch just for them.

The revenue follows adoption. The adoption follows value. The value is in the Alberta-specific features that no competitor has built.
