import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If an explicit next path was requested (e.g. /reset-password), honour it
      if (next && next !== "/") {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise redirect based on user role
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: rpUser } = await supabase
          .from("rp_users")
          .select("role")
          .eq("auth_id", user.id)
          .single();

        if (rpUser?.role === "landlord") {
          return NextResponse.redirect(`${origin}/admin/dashboard`);
        }
        return NextResponse.redirect(`${origin}/tenant/dashboard`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
