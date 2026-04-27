"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireLandlord() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false as const, error: "Not authenticated" };
  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!rpUser) return { ok: false as const, error: "User profile not found" };
  return { ok: true as const, supabase, rpUser };
}

async function ownsProperty(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rpUserId: string,
  propertyId: string
) {
  const { data: property } = await supabase
    .from("rp_properties")
    .select("landlord_id")
    .eq("id", propertyId)
    .single();
  return property?.landlord_id === rpUserId;
}

export async function listInventoryItems(propertyId: string) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  if (!(await ownsProperty(auth.supabase, auth.rpUser.id, propertyId))) {
    return { success: false as const, error: "Not authorized" };
  }

  const { data, error } = await auth.supabase
    .from("rp_inventory_items")
    .select(
      "id, item_name, quantity, room, year_of_purchase, estimated_value, currency_code, condition_at_movein, photo_url, notes, created_at, updated_at"
    )
    .eq("property_id", propertyId)
    .order("room", { nullsFirst: false })
    .order("item_name");

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, items: data ?? [] };
}

export async function upsertInventoryItem(formData: FormData) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const id = (formData.get("id") as string) || null;
  const propertyId = formData.get("property_id") as string;
  const itemName = ((formData.get("item_name") as string) ?? "").trim();
  const room = ((formData.get("room") as string) ?? "").trim() || null;
  const quantityRaw = formData.get("quantity") as string;
  const yearRaw = formData.get("year_of_purchase") as string;
  const valueRaw = formData.get("estimated_value") as string;
  const currency = ((formData.get("currency_code") as string) ?? "CAD").trim();
  const condition = ((formData.get("condition_at_movein") as string) ?? "").trim() || null;
  const notes = ((formData.get("notes") as string) ?? "").trim() || null;
  const photoUrl = ((formData.get("photo_url") as string) ?? "").trim() || null;

  if (!propertyId) return { success: false as const, error: "Property ID is required" };
  if (!itemName) return { success: false as const, error: "Item name is required" };
  if (!(await ownsProperty(auth.supabase, auth.rpUser.id, propertyId))) {
    return { success: false as const, error: "Not authorized" };
  }

  const quantity = quantityRaw ? Math.max(1, parseInt(quantityRaw, 10) || 1) : 1;
  const yearOfPurchase = yearRaw ? parseInt(yearRaw, 10) : null;
  if (yearOfPurchase != null && (yearOfPurchase < 1900 || yearOfPurchase > 2100)) {
    return { success: false as const, error: "Year of purchase must be between 1900 and 2100" };
  }
  const estimatedValue = valueRaw ? parseFloat(valueRaw) : null;
  if (estimatedValue != null && estimatedValue < 0) {
    return { success: false as const, error: "Approximate cost cannot be negative" };
  }

  const payload = {
    property_id: propertyId,
    item_name: itemName,
    quantity,
    room,
    year_of_purchase: yearOfPurchase,
    estimated_value: estimatedValue,
    currency_code: currency,
    condition_at_movein: condition,
    notes,
    photo_url: photoUrl,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await auth.supabase
      .from("rp_inventory_items")
      .update(payload)
      .eq("id", id)
      .eq("property_id", propertyId);
    if (error) return { success: false as const, error: error.message };
  } else {
    const { error } = await auth.supabase
      .from("rp_inventory_items")
      .insert(payload);
    if (error) return { success: false as const, error: error.message };
  }

  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath(`/admin/properties/${propertyId}/inventory`);
  return { success: true as const };
}

export async function deleteInventoryItem(itemId: string, propertyId: string) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  if (!(await ownsProperty(auth.supabase, auth.rpUser.id, propertyId))) {
    return { success: false as const, error: "Not authorized" };
  }

  const { error } = await auth.supabase
    .from("rp_inventory_items")
    .delete()
    .eq("id", itemId)
    .eq("property_id", propertyId);

  if (error) return { success: false as const, error: error.message };

  revalidatePath(`/admin/properties/${propertyId}/inventory`);
  return { success: true as const };
}

export async function getInventorySummary(propertyId: string) {
  const auth = await requireLandlord();
  if (!auth.ok) return { success: false as const, error: auth.error };

  if (!(await ownsProperty(auth.supabase, auth.rpUser.id, propertyId))) {
    return { success: false as const, error: "Not authorized" };
  }

  const { data } = await auth.supabase
    .from("rp_inventory_items")
    .select("estimated_value, quantity, currency_code")
    .eq("property_id", propertyId);

  const total = (data ?? []).reduce((sum, row) => {
    const v = Number(row.estimated_value ?? 0);
    const q = Number(row.quantity ?? 1);
    return sum + v * q;
  }, 0);

  return {
    success: true as const,
    count: data?.length ?? 0,
    totalValue: total,
    currency: data?.[0]?.currency_code ?? "CAD",
  };
}
