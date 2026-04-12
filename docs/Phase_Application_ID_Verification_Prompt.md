# TenantPorch — Claude Code Prompt: Tenant Application + ID Verification

## Prerequisites
- Phase 3 (Landlord Admin) must be built
- Read docs/TenantPorch_Application_Form.md for full spec
- Database migrations already applied (rp_tenant_applications expanded, rp_id_verifications created, rp_users ID fields added)

## Prompt — paste into Claude Code:

```
Read docs/TenantPorch_Application_Form.md for the full feature spec.
Read docs/Claude_Code_Prompt_TenantPorch_v2.md for schema reference.
Read docs/TenantPorch_Design_Reference.md for styling.

Build two connected features: Tenant Application Form and 
Stripe Identity Verification.

DATABASE IS ALREADY MIGRATED — do not run these migrations:
- rp_tenant_applications has been expanded with all new fields
- rp_id_verifications table exists
- rp_users has id_type, id_number, id_document_status, stripe_identity fields
- rp_plans has free_id_verifications_per_month column
  (Free=0, Starter=0, Growth=1, Pro=2, Enterprise=999)

=== PART 1: TENANT APPLICATION FORM ===

PAGE 1 — Public application form (/apply/[token])
This is a PUBLIC route — no authentication required.

Fetch:
- Look up rp_tenant_applications by application_url_token
- Get property details from rp_properties
- Get landlord first name from rp_users (privacy: first name only)
- If token invalid or expired, show 404

Build:
- Property header card: address, bedrooms/bathrooms, monthly rent, 
  available date, landlord first name
- Multi-step form with progress bar (6 steps):

  STEP 1 — Personal Information:
  - First name (required)
  - Last name (required)
  - Email (required, email validation)
  - Phone (required)
  - Date of birth (required, date picker)
  - Current address (required)

  STEP 2 — Rental History:
  - Current landlord name
  - Current landlord phone
  - Current landlord email
  - Current monthly rent
  - Current lease end date
  - Reason for leaving (textarea)
  - Previous address
  - Previous landlord name, phone, email
  - "Have you ever been evicted?" Yes/No toggle
    → If yes: eviction details textarea
  - "Have you filed for bankruptcy?" Yes/No toggle
    → If yes: bankruptcy details textarea

  STEP 3 — Employment & Income:
  - Employer name (required)
  - Job title (required)
  - Employer address
  - Employer phone
  - Employment duration (required, e.g., "2 years")
  - Monthly income (required, currency input CAD)
  - Additional income amount
  - Additional income description
  IMPORTANT: Do NOT include a "Source of income" field.
  This violates the Alberta Human Rights Act. Only ask
  for income AMOUNT, never source.

  STEP 4 — Occupancy Details:
  - Number of occupants including applicant (required, number)
  - Names of all occupants (repeatable text fields — add/remove)
    → Show one field per occupant count, auto-add when count changes
  - Has pets? Yes/No toggle
    → If yes: pet details (type, breed, weight)
  - Is smoker? Yes/No
  - Has vehicle? Yes/No
    → If yes: make, model, license plate
  - Desired move-in date (required, date picker)
  - Desired lease term (required, select: Month-to-month, 6 months, 
    1 year, Other)

  STEP 5 — References:
  - Personal reference name (required)
  - Personal reference phone (required)
  - Personal reference relationship (required)
  - Note: "Previous landlord references were captured in Step 2"

  STEP 6 — Consent & Signature:
  Show legal text above each checkbox:

  ☐ Credit check consent (required):
  "I authorize the landlord or their agent to obtain a consumer 
  credit report from a credit reporting agency for the purpose 
  of evaluating this rental application."

  ☐ Reference check consent (required):
  "I consent to the landlord contacting the references provided 
  in this application."

  ☐ Background check consent (optional):
  "I consent to a background check if required by the landlord."

  ☐ PIPA consent (required):
  "I understand that the personal information collected in this 
  application will be used solely for the purpose of evaluating 
  my suitability as a tenant. This information will be stored 
  securely and will not be disclosed to third parties except as 
  authorized by me or as required by law. This collection is 
  authorized under the Personal Information Protection Act (PIPA), 
  SA 2003, c. P-6.5."

  Signature field: "Type your full legal name as your digital signature"
  - Text input (required)
  - Date auto-filled (today)

  Submit button: "Submit Application"
  → Capture ip_address + user_agent
  → INSERT into rp_tenant_applications with all fields
  → Set status = 'submitted', is_public_link = true

- Confirmation page (/apply/[token]/confirmation):
  "Your application has been submitted! The landlord will review 
  and contact you within a few days."
  Show: application reference number, property address, date submitted

- Mobile-first design (applicants will mostly use phones)
- Save progress between steps (localStorage or URL params)
- Validation on each step before proceeding

PAGE 2 — Generate application link (landlord side)
Modify: /admin/properties/[id] page

Add "Application Link" card in the property detail page:
- "Generate Application Link" button
  → POST creates rp_tenant_applications record with 
    application_url_token, property_id, landlord_id, is_public_link=true
  → Display the link: tenantporch.com/apply/[token]
  → "Copy Link" button (clipboard API)
  → "Share via Email" button (opens mailto: with pre-filled subject + link)
- Show existing application link if one exists for this property
- "Regenerate Link" option (invalidates old token)

PAGE 3 — Applications list (/admin/applications)
New page in landlord admin sidebar nav.

Fetch: all rp_tenant_applications WHERE landlord_id = current user

Build:
- Filter tabs: All | Submitted | Reviewing | Approved | Declined
- Application cards:
  - Applicant name, email, phone
  - Property address
  - Submitted date (relative time)
  - Status badge (submitted=blue, reviewing=amber, approved=green, 
    declined=red, withdrawn=gray)
  - Monthly income displayed
  - Number of occupants
  - Click → /admin/applications/[id]

PAGE 4 — Application detail (/admin/applications/[id])
Fetch: rp_tenant_applications by ID + related rp_reference_checks

Build:
- Applicant summary card at top:
  Name, email, phone, DOB, income, occupants, move-in date, 
  submitted date, status badge

- Full application (read-only display):
  All 6 sections rendered as cards matching the form structure
  Each field: label + value, empty fields shown as "Not provided"

- Consent status section:
  ✓/✗ Credit check consent
  ✓/✗ Reference check consent
  ✓/✗ Background check consent
  ✓/✗ PIPA consent
  Signature: "{typed name}" on {date}

- Reference checks section:
  For each landlord reference (current + previous):
    Show name, phone, email
    "Request Reference" button
    → Creates rp_reference_checks record with unique token
    → Sends email to landlord reference with link to reference form
    → Status: sent / completed / expired
  If reference completed: show responses inline

- Screening section:
  "Screen this applicant" button
  → Opens SingleKey referral flow with applicant name + email
  → Or future Certn API integration

- Landlord notes (private textarea, auto-saves):
  → UPDATE rp_tenant_applications.landlord_notes

- Action buttons (sticky bottom bar on mobile):
  [Approve & Create Lease] — green
    → Pre-fills /admin/leases/new with applicant data:
      tenant name, email, phone, property_id, move_in_date,
      number_of_occupants, occupant_names, pet_details
    → UPDATE status = 'approved', reviewed_at, reviewed_by
    → Send approval email to applicant

  [Decline] — red
    → Modal: "Reason for declining" (required textarea)
    → UPDATE status = 'declined', rejection_reason, reviewed_at
    → Send decline email (generic, no discriminatory details)

  [Request More Info] — amber
    → Modal: "What information do you need?" (textarea)
    → Send email to applicant with the question
    → UPDATE status = 'reviewing'

PAGE 5 — Reference form (/reference/[token])
PUBLIC route — no authentication.

Fetch: rp_reference_checks by token, validate not expired/completed

Build:
- Header: "Rental Reference for {applicant_name}"
- "You have been listed as a reference by {applicant_name} who is 
  applying to rent at {property_address}."
- Form fields:
  - How long did the tenant rent from you? (text)
  - Was rent paid on time? (select: Always, Usually, Sometimes, Rarely)
  - Were there any lease violations? (Yes/No → details if yes)
  - Did the tenant maintain the property in good condition? (Yes/No)
  - Were there any noise or neighbor complaints? (Yes/No)
  - Would you rent to this person again? (Yes/No)
  - Additional comments (textarea)
- Submit → UPDATE rp_reference_checks with responses JSONB, 
  status = 'completed', completed_at
- Notify landlord: "Reference received for {applicant_name}"
- Confirmation: "Thank you for your response."

=== PART 2: STRIPE IDENTITY VERIFICATION ===

PAGE 6 — Tenant ID verification (modify /tenant/profile)
Add "Identity Verification" section to the tenant profile page.

Three states:

STATE A — Not verified (id_document_status = 'none'):
  Card with:
  "Verify your identity"
  "Your landlord requires identity verification before 
  signing the lease."
  "You'll need:
  📄 Government-issued photo ID (driver's licence, passport, or PR card)
  📷 A quick selfie"
  "Takes about 2 minutes. Your data is securely processed by 
  Stripe — TenantPorch never sees your full ID details."
  
  [Verify now] button (primary, large)
  → POST /api/stripe/identity/create-session
  → Redirect to Stripe Identity hosted page
  
  "— or —"
  
  [Upload ID manually instead] button (secondary, small)
  → Show manual upload form:
    ID type dropdown, ID number, place of issue, expiry date,
    name on document, photo upload (front + back)
  → UPDATE rp_users ID fields, id_document_status = 'pending'
  → Notify landlord

STATE B — Pending/Processing:
  "⏳ Verification in progress"
  "We're verifying your identity. This usually takes less than 
  a minute."
  
  Or for manual upload:
  "⏳ ID uploaded — waiting for landlord review"

STATE C — Verified (id_document_status = 'approved'):
  "✓ Identity verified"
  "Verified on: {date}"
  "Document type: {id_type}"
  "Name on ID: {id_name_on_document}"
  "You're ready to sign your lease."

STATE D — Failed/Rejected:
  "✗ Verification failed"
  "{reason}"
  [Try again] button

API ROUTE — /api/stripe/identity/create-session (POST)
  - Requires auth (tenant must be logged in)
  - Get tenant's landlord from lease relationship
  - Check landlord's plan for free verification quota:
    → Count rp_id_verifications WHERE landlord_id AND 
      used_free_quota = true AND created_at >= start of current month
    → If count < plan.free_id_verifications_per_month: free (used_free_quota=true)
    → Else: charge landlord $3.99
  - Create Stripe Identity verification session:
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
        used_free_quota: String(usedFreeQuota),
      },
      return_url: `${APP_URL}/tenant/profile?verified=pending`,
    });
  - Insert rp_id_verifications record
  - UPDATE rp_users stripe_identity_session_id, stripe_identity_status = 'pending'
  - Return { url: session.url }

WEBHOOK — Add to /api/stripe/webhook handler:

  case 'identity.verification_session.verified':
    const session = event.data.object;
    const tenantId = session.metadata.tenant_id;
    const landlordId = session.metadata.landlord_id;
    const usedFreeQuota = session.metadata.used_free_quota === 'true';
    
    // Get verified data from the session
    const verifiedData = session.verified_outputs;
    
    // Update rp_users
    await supabase.from('rp_users').update({
      id_document_status: 'approved',
      id_type: verifiedData.id_number?.id_type || 'unknown',
      id_number: verifiedData.id_number?.id_number,
      id_name_on_document: `${verifiedData.first_name} ${verifiedData.last_name}`,
      id_expiry_date: verifiedData.id_number?.expiry_date,
      stripe_identity_status: 'verified',
      stripe_identity_verified_at: new Date(),
      stripe_identity_report_id: session.last_verification_report,
      id_reviewed_at: new Date(),
    }).eq('id', tenantId);
    
    // Update rp_id_verifications
    await supabase.from('rp_id_verifications').update({
      status: 'verified',
      extracted_first_name: verifiedData.first_name,
      extracted_last_name: verifiedData.last_name,
      extracted_dob: verifiedData.dob?.date,
      extracted_id_number: verifiedData.id_number?.id_number,
      extracted_id_type: verifiedData.id_number?.id_type,
      extracted_id_expiry: verifiedData.id_number?.expiry_date,
      selfie_match_score: verifiedData.selfie?.match_score,
      completed_at: new Date(),
      used_free_quota: usedFreeQuota,
    }).eq('stripe_session_id', session.id);
    
    // Charge landlord $3.99 if not free quota
    if (!usedFreeQuota) {
      await stripe.paymentIntents.create({
        amount: 399,
        currency: 'cad',
        customer: landlordStripeCustomerId,
        confirm: true,
        off_session: true,
        metadata: { type: 'id_verification', tenant_id: tenantId },
      });
      await supabase.from('rp_id_verifications').update({
        billed: true, billed_at: new Date(),
      }).eq('stripe_session_id', session.id);
    }
    
    // Notify landlord
    await createNotification(landlordId, 
      'Identity verified', 
      `${tenantName}'s identity has been verified via Stripe Identity.`,
      'general'
    );
    break;

  case 'identity.verification_session.requires_input':
    // Verification failed
    const failedSession = event.data.object;
    await supabase.from('rp_users').update({
      id_document_status: 'rejected',
      stripe_identity_status: 'failed',
    }).eq('id', failedSession.metadata.tenant_id);
    
    await supabase.from('rp_id_verifications').update({
      status: 'failed',
      completed_at: new Date(),
    }).eq('stripe_session_id', failedSession.id);
    
    // Notify tenant — no charge on failure
    break;

