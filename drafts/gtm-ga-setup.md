# GTM & Google Analytics Setup — TenantPorch

> **Prompt**: Set up Google Tag Manager and Google Analytics 4 for a Next.js SaaS app (TenantPorch) that has three distinct user-facing areas: a public marketing website, a landlord admin portal, and a tenant portal. Track page views, signup funnel conversions, payment events, and feature engagement across all three. Use GTM as the tag management layer and GA4 for reporting.

---

## 1. Create Google Analytics 4 Property

1. Go to [analytics.google.com](https://analytics.google.com) → Admin → Create Property
2. Property name: **TenantPorch — Production**
3. Reporting time zone: **Canada (Eastern)**
4. Currency: **CAD**
5. Business description: SaaS property management platform
6. Create a **Web** data stream:
   - Website URL: `https://tenantporch.com`
   - Stream name: `TenantPorch Web`
   - Enable Enhanced Measurement (page views, scrolls, outbound clicks, site search)
7. Copy the **Measurement ID** → `G-XXXXXXXXXX`

### GA4 Custom Dimensions

Create these under Admin → Data Display → Custom Definitions:

| Dimension Name     | Scope | Parameter Name  | Description                               |
|--------------------|-------|-----------------|-------------------------------------------|
| Route Type         | Event | route_type      | `public`, `admin`, or `tenant`            |
| User Role          | User  | user_role       | `landlord`, `tenant`, or `visitor`        |
| Plan               | User  | plan            | `free`, `starter`, `growth`, `pro`        |
| Property Count     | User  | property_count  | Number of properties managed              |
| Signup Source       | Event | signup_source   | `direct`, `pricing_cta`, `referral`       |

### GA4 Key Events (Conversions)

Mark these events as Key Events in GA4 → Admin → Key Events:

- `signup_complete`
- `plan_upgraded`
- `first_property_added`
- `first_lease_created`
- `first_payment_received`

---

## 2. Create Google Tag Manager Container

1. Go to [tagmanager.google.com](https://tagmanager.google.com) → Create Account
2. Account name: **TenantPorch**
3. Container name: **tenantporch.com**
4. Target platform: **Web**
5. Copy the **Container ID** → `GTM-XXXXXXX`

---

## 3. GTM Variables

### Built-in Variables (enable all of these)

- Page URL, Page Path, Page Hostname, Page Title
- Referrer
- Click Element, Click Classes, Click ID, Click URL
- Form Element, Form Classes, Form ID
- History Source

### Data Layer Variables

| Variable Name           | Data Layer Variable Name | Version |
|-------------------------|--------------------------|---------|
| DLV - Event            | event                    | 2       |
| DLV - Route Type       | routeType                | 2       |
| DLV - User Role        | userRole                 | 2       |
| DLV - Plan             | plan                     | 2       |
| DLV - Plan Value       | planValue                | 2       |
| DLV - Property Count   | propertyCount            | 2       |
| DLV - Signup Source    | signupSource             | 2       |
| DLV - Payment Amount   | paymentAmount            | 2       |
| DLV - Feature Name     | featureName              | 2       |

### Custom JavaScript Variables

**CJS - Route Type** (auto-classify page path):
```javascript
function() {
  var path = {{Page Path}};
  if (path.indexOf('/admin') === 0) return 'admin';
  if (path.indexOf('/tenant') === 0) return 'tenant';
  return 'public';
}
```

### Lookup Table Variable

**LUT - GA4 Measurement ID** (for environment switching):
| Input ({{Page Hostname}})  | Output              |
|---------------------------|---------------------|
| tenantporch.com           | G-PROD_ID           |
| tenantporch.vercel.app    | G-STAGING_ID        |
| localhost                 | G-DEV_ID            |

---

## 4. GTM Triggers

### Page View Triggers

| Trigger Name           | Type                | Conditions                                                        |
|------------------------|---------------------|-------------------------------------------------------------------|
| All Pages              | Page View           | All pages                                                         |
| Public Pages           | Page View           | Page Path does NOT start with `/admin` AND does NOT start with `/tenant` |
| Admin Pages            | Page View           | Page Path starts with `/admin`                                    |
| Tenant Pages           | Page View           | Page Path starts with `/tenant`                                   |
| Signup Pages           | Page View           | Page Path starts with `/signup`                                   |
| Landing Page           | Page View           | Page Path equals `/`                                              |

### Custom Event Triggers — Signup Funnel

| Trigger Name           | Type          | Event Name              |
|------------------------|---------------|-------------------------|
| Signup Started         | Custom Event  | `signup_start`          |
| Signup OTP Verified    | Custom Event  | `signup_otp_verified`   |
| Signup Password Set    | Custom Event  | `signup_password_set`   |
| Signup Plan Selected   | Custom Event  | `signup_plan_selected`  |
| Signup Complete        | Custom Event  | `signup_complete`       |

### Custom Event Triggers — Landlord Portal

| Trigger Name              | Type          | Event Name                  |
|---------------------------|---------------|-----------------------------|
| Property Added            | Custom Event  | `property_added`            |
| Lease Created             | Custom Event  | `lease_created`             |
| Lease Signed              | Custom Event  | `lease_signed`              |
| Payment Received          | Custom Event  | `payment_received`          |
| Tenant Invited            | Custom Event  | `tenant_invited`            |
| Maintenance Created       | Custom Event  | `maintenance_created`       |
| Plan Upgraded             | Custom Event  | `plan_upgraded`             |
| Addon Activated           | Custom Event  | `addon_activated`           |
| Feature Gate Hit          | Custom Event  | `feature_gate_hit`          |
| ID Verification Purchased | Custom Event  | `id_verification_purchased` |

### Custom Event Triggers — Tenant Portal

| Trigger Name              | Type          | Event Name                  |
|---------------------------|---------------|-----------------------------|
| Rent Payment Made         | Custom Event  | `rent_payment_made`         |
| Maintenance Submitted     | Custom Event  | `maintenance_submitted`     |
| Document Viewed           | Custom Event  | `document_viewed`           |
| Message Sent              | Custom Event  | `message_sent`              |
| Lease Signed (Tenant)     | Custom Event  | `lease_signed_tenant`       |

---

## 5. GTM Tags

### GA4 Configuration Tag

| Setting              | Value                        |
|----------------------|------------------------------|
| Tag Type             | Google Analytics: GA4 Config |
| Measurement ID       | `{{LUT - GA4 Measurement ID}}` |
| Trigger              | All Pages                    |
| Send page view       | Yes                          |
| User Properties      | `user_role` = `{{DLV - User Role}}`, `plan` = `{{DLV - Plan}}`, `property_count` = `{{DLV - Property Count}}` |

### GA4 Event Tags

| Tag Name                        | Event Name              | Trigger              | Parameters                                                    |
|---------------------------------|-------------------------|----------------------|---------------------------------------------------------------|
| GA4 - Page View (Route Type)   | `page_view`             | All Pages            | `route_type` = `{{CJS - Route Type}}`                         |
| GA4 - Signup Start             | `signup_start`          | Signup Started       | `signup_source` = `{{DLV - Signup Source}}`                   |
| GA4 - Signup OTP Verified      | `signup_otp_verified`   | Signup OTP Verified  | —                                                             |
| GA4 - Signup Password Set      | `signup_password_set`   | Signup Password Set  | —                                                             |
| GA4 - Signup Plan Selected     | `signup_plan_selected`  | Signup Plan Selected | `plan` = `{{DLV - Plan}}`                                     |
| GA4 - Signup Complete          | `signup_complete`       | Signup Complete      | `plan` = `{{DLV - Plan}}`, `value` = `{{DLV - Plan Value}}`  |
| GA4 - Plan Upgraded            | `plan_upgraded`         | Plan Upgraded        | `plan` = `{{DLV - Plan}}`, `value` = `{{DLV - Plan Value}}`  |
| GA4 - Property Added           | `property_added`        | Property Added       | —                                                             |
| GA4 - Lease Created            | `lease_created`         | Lease Created        | —                                                             |
| GA4 - Payment Received         | `payment_received`      | Payment Received     | `amount` = `{{DLV - Payment Amount}}`                         |
| GA4 - Feature Gate Hit         | `feature_gate_hit`      | Feature Gate Hit     | `feature` = `{{DLV - Feature Name}}`                          |
| GA4 - Rent Payment Made        | `rent_payment_made`     | Rent Payment Made    | `amount` = `{{DLV - Payment Amount}}`                         |
| GA4 - Maintenance Submitted    | `maintenance_submitted` | Maintenance Submitted| —                                                             |

---

## 6. Complete Route Inventory

### Public Routes (unauthenticated visitors)

| Route                        | Description                  | Key Events to Track               |
|------------------------------|------------------------------|------------------------------------|
| `/`                          | Landing page                 | `page_view`, scroll depth, CTA clicks |
| `/login`                     | Login page                   | `login_attempt`, `login_success`   |
| `/signup`                    | Multi-step signup wizard     | Full signup funnel (5 events)      |
| `/signup?plan={slug}`        | Signup with pre-selected plan| `signup_start` with `signup_source=pricing_cta` |
| `/signup/thank-you`          | Post-payment confirmation    | `signup_complete` (conversion)     |
| `/forgot-password`           | Password reset request       | `password_reset_requested`         |
| `/reset-password`            | Password reset form          | `password_reset_completed`         |
| `/apply/[token]`             | Tenant application form      | `application_started`, `application_submitted` |
| `/sign/[token]`              | Lease signing page           | `lease_signing_started`, `lease_signed` |
| `/join/[token]`              | Tenant invite acceptance     | `invite_accepted`                  |
| `/pricing` (section on `/`)  | Pricing cards                | `pricing_viewed`, `plan_cta_clicked` |

### Admin Routes (landlord portal — authenticated)

| Route                        | Description              | Key Events to Track                    |
|------------------------------|--------------------------|----------------------------------------|
| `/admin/dashboard`           | Landlord dashboard       | `dashboard_viewed`                     |
| `/admin/properties`          | Property list            | `property_added`, `property_viewed`    |
| `/admin/properties/[id]`     | Property detail          | `property_detail_viewed`               |
| `/admin/applications`        | Application review       | `application_reviewed`, `application_approved` |
| `/admin/tenants`             | Tenant management        | `tenant_invited`, `tenant_viewed`      |
| `/admin/tenants/[id]`        | Tenant detail            | `id_verification_purchased`            |
| `/admin/financials`          | Financial overview       | `financials_viewed`                    |
| `/admin/maintenance`         | Maintenance requests     | `maintenance_created`, `maintenance_updated` |
| `/admin/documents`           | Document management      | `document_uploaded`, `lease_created`   |
| `/admin/messages`            | Messaging                | `message_sent`                         |
| `/admin/plan`                | Plan & services          | `plan_page_viewed`, `plan_upgraded`, `addon_activated` |
| `/admin/settings`            | Account settings         | `settings_updated`                     |

### Tenant Routes (tenant portal — authenticated)

| Route                        | Description              | Key Events to Track                    |
|------------------------------|--------------------------|----------------------------------------|
| `/tenant/dashboard`          | Tenant dashboard         | `tenant_dashboard_viewed`              |
| `/tenant/payments`           | Payment history          | `rent_payment_made`, `payment_history_viewed` |
| `/tenant/maintenance`        | Maintenance requests     | `maintenance_submitted`                |
| `/tenant/documents`          | Documents                | `document_viewed`                      |
| `/tenant/messages`           | Messaging                | `message_sent`                         |
| `/tenant/profile`            | Profile & ID verification| `profile_updated`, `id_verification_started` |

---

## 7. Implementation in Next.js Code

### 7.1 GTM Script in Root Layout

**File**: `src/app/layout.tsx`

```tsx
import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}
      </head>
      <body>
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}
```

### 7.2 Analytics Helper Utility

**File**: `src/lib/analytics.ts`

```typescript
// Type-safe dataLayer push
type AnalyticsEvent = {
  event: string;
  [key: string]: string | number | boolean | undefined;
};

export function trackEvent(eventData: AnalyticsEvent) {
  if (typeof window !== "undefined") {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push(eventData);
  }
}

// Set user properties (call after login/signup)
export function setUserProperties(props: {
  userRole: "landlord" | "tenant" | "visitor";
  plan?: string;
  propertyCount?: number;
}) {
  trackEvent({
    event: "user_properties_set",
    userRole: props.userRole,
    plan: props.plan,
    propertyCount: props.propertyCount,
  });
}

// ─── Signup Funnel ───
export function trackSignupStart(source: "direct" | "pricing_cta") {
  trackEvent({ event: "signup_start", signupSource: source });
}

export function trackSignupOtpVerified() {
  trackEvent({ event: "signup_otp_verified" });
}

export function trackSignupPasswordSet() {
  trackEvent({ event: "signup_password_set" });
}

export function trackSignupPlanSelected(plan: string) {
  trackEvent({ event: "signup_plan_selected", plan });
}

export function trackSignupComplete(plan: string, value?: number) {
  trackEvent({ event: "signup_complete", plan, planValue: value });
}

// ─── Landlord Portal ───
export function trackPropertyAdded() {
  trackEvent({ event: "property_added" });
}

export function trackLeaseCreated() {
  trackEvent({ event: "lease_created" });
}

export function trackPaymentReceived(amount: number) {
  trackEvent({ event: "payment_received", paymentAmount: amount });
}

export function trackPlanUpgraded(plan: string, value: number) {
  trackEvent({ event: "plan_upgraded", plan, planValue: value });
}

export function trackFeatureGateHit(featureName: string) {
  trackEvent({ event: "feature_gate_hit", featureName });
}

// ─── Tenant Portal ───
export function trackRentPaymentMade(amount: number) {
  trackEvent({ event: "rent_payment_made", paymentAmount: amount });
}

export function trackMaintenanceSubmitted() {
  trackEvent({ event: "maintenance_submitted" });
}
```

### 7.3 Signup Flow Events (already partially implemented)

**File**: `src/app/(auth)/signup/page.tsx`

Add `trackEvent` calls at each step transition:

```typescript
import { trackSignupStart, trackSignupOtpVerified, trackSignupPasswordSet, trackSignupPlanSelected } from "@/lib/analytics";

// In handleStep1 (after successful OTP send):
trackSignupStart(preselectedPlan ? "pricing_cta" : "direct");

// In handleStep2 (after successful OTP verify):
trackSignupOtpVerified();

// In handleStep3 (after successful password set):
trackSignupPasswordSet();

// In handlePlanSelect:
trackSignupPlanSelected(planSlug);
```

**File**: `src/app/(auth)/signup/thank-you/page.tsx` — already pushes `signup_complete`.

### 7.4 User Properties on Layout Load

**File**: `src/app/admin/layout.tsx` and `src/app/tenant/layout.tsx`

Pass user role and plan to a client component that sets dataLayer user properties on mount:

```tsx
// Client component: src/components/shared/analytics-identity.tsx
"use client";
import { useEffect } from "react";
import { setUserProperties } from "@/lib/analytics";

export function AnalyticsIdentity({ role, plan, propertyCount }: {
  role: "landlord" | "tenant";
  plan?: string;
  propertyCount?: number;
}) {
  useEffect(() => {
    setUserProperties({ userRole: role, plan, propertyCount });
  }, [role, plan, propertyCount]);
  return null;
}
```

Add `<AnalyticsIdentity role="landlord" plan={planSlug} propertyCount={propertyCount} />` in admin layout.
Add `<AnalyticsIdentity role="tenant" />` in tenant layout.

---

## 8. Environment Variables

Add to `.env.local` (and Vercel/Netlify env vars):

```env
# Google Tag Manager
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Google Analytics (used by GTM, not directly in code)
# GA4 Measurement ID is configured inside GTM, not in the app
```

### Database Storage Option

For dynamic tracking code management without redeployment:

```sql
CREATE TABLE IF NOT EXISTS rp_site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO rp_site_settings (key, value) VALUES
  ('gtm_container_id', 'GTM-XXXXXXX'),
  ('ga_measurement_id', 'G-XXXXXXXXXX');
```

Then fetch on server side in `layout.tsx` and pass to GTM script.

---

## 9. GA4 Reports to Create

### Signup Funnel Report
- Exploration → Funnel exploration
- Steps: `signup_start` → `signup_otp_verified` → `signup_password_set` → `signup_plan_selected` → `signup_complete`
- Breakdown by: `signup_source` (direct vs pricing_cta)

### Revenue by Plan
- Exploration → Free form
- Dimension: `plan`
- Metric: `event_count` for `signup_complete`, `plan_upgraded`

### Route Engagement
- Exploration → Free form
- Dimension: `route_type`
- Metrics: sessions, engaged sessions, engagement rate, average engagement time

### Feature Gate Analysis
- Exploration → Free form
- Dimension: `feature_name` (from `feature_gate_hit` events)
- Metric: `event_count`
- Identifies which features drive upgrades

### Tenant vs Landlord Engagement
- Exploration → Free form
- Dimension: `user_role`
- Metrics: sessions, events per session, engagement rate

---

## 10. Testing Checklist

- [ ] Install GTM/GA4 Debugger Chrome extension
- [ ] Enable GTM Preview mode
- [ ] Verify `page_view` fires on every route (public, admin, tenant)
- [ ] Verify `route_type` dimension is correct for each area
- [ ] Walk through signup funnel — confirm all 5 events fire in order
- [ ] Test pre-selected plan signup (`/signup?plan=starter`) — verify `signup_source=pricing_cta`
- [ ] Test direct signup (`/signup`) — verify `signup_source=direct`
- [ ] Verify user properties (`user_role`, `plan`) set after login
- [ ] Check GA4 Realtime report shows events arriving
- [ ] Verify no PII (email, name) is being sent to GA4
