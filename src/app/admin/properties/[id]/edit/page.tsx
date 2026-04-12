import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PropertyForm from "@/components/forms/property-form";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!rpUser) notFound();

  const { data: property } = await supabase
    .from("rp_properties")
    .select(
      "id, landlord_id, address_line1, address_line2, city, province_state, postal_code, unit_description, sticker_number, has_separate_entrance, has_separate_mailbox, is_furnished, storage_included, yard_access, monthly_rent, pet_deposit, parking_type, parking_spots, laundry_type, heating_type, cooling_type, wifi_ssid, wifi_password"
    )
    .eq("id", id)
    .single();

  if (!property || property.landlord_id !== rpUser.id) notFound();

  return (
    <PropertyForm
      mode="edit"
      propertyId={id}
      breadcrumbAddress={property.address_line1}
      property={{
        address_line1: property.address_line1,
        address_line2: property.address_line2 ?? undefined,
        city: property.city,
        province_state: property.province_state,
        postal_code: property.postal_code,
        unit_description: property.unit_description ?? undefined,
        sticker_number: property.sticker_number ?? undefined,
        has_separate_entrance: property.has_separate_entrance,
        has_separate_mailbox: property.has_separate_mailbox,
        is_furnished: property.is_furnished,
        storage_included: property.storage_included,
        yard_access: property.yard_access,
        monthly_rent: property.monthly_rent,
        pet_deposit: property.pet_deposit,
        parking_type: property.parking_type ?? undefined,
        parking_spots: property.parking_spots,
        laundry_type: property.laundry_type ?? undefined,
        heating_type: property.heating_type ?? undefined,
        cooling_type: property.cooling_type ?? undefined,
        wifi_ssid: property.wifi_ssid ?? undefined,
        wifi_password: property.wifi_password ?? undefined,
      }}
    />
  );
}
