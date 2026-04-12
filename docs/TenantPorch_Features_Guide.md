# TenantPorch — Feature Guide (Free Plan)

> Tested and verified on April 11, 2026. All features below are fully functional on the Free plan.

---

## 1. Admin Dashboard

**URL:** `/admin/dashboard`

The dashboard provides a complete overview of your property management at a glance.

### What you'll see:
- **Welcome banner** with your name
- **4 summary cards:** Properties count, Active Leases, Revenue This Month, Open Maintenance Requests
- **Monthly Revenue chart** — 12-month interactive area chart powered by Recharts
- **Tenants section** — Quick list of your tenants with "View All" link
- **Security Deposits** — Total deposits held, active count, per-property breakdown
- **Premium feature cards** — SMS Notifications, Pre-Authorized Debit (PAD), Payment Links, Tenant Screening (upgrade required)
- **Rent Collection tracker** — Current month's total due, collected, and outstanding with progress bar
- **Recent Payments** — Last payments with date, tenant, amount, method, and status badges
- **Open Requests** — Active maintenance requests with property, urgency, and status
- **Recent Activity** — Timeline combining payments, maintenance, and notifications

---

## 2. Properties

**URL:** `/admin/properties`

### Properties List
- Displays all properties as cards with:
  - Address and city
  - **Status badge** (VACANT / OCCUPIED)
  - Monthly rent amount
  - Lease status (UPCOMING LEASE / ACTIVE / etc.)
  - Tenant count
- **Search bar** — Filter by address, city, or postal code
- **Plan limit indicator** — Shows "X of Y properties on the Free plan"
- **Add Property button** — Blocked when at plan limit with "Upgrade to add more properties" message

### Property Detail (`/admin/properties/[id]`)
- **Breadcrumb navigation** — Dashboard > Properties > [Address]
- **Edit Property button**
- **Property Details section:**
  - Unit Features: Separate entrance, mailbox, furnished, storage, yard access, sticker number
  - Parking & Laundry: Type, spots, laundry type
  - Climate Control: Heating and cooling types
  - Internet / WiFi configuration
  - Financials: Monthly rent, pet deposit
- **Current Lease section:**
  - Lease type, period, monthly rent
  - Security deposit, utility split %, PAD status
  - Pets allowed, smoking allowed, max occupants
  - Renew Lease and Edit Lease buttons
  - Contextual lease labels (UPCOMING LEASE, ACTIVE, etc.)
- **Tenants section** — Linked tenants with email
- **Recent Payments** — Last 5 payments for this property
- **Maintenance History** — Last 5 requests for this property

### Add Property (`/admin/properties/new`)
- **Address section:** Line 1, Line 2, City, Province (dropdown), Postal Code, Unit Description
- **Unit Features:** Checkboxes for separate entrance, mailbox, furnished, storage, yard access
- **Parking & Laundry:** Type dropdowns, parking spots count
- **Climate Control:** Heating and cooling type dropdowns
- **Internet / WiFi:** Provider, included toggle, speed
- **Financials:** Monthly rent, pet deposit, security deposit
- **Free plan limit enforced** — Cannot add more than 1 property

### Edit Property (`/admin/properties/[id]/edit`)
- Pre-filled form with all current property data
- Same fields as Add Property

---

## 3. Tenants

**URL:** `/admin/tenants`

### Tenants List
- Shows all tenants with:
  - Avatar (initials), name, email, phone
  - Property address, rent amount, lease dates
  - Status badges: UPCOMING LEASE, PRIMARY, OCCUPANT
- **Search bar** — Filter by name, email, or property
- **Export CSV button** — Downloads tenant list as CSV
- **Invite Tenant button**

### Tenant Detail (`/admin/tenants/[id]`)
- **Breadcrumb navigation** — Dashboard > Tenants > [Name]
- **Action buttons:** Send Message, Record Payment, View Property
- **Tenant info:** Avatar, name, email, member since date, status badge
- **Lease Details:** Property, type, period, rent, deposit, utility split, PAD, pets, smoking, max occupants
- **Payment History** — All payments from this tenant

### Invite Tenant (`/admin/tenants/invite`)
- Select property from dropdown
- Enter tenant details: First name, Last name, Email, Phone
- Sends invitation email via Resend

---

## 4. Financials

**URL:** `/admin/financials`

### Overview Tab
- **3 summary cards:** Total Revenue (all time), This Month, Outstanding (overdue)
- **Rent Collection tracker** — Current month with progress bar
- **Revenue by Property** — Breakdown showing each property's collected amount and tenant count
- **Payment History table:**
  - Columns: Date, Tenant, Property, Amount, Surcharge, Total, Method, Status
  - **Search** by tenant or property
  - **Filter by Status:** All, Pending, Confirmed, Failed
  - **Filter by Method:** All, E-Transfer, Card, Cheque, Cash, PAD
  - **Export CSV** — Download payment history

### Utilities Tab
- Utility tracking and billing (available on all plans)

### Deposits Tab (`/admin/financials?tab=deposits`)
- **Summary cards:** Total Deposits Held, Active Deposits count
- **All Deposits table:** Property, Tenant(s), Deposit amount, Date paid, Lease dates, Status
- **Alberta Security Deposit Rules** — Legal reference cards:
  - Maximum Amount: Cannot exceed one month's rent
  - Trust Account: Must be held in a trust account at a financial institution
  - Return Timeline: Must be returned within 10 days of lease end

---

## 5. Maintenance

**URL:** `/admin/maintenance`

