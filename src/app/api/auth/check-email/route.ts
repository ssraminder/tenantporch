import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      console.error("Check email error:", error);
      return NextResponse.json({ exists: false });
    }

    // Filter by email since listUsers doesn't support email filter directly
    // Use a more efficient approach: try to get user by email
    const { data: users } = await supabase
      .from("rp_users")
      .select("id")
      .eq("email", email.toLowerCase())
      .limit(1);

    return NextResponse.json({ exists: (users?.length ?? 0) > 0 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