PAGE 7 — Landlord tenant detail ID section (modify /admin/tenants/[id])
Add "ID Verification" card to the tenant detail page.

Fetch: rp_id_verifications WHERE tenant_id = this tenant, latest first

Show:
- If verified (Stripe Identity):
  Status: ✓ Verified (Stripe Identity)
  Verified: {date}
  Document: {extracted_id_type}
  Name on ID: {extracted_first_name} {extracted_last_name}
  Selfie match: {selfie_match_score}%
  Cost: $3.99 (or "Free — included in plan")
  [View Stripe report] link

- If verified (manual):
  Status: ✓ Verified (Manual)
  Document: {id_type}
  Name on ID: {id_name_on_document}
  Approved by: {reviewer name} on {date}

- If pending (manual upload):
  Status: ⏳ Pending review
  Document: {id_type}, uploaded {date}
  [View uploaded ID] → show photo
  [Approve] [Reject] buttons
  → Approve: UPDATE id_document_status = 'approved', id_reviewed_at, id_reviewed_by
  → Reject: UPDATE id_document_status = 'rejected' + reason

- If not verified:
  Status: ✗ Not verified
  [Request verification] button
    → Send notification to tenant: "Your landlord requires ID verification"
    → Show cost to landlord: "Free (X of Y remaining)" or "$3.99"
  [Upload manually for tenant] → same manual form as tenant side

