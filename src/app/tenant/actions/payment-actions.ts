"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function submitTenantPayment(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Look up rp_users record
    const { data: rpUser, error: rpUserError } = await supabase
      .from("rp_users")
      .select("id, role")
      .eq("auth_id", user.id)
      .single();

    if (rpUserError || !rpUser) {
      return { success: false, error: "User profile not found" };
    }

    if (rpUser.role !== "tenant" && rpUser.role !== "occupant") {
      return { success: false, error: "Only tenants can submit payments" };
    }

    // Extract form fields
    const leaseId = formData.get("lease_id") as string;
    const amount = parseFloat(formData.get("amount") as string) || 0;
    const paymentMethod = formData.get("payment_method") as string;
    const notes = formData.get("notes") as string;

    if (!leaseId || !amount) {
      return { success: false, error: "Lease ID and amount are required" };
    }

    const validMethods = ["etransfer", "cash", "cheque", "pad", "credit_card", "other"];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return { success: false, error: "A valid payment method is required" };
    }

    // Verify tenant is linked to this lease and the lease is active
    const { data: leaseLink, error: leaseLinkError } = await supabase
      .from("rp_lease_tenants")
      .select("lease_id, rp_leases!inner(id, property_id, status, currency_code)")
      .eq("user_id", rpUser.id)
      .eq("lease_id", leaseId)
      .in("rp_leases.status", ["active", "draft"])
      .single();

    if (leaseLinkError || !leaseLink) {
      return { success: false, error: "No active lease found matching this ID" };
    }

    const leaseData = leaseLink.rp_leases as any;
    const currencyCode = leaseData?.currency_code ?? "CAD";

    // Current month in YYYY-MM-01 format for payment_for_month
    const now = new Date();
    const paymentForMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Insert payment with status "pending" — landlord confirms later
    const { data: payment, error: insertError } = await supabase
      .from("rp_payments")
      .insert({
        lease_id: leaseId,
        tenant_id: rpUser.id,
        amount,
        total_charged: amount,
        payment_method: paymentMethod,
        payment_type: "rent",
        paid_date: now.toISOString().split("T")[0],
        payment_for_month: paymentForMonth,
        status: "pending",
        currency_code: currencyCode,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Notify landlord about the pending payment
    const propertyId = leaseData?.property_id;
    if (propertyId) {
      const { data: property } = await supabase
        .from("rp_properties")
        .select("landlord_id")
        .eq("id", propertyId)
        .single();

      if (property?.landlord_id) {
        await createNotification(supabase, {
          userId: property.landlord_id,
          title: "Payment Submitted",
          body: `A tenant has submitted a $${amount.toFixed(2)} ${paymentMethod} payment pending your confirmation.`,
          type: "payment",
          urgency: "normal",
        });
      }
    }

    revalidatePath("/tenant/payments");
    revalidatePath("/admin/financials");
    revalidatePath("/admin/dashboard");

    return { success: true, paymentId: payment.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
