"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function recordPayment(formData: FormData) {
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
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (rpUserError || !rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Extract form fields
    const leaseId = formData.get("lease_id") as string;
    let tenantId = (formData.get("tenant_id") as string) || "";
    const amount = parseFloat(formData.get("amount") as string) || 0;
    const paymentMethod = formData.get("payment_method") as string;
    const paymentType = (formData.get("payment_type") as string) || "rent";
    const paidDate = formData.get("paid_date") as string;
    const paymentForMonth = formData.get("payment_for_month") as string;
    const status = (formData.get("status") as string) || "confirmed";
    const currencyCode = (formData.get("currency_code") as string) || "CAD";
    const notes = formData.get("notes") as string;

    if (!leaseId || !amount) {
      return { success: false, error: "Lease ID and amount are required" };
    }

    // Verify lease belongs to landlord's property
    const { data: lease, error: leaseError } = await supabase
      .from("rp_leases")
      .select("id, property_id, rp_properties(landlord_id)")
      .eq("id", leaseId)
      .single();

    if (leaseError || !lease) {
      return { success: false, error: "Lease not found" };
    }

    const landlordId = (lease.rp_properties as any)?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "You do not own the property associated with this lease" };
    }

    // Auto-fill tenant from lease when not specified and there's a single tenant
    if (!tenantId) {
      const { data: leaseTenants } = await supabase
        .from("rp_lease_tenants")
        .select("tenant_id")
        .eq("lease_id", leaseId);
      if (leaseTenants && leaseTenants.length === 1) {
        tenantId = leaseTenants[0].tenant_id;
      }
    }

    // Compute total_charged (no surcharge for manual recording)
    const totalCharged = amount;

    // Insert payment
    const { data: payment, error: insertError } = await supabase
      .from("rp_payments")
      .insert({
        lease_id: leaseId,
        tenant_id: tenantId || null,
        amount,
        total_charged: totalCharged,
        payment_method: paymentMethod || null,
        payment_type: paymentType,
        paid_date: paidDate || new Date().toISOString().split("T")[0],
        payment_for_month: paymentForMonth || null,
        status,
        currency_code: currencyCode,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath("/admin/financials");
    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${lease.property_id}`);
    revalidatePath("/admin/dashboard");

    // Notify tenant about the recorded payment
    if (tenantId) {
      await createNotification(supabase, {
        userId: tenantId,
        title: "Payment Recorded",
        body: `$${amount.toFixed(2)} payment has been recorded for your lease.`,
        type: "payment",
        urgency: "normal",
      });
    }

    return { success: true, paymentId: payment.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updatePaymentStatus(paymentId: string, status: string) {
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
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (rpUserError || !rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Validate status
    const validStatuses = ["confirmed", "pending", "failed", "refunded", "void"];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      };
    }

    // Verify payment belongs to landlord's lease/property
    const { data: payment, error: paymentError } = await supabase
      .from("rp_payments")
      .select("id, lease_id, tenant_id, rp_leases!inner(property_id, rp_properties!inner(landlord_id))")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return { success: false, error: "Payment not found" };
    }

    const landlordId = (payment.rp_leases as any)?.rp_properties?.landlord_id;
    if (landlordId !== rpUser.id) {
      return { success: false, error: "You do not own the property associated with this payment" };
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("rp_payments")
      .update({ status })
      .eq("id", paymentId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/financials");
    revalidatePath("/admin/properties");
    revalidatePath("/admin/dashboard");

    // Notify tenant about the status change
    const tenantId = (payment as any).tenant_id;
    if (tenantId) {
      await createNotification(supabase, {
        userId: tenantId,
        title: "Payment Status Updated",
        body: `Your payment status has been changed to ${status}.`,
        type: "payment",
        urgency: "normal",
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