=== PART 3: LEASE SIGNING GATE ===

Modify: the "Send for signatures" flow (wherever it exists)

Before allowing lease to be sent for signing, check:
1. All tenants on the lease have id_document_status = 'approved'
2. If any tenant is NOT approved:
   → Show warning banner:
     "⚠ Cannot send for signing — the following tenants have 
     not verified their identity:"
     - {tenant_name}: Not verified [Request verification]
     - {tenant_name}: Pending review [Review now]
   → "Send for signing" button is disabled
3. When all tenants are verified:
   → Auto-populate Schedule B of the lease with ID data
   → Enable "Send for signing" button

=== NAVIGATION UPDATE ===

Add to landlord admin sidebar:
- "Applications" nav item (between Tenants and Properties)
- Badge showing count of unreviewed applications (status = 'submitted')

=== ROUTES SUMMARY ===

Public (no auth):
- /apply/[token] — application form
- /apply/[token]/confirmation — submission confirmation
- /reference/[token] — reference check form

Landlord admin:
- /admin/applications — all applications
- /admin/applications/[id] — application detail + review

API:
- POST /api/applications/submit — public form submission
- POST /api/stripe/identity/create-session — start Stripe Identity
- Webhooks: identity.verification_session.verified + requires_input

Follow the Editorial Estate design system. All pages responsive.
Mobile-first for the public application form.
```
