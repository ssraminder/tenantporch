# Fix for ERR_TOO_MANY_REDIRECTS on Tenant Dashboard

## Problem
The tenant dashboard shows an ERR_TOO_MANY_REDIRECTS error due to a redirect loop in authentication. The root cause is:

1. Both the admin and tenant layouts query the `rp_users` table to fetch the user's profile
2. The `rp_users` table has Row-Level Security (RLS) enabled
3. However, there is no SELECT policy allowing authenticated users to read their own profile
4. This causes the REST API to return 406 errors when the layouts query `rp_users` with `.eq("auth_id", user.id)`
5. The query fails, the user's role cannot be determined, and the layout redirects to the other dashboard
6. Both dashboards redirect to each other, creating an infinite loop

## Solution
A new migration has been created: `supabase/migrations/20260413180000_add_rp_users_select_policy.sql`

This migration adds a SELECT policy that allows authenticated users to read their own profile:

```sql
CREATE POLICY "Users can read own profile"
  ON public.rp_users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());
```

## How to Apply the Migration

### Option 1: Use Supabase Dashboard (Recommended for this fix)
1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to the SQL Editor
3. Copy the SQL from `supabase/migrations/20260413180000_add_rp_users_select_policy.sql`
4. Paste it into the SQL editor and run it

### Option 2: Deploy via Migration System
When you deploy your application, the migration will be automatically applied if you have your Supabase project linked.

## Verification
After applying the migration, the tenant dashboard should load without redirect errors. The user's role will be correctly fetched from `rp_users`, and the appropriate layout (admin or tenant) will render.
