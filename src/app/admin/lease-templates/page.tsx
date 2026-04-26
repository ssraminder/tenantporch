import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { LeaseTemplateListActions } from "@/components/forms/lease-template-list-actions";

export default async function LeaseTemplatesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!rpUser) redirect("/admin/dashboard");

  const { data: templates } = await supabase
    .from("rp_lease_templates")
    .select(
      "id, landlord_id, name, description, province_code, version, updated_at, created_at"
    )
    .or(`landlord_id.eq.${rpUser.id},landlord_id.is.null`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const myTemplates = (templates ?? []).filter(
    (t) => t.landlord_id === rpUser.id
  );
  const systemTemplates = (templates ?? []).filter(
    (t) => t.landlord_id === null
  );

  return (
    <section className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Lease Templates" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Lease Templates
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Reusable lease packages — pick one when creating a new lease, edit per-tenant, send for signing.
          </p>
        </div>
        <Link
          href="/admin/lease-templates/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Template
        </Link>
      </div>

      {/* My templates */}
      <div className="space-y-4">
        <h2 className="text-lg font-headline font-bold text-primary">
          Your Templates
        </h2>
        {myTemplates.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-3 block">
              description
            </span>
            <p className="text-sm text-on-surface-variant">
              You haven&apos;t saved any lease templates yet. Create one above, or save an existing lease as a template from the lease document page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTemplates.map((t) => (
              <article
                key={t.id}
                className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline text-base font-bold text-primary truncate">
                      {t.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {t.province_code} · v{t.version}
                    </p>
                  </div>
                </div>
                {t.description && (
                  <p className="text-sm text-on-surface-variant line-clamp-3">
                    {t.description}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap mt-auto">
                  <Link
                    href={`/admin/lease-templates/${t.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/15 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit
                  </Link>
                  <LeaseTemplateListActions templateId={t.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {systemTemplates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-headline font-bold text-primary">
            System Templates (Read-Only)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemTemplates.map((t) => (
              <article
                key={t.id}
                className="bg-surface-container-low rounded-3xl p-6 flex flex-col gap-2 border border-outline-variant/15"
              >
                <h3 className="font-headline text-base font-bold text-primary">
                  {t.name}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {t.province_code} · v{t.version}
                </p>
                {t.description && (
                  <p className="text-sm text-on-surface-variant line-clamp-3 mt-1">
                    {t.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
