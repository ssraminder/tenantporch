import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ["/", "/login", "/signup", "/auth/callback", "/auth/confirm", "/invite"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    // Fetch user role to redirect appropriately
    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    const url = request.nextUrl.clone();
    if (rpUser?.role === "landlord") {
      url.pathname = "/admin/dashboard";
    } else {
      url.pathname = "/tenant/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  if (user && (pathname.startsWith("/tenant") || pathname.startsWith("/admin"))) {
    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (rpUser) {
      if (pathname.startsWith("/admin") && rpUser.role !== "landlord") {
        const url = request.nextUrl.clone();
        url.pathname = "/tenant/dashboard";
        return NextResponse.redirect(url);
      }
      if (pathname.startsWith("/tenant") && rpUser.role === "landlord") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
