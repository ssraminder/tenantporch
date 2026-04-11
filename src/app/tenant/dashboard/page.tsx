import { createClient } from "@/lib/supabase/server";

export default async function TenantDashboard() {
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
      <div className="relative overflow-hidden rounded-3xl bg-primary text-white p-10 flex flex-col justify-end min-h-[240px] md:min-h-[320px] shadow-ambient-lg">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-secondary-fixed/20 text-secondary-fixed rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            Current Residence
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline mb-2">
            Welcome home, {rpUser?.first_name ?? "Tenant"}
          </h2>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "history", title: "Payment History", desc: "Review past transactions" },
          { icon: "handyman", title: "Maintenance", desc: "Request repairs" },
          { icon: "gavel", title: "Digital Lease", desc: "View terms and docs" },
          { icon: "chat", title: "Contact Owner", desc: "Message your landlord" },
        ].map((action) => (
          <div
            key={action.title}
            className="bg-surface-container-low p-6 rounded-2xl hover:bg-surface-container-high transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center mb-4 shadow-ambient-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary">
                {action.icon}
              </span>
            </div>
            <h4 className="font-bold text-primary">{action.title}</h4>
            <p className="text-xs text-on-surface-variant mt-1">{action.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
