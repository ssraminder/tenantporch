// Usage: node scripts/reset-password.js
// Resets the password for ss.raminder+mike@gmail.com

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://scnmdbkpjlkitxdoeiaa.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbm1kYmtwamxraXR4ZG9laWFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA4MDIxOCwiZXhwIjoyMDgyNjU2MjE4fQ.6mGeJ8bguYGcgi6JAuIqT9Ph6jKTGZotk3SLgm2R9vY";

const EMAIL = "ss.raminder+mike@gmail.com";
const NEW_PASSWORD = "TenantPorch123!";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Find the user
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  const user = listData.users.find((u) => u.email === EMAIL);
  if (!user) {
    console.error(`User ${EMAIL} not found`);
    console.log("Available users:");
    listData.users.forEach((u) => console.log(`  - ${u.email}`));
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (ID: ${user.id})`);

  // Update the password
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: NEW_PASSWORD,
  });

  if (error) {
    console.error("Error updating password:", error.message);
    process.exit(1);
  }

  console.log(`Password for ${EMAIL} has been updated to: ${NEW_PASSWORD}`);
}

main().catch(console.error);
