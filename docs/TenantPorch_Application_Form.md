# TenantPorch — Tenant Application Form

## Overview

A shareable rental application form that landlords can send to prospective tenants before signing a lease. Compliant with the Alberta Human Rights Act and Personal Information Protection Act (PIPA).

**Available on**: All plans (including Free)

---

## Alberta compliance rules

Per the Government of Alberta's "Verifying Tenant Information" guide:

### CAN ask
- Name, contact information
- How they found out about the listing
- Amount of income (NOT source of income)
- References (personal + previous landlords)
- Number of occupants + names
- Employment information (employer, duration, job title)
- Credit report (with written consent)
- Court of King's Bench civil search (public record)
- Co-signors/guarantors (but NOT routinely from a particular type of person)

### CANNOT ask
- Source of income (income supports, rental subsidies, etc.)
- Discriminatory questions based on race, gender, religion, ethnicity, sexual orientation, disability, family status, marital status
- Cannot routinely require co-signors from specific groups

### PIPA requirements
- Must have a legitimate business purpose for collecting personal information
- Must obtain consent before collecting, using, or disclosing personal information
- Application form must include a PIPA consent statement
- Collected information must be stored securely and only used for tenancy decision

---

## How it works

### Landlord flow
1. Landlord goes to `/admin/properties/[id]` → clicks "Generate Application Link"
2. System creates an `rp_tenant_applications` record with a unique `application_url_token`
3. Landlord copies the public link: `tenantporch.com/apply/[token]`
4. Landlord shares via text, email, or listing ad
5. Multiple applicants can use the same property link (each creates a new application)
6. Landlord reviews applications at `/admin/applications` or `/admin/properties/[id]/applications`
7. Landlord can: approve, decline (with reason), request more info, or move to lease creation

### Applicant flow
1. Applicant clicks the link → lands on public form (no login required)
2. Fills out the application form (see sections below)
3. Signs consent checkboxes (credit check, reference check, PIPA)
4. Types their name as digital signature
5. Submits → confirmation page: "Application submitted. The landlord will review and contact you."
6. Receives email confirmation with application reference number

---

## Application form sections

### Section 1: Personal information
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| First name | Text | Yes | |
| Last name | Text | Yes | |
| Email | Email | Yes | |
| Phone | Phone | Yes | |
| Date of birth | Date | Yes | |
| Current address | Text | Yes | |

### Section 2: Rental history
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Current landlord name | Text | No | |
| Current landlord phone | Phone | No | |
| Current landlord email | Email | No | |
| Current monthly rent | Currency | No | |
| Current lease end date | Date | No | |
| Reason for leaving | Textarea | No | |
| Previous address | Text | No | |
| Previous landlord name | Text | No | |
| Previous landlord phone | Phone | No | |
| Previous landlord email | Email | No | |
| Have you been evicted? | Yes/No | Yes | If yes, show details field |
| Eviction details | Textarea | Conditional | |

### Section 3: Employment & income
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Employer name | Text | Yes | |
| Job title | Text | Yes | |
| Employer address | Text | No | |
| Employer phone | Phone | No | |
| Employment duration | Text | Yes | e.g., "2 years" |
| Monthly income | Currency | Yes | "Amount of income, not source" per Alberta HRA |
| Additional income amount | Currency | No | |
| Additional income description | Text | No | Generic description only, NOT source |
| Filed bankruptcy? | Yes/No | Yes | If yes, show details |

**IMPORTANT**: The form must NOT ask "Where does your income come from?" or "Do you receive government assistance?" This violates the Alberta Human Rights Act.

### Section 4: Occupancy details
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Number of occupants | Number | Yes | Including the applicant |
| Names of all occupants | Repeatable text fields | Yes | Per Alberta guidelines, landlord can ask for names |
| Has pets? | Yes/No | Yes | |
| Pet details | Text | Conditional | Type, breed, weight |
| Is smoker? | Yes/No | Yes | |
| Has vehicle? | Yes/No | No | |
| Vehicle details | Text | Conditional | Make, model, license plate (for parking) |
| Desired move-in date | Date | Yes | |
| Desired lease term | Select | Yes | Month-to-month, 6 months, 1 year, Other |

### Section 5: References
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Personal reference name | Text | Yes | |
| Personal reference phone | Phone | Yes | |
| Personal reference relationship | Text | Yes | |
| (Previous landlord references already captured in Section 2) | | | |

### Section 6: Consent & signature
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Credit check consent | Checkbox | Yes | "I consent to the landlord obtaining a credit report from a reporting agency." |
| Reference check consent | Checkbox | Yes | "I consent to the landlord contacting the references provided above." |
| Background check consent | Checkbox | No | "I consent to a background check if required." |
| PIPA consent | Checkbox | Yes | See PIPA statement below |
| Applicant signature (typed name) | Text | Yes | Full legal name |
| Signature date | Auto-filled | Yes | Current date |

