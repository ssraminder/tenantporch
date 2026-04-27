import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { InventoryClient } from "@/components/forms/inventory-client";

export default async function PropertyInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = await params;
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

  const { data: property } = await supabase
    .from("rp_properties")
    .select("id, landlord_id, address_line1, city")
    .eq("id", propertyId)
    .single();
  if (!property || property.landlord_id !== rpUser.id) notFound();

  const { data: items } = await supabase
    .from("rp_inventory_items")
    .select(
      "id, item_name, quantity, room, year_of_purchase, estimated_value, currency_code, condition_at_movein, photo_url, notes, created_at, updated_at"
    )
    .eq("property_id", propertyId)
    .order("room", { nullsFirst: false })
    .order("item_name");

  return (
    <section className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
          { label: "Properties", href: "/admin/properties", icon: "apartment" },
          {
            label: property.address_line1,
            href: `/admin/properties/${propertyId}`,
          },
          { label: "Furnished Inventory" },
        ]}
      />

      <div>
        <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
          Furnished Inventory
        </h1>
        <p className="text-sm text-on-surface-variant font-medium mt-1">
          Track every furnished item at {property.address_line1}, {property.city} —
          name, room, quantity, year of purchase, and approximate cost.
        </p>
      </div>

      <InventoryClient propertyId={propertyId} initialItems={items ?? []} />
    </section>
  );
}