### Kanban Board
- **5 columns:** Submitted, Acknowledged, In Progress, Scheduled, Completed
- **Summary stats:** Total requests, Open count, Completed count
- Each request card shows:
  - Title, property address, tenant name
  - Category tag (PLUMBING, ELECTRICAL, etc.)
  - Urgency badge (LOW, MEDIUM, HIGH, EMERGENCY)
  - Time ago

### Maintenance Detail (`/admin/maintenance/[id]`)
- **Breadcrumb navigation** — Dashboard > Maintenance > [Title]
- **Status badges:** Current status, urgency, category
- **Description** — Full details of the request
- **Photos section** — Gallery of uploaded images with lightbox
- **Upload Photos** — Drag & drop zone (JPG, PNG, GIF, WebP up to 5 MB)
- **Sidebar:** Property info, Tenant info, Timeline (created/updated dates)
- **Status actions:** Acknowledge, Cancel (context-dependent buttons based on current status)

### New Maintenance Request (`/admin/maintenance/new`)
- Select property, select tenant
- Title, description, category dropdown, urgency dropdown
- Photo upload

---

## 6. Documents

**URL:** `/admin/documents`

- **Document list** with file details
- **Upload Document button** — Upload leases, inspection reports, utility bills
- Supports organizing documents by property and type
- Empty state with helpful guidance text

---

## 7. Messages

**URL:** `/admin/messages`

### Message Center
- **All Messages panel** — Conversation threads with tenants
- **Notifications panel** — System notifications (payments, maintenance, etc.)
- **New Message button** — Compose a new message to a tenant
- **Threaded replies** — Messages linked via parent_message_id
- Empty state with guidance: "Start a conversation by sending a new message"

### New Message (`/admin/messages/new`)
- Select tenant from dropdown
- Subject line and message body
- Send message

---

## 8. Settings

**URL:** `/admin/settings`

### Profile Section
- First name, Last name, Email, Phone
- Company name, Business number
- **Edit Profile button** — Opens inline edit form

### Subscription & Plan
- Current plan name and badge (FREE)
- Per-unit price, property limit, card surcharge %
- **Properties Used** — Visual progress bar (e.g., 1/1)
- **Plan Features checklist:**
  - Tenant Portal, e-Transfer Tracking, AB Lease Template, Document Storage
  - Maintenance Requests, Rent Reminders, Late Fee Tracking, Inspections
  - Inventory Tracking, Card Payments, Digital Lease Signing
- **Change Plan button**

### Stripe Connect
- Explanation of Stripe Destination Charges model
- **Connect Stripe button** — Redirects to Stripe Connect onboarding
- Shows connected status when Stripe account is linked
- Required for accepting card payments from tenants

### Notification Preferences
- **Email Notifications** toggle — Receive updates via email

---

## 9. Tenant Portal (9 pages)

> The tenant portal is only accessible to users with tenant accounts. Landlord accounts are correctly redirected to the admin dashboard.

### Available Pages:
1. **Tenant Dashboard** (`/tenant/dashboard`) — Property overview, lease info, upcoming payments
2. **Payments** (`/tenant/payments`) — Payment history, Pay Now with multiple methods:
   - **E-Transfer** — Record pending payment for landlord confirmation
   - **Credit Card** — Redirects to Stripe Checkout (surcharge applied)
   - **Cheque / Cash** — Record pending payment
3. **Maintenance** (`/tenant/maintenance`) — View and track maintenance requests
4. **New Maintenance Request** (`/tenant/maintenance/new`) — Submit new request with photos
5. **Maintenance Detail** (`/tenant/maintenance/[id]`) — View request status and updates
6. **Messages** (`/tenant/messages`) — Message threads with landlord
7. **New Message** (`/tenant/messages/new`) — Compose message to landlord
8. **Documents** (`/tenant/documents`) — View shared documents
9. **Profile** (`/tenant/profile`) — Edit personal information

---

## 10. Additional Features

### Stripe Payment Integration
- **Stripe Connect** (Standard accounts) — Landlords connect their Stripe account
- **Stripe Checkout** — Tenants pay rent via credit card with surcharge
- **Destination Charges** — Funds go directly to landlord's Stripe account
- **Platform Fee** — 1% platform fee on card payments
- **Webhook Processing** — Automatic payment confirmation, failure handling, subscription management

### Notifications System
- Automatic notifications for:
  - Payment confirmations
  - Maintenance request updates
  - New messages
  - Lease events
- In-app notification bell in top bar

### Export & Reporting
- **CSV Export** — Export tenant lists and payment history
- **Revenue by Property** — Per-property financial breakdown
- **Rent Collection Tracker** — Monthly collection progress

### Security & Access Control
- **Role-based routing** — Landlords and tenants see different portals
- **Middleware guards** — Prevents cross-role access
- **Supabase RLS** — Row-level security on all database tables
- **Webhook signature verification** — Stripe webhook security

### Design System ("Editorial Estate")
- **Fonts:** Manrope (headings) + Inter (body)
- **No-border rule** — Clean, modern card design with ambient shadows
- **Rounded corners** — rounded-xl inputs, rounded-3xl cards
- **MD3 color tokens** — Consistent dark navy/gold theme
- **Responsive layout** — Sidebar navigation with collapsible mobile view

---

## Navigation Structure

### Admin Sidebar
1. Dashboard
2. Properties
3. Tenants
4. Financials
5. Maintenance
6. Documents
7. Messages
8. Settings

### Bottom Bar
- Plan badge (FREE PLAN)
- Add Property quick action

### Top Bar
- Notification bell
- User avatar with dropdown

---

*Generated by TenantPorch testing suite — All features verified as functional on the Free plan.*
