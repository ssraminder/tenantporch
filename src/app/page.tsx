import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (rpUser?.role === "landlord") redirect("/admin/dashboard");
    if (rpUser) redirect("/tenant/dashboard");
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-xl">
        <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-primary italic mb-4">
          TenantPorch
        </h1>
        <p className="text-on-surface-variant text-lg mb-8">
          Your front porch to smarter renting. Canadian rental property
          management made simple.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-xl hover:bg-secondary-fixed-dim transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