**PIPA consent statement** (must appear on form):
> "I understand that the personal information collected in this application will be used solely for the purpose of evaluating my suitability as a tenant. This information will be stored securely and will not be disclosed to third parties except as authorized by me or as required by law. This collection is authorized under the Personal Information Protection Act (PIPA), SA 2003, c. P-6.5."

**Credit check consent statement**:
> "I authorize the landlord or their agent to obtain a consumer credit report from a credit reporting agency for the purpose of evaluating this rental application. I understand that this may be a soft inquiry that does not affect my credit score."

---

## Database

Table: `rp_tenant_applications` (already exists, expanded with new fields)

Key columns for the application flow:
- `application_url_token` — unique token for public application link
- `is_public_link` — true if this was submitted via public link
- `consent_credit_check`, `consent_reference_check`, `consent_background_check`, `consent_pipa` — consent tracking
- `applicant_signature`, `signature_date` — digital signature
- `ip_address`, `user_agent` — audit trail
- `status` — submitted, reviewing, approved, declined, withdrawn
- `reviewed_at`, `reviewed_by`, `rejection_reason`, `landlord_notes` — landlord review

---

## Routes

### Public (no auth)
| Route | Purpose |
|-------|---------|
| `/apply/[token]` | Public application form |
| `/apply/[token]/confirmation` | Submission confirmation |

### Landlord admin
| Route | Purpose |
|-------|---------|
| `/admin/applications` | All applications across properties |
| `/admin/applications/[id]` | Application detail + review |
| `/admin/properties/[id]/applications` | Applications for specific property |

### API
| Route | Purpose |
|-------|---------|
| `POST /api/applications/submit` | Public form submission (no auth) |
| `POST /api/applications/[id]/review` | Landlord approve/decline |

---

## Landlord review page

When reviewing an application, the landlord sees:

1. **Applicant summary card**: name, email, phone, move-in date, income, occupants
2. **Full application** (read-only): all fields from the submitted form
3. **Consent status**: which consents were given (credit, reference, background, PIPA)
4. **Reference check**: buttons to auto-email previous landlords with a reference questionnaire (uses `rp_reference_checks` table)
5. **Screening**: "Screen this applicant" button → SingleKey referral with applicant's name + consent
6. **Actions**:
   - "Approve & Create Lease" → pre-fills lease creation with applicant data
   - "Decline" → requires reason, sends polite email to applicant
   - "Request More Info" → sends email asking for specific information
   - "Add Notes" → private landlord notes (not visible to applicant)

---

## Application → lease flow

When landlord approves and clicks "Create Lease":
1. System pre-fills lease creation form with:
   - Tenant name, email, phone from application
   - Property from application.property_id
   - Move-in date from application.move_in_date
   - Number of occupants from application
   - Occupant names from application
   - Pet details from application
2. Landlord completes remaining lease fields (rent, deposit, term, etc.)
3. Lease created → tenant invited → ID verification → lease signing flow

---

## Notification emails

| Email | Trigger | Recipient |
|-------|---------|-----------|
| Application received | Applicant submits | Landlord |
| Application confirmation | Applicant submits | Applicant |
| Application approved | Landlord approves | Applicant |
| Application declined | Landlord declines | Applicant (includes generic reason, no discriminatory detail) |
| Request more info | Landlord requests info | Applicant |
| Reference request | Landlord requests reference | Previous landlord |

---

## Reference check automation

When landlord clicks "Request Reference" for a previous landlord:
1. System sends email to `current_landlord_email` or `previous_landlord_email`
2. Email contains a unique link to a reference form
3. Reference form asks:
   - How long did the tenant rent from you?
   - Was rent paid on time?
   - Were there any lease violations?
   - Would you rent to this person again?
   - Any additional comments?
4. Responses saved to `rp_reference_checks` table
5. Landlord notified when reference is completed

---

## Shareable link for listings

The public application link can be embedded in:
- Kijiji/Facebook Marketplace rental ads
- Property listing websites (RentFaster, Zumper)
- Text messages to prospective tenants
- QR code on printed for-rent signs

Format: `https://tenantporch.com/apply/[token]`

The page shows:
- Property address and details (from rp_properties)
- Landlord name (first name only for privacy)
- Number of bedrooms/bathrooms
- Monthly rent
- Available date
- The application form below


---

## ID verification via Stripe Identity

After a tenant is approved and invited to TenantPorch, they verify their identity using Stripe Identity. This is separate from the application form.

### What Stripe Identity does

