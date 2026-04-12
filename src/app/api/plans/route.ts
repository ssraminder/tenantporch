import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: plans, error } = await supabase
      .from("rp_plans")
      .select(
        "id, slug, name, base_price, included_properties, overage_rate, card_surcharge_percent, includes_all_addons, free_id_verifications_per_month"
      )
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Fetch plans error:", error);
      return NextResponse.json(
        { error: "Failed to fetch plans" },
        { status: 500 }
      );
    }

    const formatted = (plans ?? []).map((p) => ({
      ...p,
      base_price: Number(p.base_price),
      included_properties: Number(p.included_properties),
      overage_rate: Number(p.overage_rate),
      card_surcharge_percent: Number(p.card_surcharge_percent),
      free_id_verifications_per_month: Number(p.free_id_verifications_per_month),
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
