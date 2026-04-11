import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("first_name")
    .eq("auth_id", user!.id)
    .single();

  return (
    <section className="space-y-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-primary text-white p-10 flex flex-col justify-end min-h-[200px] shadow-ambient-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/30 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-headline mb-2">
            Welcome back, {rpUser?.first_name ?? "Landlord"}
          </h2>
          <p className="text-inverse-primary/80 text-lg">
            Here&apos;s your property overview.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Properties", value: "0", icon: "domain" },
          { label: "Active Leases", value: "0", icon: "gavel" },
          { label: "Collected", value: "$0", icon: "payments" },
          { label: "Open Requests", value: "0", icon: "handyman" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="material-symbols-outlined text-on-surface-variant">
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-primary font-headline">
              {stat.value}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
