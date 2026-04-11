import { createClient } from "@/lib/supabase/server";
import { DateDisplay } from "@/components/shared/date-display";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("*")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // Get lease info — include active and draft (upcoming) leases
  const { data: leaseLinks } = await supabase
    .from("rp_lease_tenants")
    .select("lease_id, rp_leases!inner(id, status)")
    .eq("user_id", rpUser.id)
    .in("rp_leases.status", ["active", "draft"]);

  const sortedLinks = (leaseLinks ?? []).sort((a, b) => {
    const aStatus = (a as any).rp_leases?.status ?? "";
    const bStatus = (b as any).rp_leases?.status ?? "";
    if (aStatus === "active" && bStatus !== "active") return -1;
    if (bStatus === "active" && aStatus !== "active") return 1;
    return 0;
  });
  const leaseLink = sortedLinks[0] ?? null;

  let lease = null;
  let property = null;

  if (leaseLink) {
    const { data: leaseData } = await supabase
      .from("rp_leases")
      .select("start_date, end_date, monthly_rent, currency_code, property_id")
      .eq("id", leaseLink.lease_id)
      .single();
    lease = leaseData;

    if (lease) {
      const { data: propData } = await supabase
        .from("rp_properties")
        .select("address_line1, city, province_state, postal_code")
        .eq("id", lease.property_id)
        .single();
      property = propData;
    }
  }

  return (
    <section className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
        Profile Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Personal Info Card (read-only) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-ambient flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-xl bg-primary flex items-center justify-center shadow-lg text-3xl font-black text-white">
                {rpUser.first_name?.[0]}
                {rpUser.last_name?.[0]}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-secondary p-2 rounded-lg text-white shadow-lg">
                <span className="material-symbols-outlined text-base">verified</span>
              </div>
            </div>

            <h3 className="font-headline text-2xl font-bold text-primary">
              {rpUser.first_name} {rpUser.last_name}
            </h3>
            <p className="text-on-surface-variant font-medium text-sm mt-1 capitalize">
              {rpUser.role} since{" "}
              <DateDisplay date={rpUser.created_at} format="short" />
            </p>

            <div className="mt-8 w-full space-y-4 text-left">
              {property && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                    Current Residence
                  </span>
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-primary-container">
                      apartment
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {property.address_line1}, {property.city}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                  Email Address
                </span>
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary-container">
                    mail
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {rpUser.email}
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                  Phone
                </span>
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary-container">
                    phone
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {rpUser.phone ?? "Not set"}
                  </span>
                </div>
              </div>

              {lease && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                    Lease Term
                  </span>
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-primary-container">
                      event
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      <DateDisplay date={lease.start_date} format="short" /> -{" "}
                      <DateDisplay date={lease.end_date} format="short" />
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-tertiary/5 border-l-4 border-tertiary p-4 mt-4">
                <p className="text-xs font-semibold text-tertiary-container flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    verified_user
                  </span>
                  Compliance: AB (Alberta Standard)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Editable sections */}
        <div className="md:col-span-8 flex flex-col gap-8">
          <ProfileForm />
        </div>
      </div>
    </section>
  );
}
