import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { LeaseTemplateEditor } from "@/components/forms/lease-template-editor";
import type { LandlordTemplateDocument } from "@/lib/lease-templates/template-renderer";

export default async function EditLeaseTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: templateId } = await params;

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

  const { data: template } = await supabase
    .from("rp_lease_templates")
    .select(
      "id, landlord_id, name, description, province_code, country_code, version, is_active, defaults, documents"
    )
    .eq("id", templateId)
    .single();

  if (!template) notFound();
  // Read-only check: system templates (landlord_id null) or someone else's.
  const isOwner = template.landlord_id === rpUser.id;

  return (
    <section className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Lease Templates", href: "/admin/lease-templates" },
          { label: template.name },
        ]}
      />

      <LeaseTemplateEditor
        templateId={template.id}
        initialName={template.name}
        initialDescription={template.description ?? ""}
        provinceCode={template.province_code}
        documents={(template.documents ?? []) as LandlordTemplateDocument[]}
        defaults={template.defaults ?? {}}
        readOnly={!isOwner}
      />
    </section>
  );
}
