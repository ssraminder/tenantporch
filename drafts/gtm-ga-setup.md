# GTM & Google Analytics Setup for TenantPorch

## 1. Create a Google Analytics 4 (GA4) Property

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a new GA4 property named **"TenantPorch — Production"**
3. Add a **Web** data stream:
   - URL: `https://tenantporch.com` (or your production domain)
   - Stream name: "TenantPorch Web App"
4. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

## 2. Create a Google Tag Manager (GTM) Container

1. Go to [tagmanager.google.com](https://tagmanager.google.com)
2. Create a new container:
   - Container name: **"TenantPorch"**
   - Target platform: **Web**
3. Copy the **Container ID** (format: `GTM-XXXXXXX`)

## 3. GTM Container Configuration

### 3.1 Variables

Create the following **Data Layer Variables**:

| Variable Name          | Data Layer Variable Name |
|------------------------|--------------------------|
| DLV - Event           | event                    |
| DLV - Plan            | plan                     |
| DLV - Route Type      | routeType                |
| DLV - Page Path       | page_path                |

Create **Built-in Variables** (enable if not already):
- Page URL
- Page Path
- Page Hostname
- Referrer

### 3.2 Triggers

Create the following triggers:

| Trigger Name              | Type              | Conditions                                      |
|---------------------------|-------------------|-------------------------------------------------|
| All Pages                 | Page View         | All pages                                       |
| Public Routes             | Page View         | Page Path matches `/`, `/login`, `/signup`, `/apply/*`, `/sign/*`, `/join/*` |
| Admin Routes              | Page View         | Page Path starts with `/admin`                  |
| Tenant Routes             | Page View         | Page Path starts with `/tenant`                 |
| Signup Complete           | Custom Event      | Event equals `signup_complete`                  |
| Signup Start              | Custom Event      | Event equals `signup_start`                     |
| Signup OTP Verified       | Custom Event      | Event equals `signup_otp_verified`              |
| Signup Password Set       | Custom Event      | Event equals `signup_password_set`              |
| Signup Plan Selected      | Custom Event      | Event equals `signup_plan_selected`             |

### 3.3 Tags

| Tag Name                   | Type          | Trigger            | Config                                      |
|----------------------------|---------------|--------------------|--------------------------------------------|
| GA4 - Config               | GA4 Config    | All Pages          | Measurement ID: `G-XXXXXXXXXX`              |
| GA4 - Signup Complete      | GA4 Event     | Signup Complete    | Event: `signup_complete`, Param: plan={{DLV - Plan}} |
| GA4 - Signup Funnel Events | GA4 Event     | All signup triggers| Event: `{{DLV - Event}}`                    |
| GA4 - Route Type           | GA4 Event     | All Pages          | Event: `page_view`, Param: route_type={{DLV - Route Type}} |

## 4. Route Classification

The app has three route groups that should be tracked separately:

### Public Routes (unauthenticated)
- `/` — Landing page
- `/login` — Login page
- `/signup` — Signup flow
- `/signup/thank-you` — Post-signup conversion page
- `/apply/[token]` — Tenant application form
- `/sign/[token]` — Lease signing
- `/join/[token]` — Tenant invite join

### Admin Routes (landlord authenticated)
- `/admin/dashboard` — Landlord dashboard
- `/admin/properties` — Property management
- `/admin/applications` — Application review
- `/admin/tenants` — Tenant management
- `/admin/financials` — Financial overview
- `/admin/maintenance` — Maintenance requests
- `/admin/documents` — Document management
- `/admin/messages` — Messaging
- `/admin/plan` — Plan & services
- `/admin/settings` — Account settings

### Tenant Routes (tenant authenticated)
- `/tenant/dashboard` — Tenant dashboard
- `/tenant/payments` — Payment history
- `/tenant/maintenance` — Maintenance requests
- `/tenant/documents` — Documents
- `/tenant/messages` — Messages
- `/tenant/profile` — Profile & ID verification

## 5. Key Conversion Events

Track these events in the signup funnel for conversion optimization:

| Event Name              | Trigger Point                     | Parameters     |
|-------------------------|-----------------------------------|----------------|
| `signup_start`          | User submits name & email (step 1)| email_domain   |
| `signup_otp_verified`   | User verifies OTP code (step 2)   | -              |
| `signup_password_set`   | User sets password (step 3)       | -              |
| `signup_plan_selected`  | User selects a plan (step 4)      | plan           |
| `signup_complete`       | Payment confirmed / free selected | plan, value    |

## 6. Implementation in Code

### Add GTM script to `src/app/layout.tsx`

Add the GTM snippet inside `<head>` using Next.js `<Script>` component:

```tsx
import Script from "next/script";

// In the <head> or top of <body>:
<Script id="gtm" strategy="afterInteractive">
  {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-XXXXXXX');`}
</Script>
```

Add noscript fallback at top of `<body>`:
```html
<noscript>
  <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0" width="0" style="display:none;visibility:hidden"></iframe>
</noscript>
```

### Push dataLayer events from signup flow

The signup page already pushes `signup_complete` on the thank-you page. Add additional pushes for funnel tracking:

```typescript
// Step 1 submit:
window.dataLayer?.push({ event: 'signup_start' });

// Step 2 OTP verified:
window.dataLayer?.push({ event: 'signup_otp_verified' });

// Step 3 password set:
window.dataLayer?.push({ event: 'signup_password_set' });

// Step 4 plan selected:
window.dataLayer?.push({ event: 'signup_plan_selected', plan: planSlug });
```

## 7. Database Storage for Tracking Codes

Store the GTM Container ID and GA Measurement ID in environment variables:

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Alternatively, store in a `rp_site_settings` table for dynamic configuration:

```sql
CREATE TABLE rp_site_settings (
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

This allows updating tracking codes without redeploying the app.
