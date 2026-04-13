-- Migration: Add SELECT policy for rp_users table
-- Allows authenticated users to read their own profile
-- This fixes the redirect loop where layouts query rp_users with .eq("auth_id", user.id)

CREATE POLICY "Users can read own profile"
  ON public.rp_users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());
