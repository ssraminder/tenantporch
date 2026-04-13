#!/usr/bin/env node

/**
 * Fix RLS Policy for rp_users Table
 *
 * This script applies the missing SELECT RLS policy for the rp_users table.
 * The policy allows authenticated users to read their own profile.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/fix-rls-policy.mjs
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL environment variable is required");
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  console.error(
    "\nYou can get this from your Supabase dashboard:\n" +
    "1. Go to Project Settings > API\n" +
    "2. Copy the Service Role Key (anon key won't work)\n" +
    "3. Run: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/fix-rls-policy.mjs"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
CREATE POLICY "Users can read own profile"
  ON public.rp_users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());
`;

async function runMigration() {
  try {
    console.log("Applying RLS policy to rp_users table...");

    const { error } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (error) {
      // If exec_sql doesn't exist, try another approach
      if (error.message?.includes("function exec_sql")) {
        console.log(
          "⚠️  Server RPC not available. Please apply the migration manually:"
        );
        console.log("\n1. Go to https://app.supabase.com");
        console.log("2. Open the SQL Editor");
        console.log("3. Copy and paste this SQL:\n");
        console.log(migrationSQL);
        console.log(
          "\n4. Click 'Execute' button\n"
        );
        process.exit(1);
      }

      console.error("Migration error:", error);
      process.exit(1);
    }

    console.log("✓ Migration applied successfully!");
    console.log(
      "  The rp_users table now has a SELECT policy for authenticated users."
    );
    console.log(
      "  The redirect loop issue should be resolved. Try accessing the dashboard again."
    );
  } catch (error) {
    console.error("Failed to apply migration:", error);
    process.exit(1);
  }
}

runMigration();