| Step | What happens |
|------|-------------|
| 1 | Tenant clicks "Verify my identity" in their profile |
| 2 | Redirect to Stripe Identity hosted page (mobile-optimized) |
| 3 | Tenant takes photo of **front of ID** (driver's licence, passport, PR card) |
| 4 | Tenant takes photo of **back of ID** |
| 5 | Tenant takes a **selfie** |
| 6 | Stripe matches selfie face to ID photo (liveness check) |
| 7 | Stripe validates document (expiry, format, fraud detection) |
| 8 | Stripe extracts data: name, DOB, ID number, expiry, address |
| 9 | Webhook fires → TenantPorch updates verification status |

### Pricing

| | Amount |
|---|--------|
| Stripe charges you | ~$1.50 per verification |
| You charge landlord | **$3.99 per verification** |
| Your margin | **$2.49 per verification** |
| Available on | All plans (including Free) |

### Implementation flow

```
Tenant profile → "Verify your identity" button

→ POST /api/stripe/identity/create-session
  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    options: {
      document: {
        allowed_types: ['driving_license', 'passport', 'id_card'],
        require_matching_selfie: true,
        require_id_number: true,
      },
    },
    metadata: {
      tenant_id: tenant.id,
      landlord_id: landlord.id,
      property_id: property.id,
    },
    return_url: 'https://tenantporch.com/tenant/profile?verified=true',
  });

→ Redirect tenant to session.url
→ Tenant takes photos on Stripe's mobile-optimized page
→ Stripe processes (usually < 1 minute)

→ Webhook: identity.verification_session.verified
  - Extract data: first_name, last_name, dob, id_number, id_type, expiry
  - Update rp_users: id_document_status = 'approved',
    id_type, id_number, id_expiry_date, id_name_on_document
  - Insert rp_id_verifications with extracted data + selfie match score
  - Charge landlord $3.99 via Stripe
  - Notify landlord: "Tenant identity verified"
  - Auto-populate Schedule B of any draft lease for this tenant

→ Webhook: identity.verification_session.requires_input
  - Verification failed (blurry photo, face mismatch, expired ID)
  - Update rp_users: id_document_status = 'rejected'
  - Notify tenant: "Verification failed — please try again"
  - No charge to landlord on failure
```

### What the tenant sees

```
┌─────────────────────────────────────────┐
│  Verify your identity                   │
│                                         │
│  Your landlord requires identity        │
│  verification before signing the lease. │
│                                         │
│  You'll need:                           │
│  📄 Government-issued photo ID          │
│     (driver's licence, passport,        │
│      or PR card)                        │
│  📷 A quick selfie                      │
│                                         │
│  Takes about 2 minutes.                 │
│  Your data is securely processed by     │
│  Stripe — TenantPorch never sees your   │
│  full ID details.                       │
│                                         │
│  [Verify now]                           │
│                                         │
│  ── or ──                               │
│                                         │
│  [Upload ID manually instead]           │
│  (Your landlord will review manually)   │
└─────────────────────────────────────────┘
```

After verification:
```
┌─────────────────────────────────────────┐
│  ✓ Identity verified                    │
│                                         │
│  Verified on: April 11, 2026            │
│  Document type: Driver's Licence        │
│  Name on ID: Lovepreet Kaur             │
│                                         │
│  Your identity has been confirmed.      │
│  You're ready to sign your lease.       │
└─────────────────────────────────────────┘
```

### What the landlord sees

On the tenant detail page (`/admin/tenants/[id]`):

```
┌─────────────────────────────────────────┐
│  ID Verification                        │
│                                         │
│  Status: ✓ Verified (Stripe Identity)   │
│  Verified: April 11, 2026               │
│  Document: Driver's Licence             │
│  Name on ID: Lovepreet Kaur             │
│  Selfie match: 98.5%                    │
│  Cost: $3.99                            │
│                                         │
│  [View verification report]             │
│                                         │
│  — or if not yet verified —             │
│                                         │
│  Status: ⏳ Not verified                │
│  [Request verification] [Upload manually]│
└─────────────────────────────────────────┘
```

### Manual fallback

For landlords who don't want to pay $3.99 or tenants who can't use the camera flow:
- Tenant uploads photo of ID front + back manually
- Status set to "pending" (landlord reviews)
- Landlord clicks "Approve" or "Reject"
- No charge for manual verification
- No face matching or fraud detection

### Lease signing gate

The "Send for signing" button checks:
1. All tenants have `id_document_status = 'approved'` (via Stripe Identity OR manual approval)
2. If any tenant is not verified → show warning: "Tenant {name} has not verified their identity"
3. Landlord can choose to: request verification ($3.99), upload manually (free), or override (at their own risk)

### Webhook events to register

Add to your Stripe webhook endpoint:

| Event | Action |
|-------|--------|
| `identity.verification_session.verified` | Mark verified, extract data, charge landlord, notify |
| `identity.verification_session.requires_input` | Mark failed, notify tenant to retry |
| `identity.verification_session.canceled` | Mark cancelled, no charge |
