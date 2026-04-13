"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { sendUtilityBillEmail } from "@/lib/email";
import { getUtilityLabel } from "@/lib/utility-types";

function formatCurrencySimple(amount: number, currency = "CAD") {
  return `${currency} ${amount.toFixed(2)}`;
}

function formatDateSimple(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getTenants(supabase: Awaited<ReturnType<typeof createClient>>, leaseId: string) {
  const { data: leaseTenants } = await supabase
    .from("rp_lease_tenants")
    .select("rp_users!inner(id, first_name, last_name, email)")
    .eq("lease_id", leaseId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (leaseTenants ?? []).map((lt: any) => lt.rp_users as any);
}

async function getLandlordProfile(supabase: Awaited<ReturnType<typeof createClient>>, rpUserId: string) {
  const { data: profile } = await supabase
    .from("rp_landlord_profiles")
    .select("id")
    .eq("user_id", rpUserId)
    .single();
  return profile;
}

// ─── Create a utility bill ─────────────────────────────────────────────────

export async function createUtilityBill(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name, email")
      .eq("auth_id", user.id)
      .single();
    if (!rpUser) return { success: false, error: "User profile not found" };

    const leaseId = formData.get("lease_id") as string;
    const propertyId = formData.get("property_id") as string;
    const utilityType = formData.get("utility_type") as string;
    const billingPeriod = formData.get("billing_period") as string;
    const totalAmount = parseFloat(formData.get("total_amount") as string);
    const splitPercent = parseInt(formData.get("split_percent") as string, 10);
    const dueDate = formData.get("due_date") as string | null;
    const notes = formData.get("notes") as string | null;
    const currencyCode = (formData.get("currency_code") as string) || "CAD";
    const sendNow = formData.get("send_now") === "true";

    if (!leaseId || !propertyId || !utilityType || isNaN(totalAmount)) {
      return { success: false, error: "Required fields missing" };
    }

    // Verify property ownership
    const { data: property } = await supabase
      .from("rp_properties")
      .select("id, landlord_id")
      .eq("id", propertyId)
      .eq("landlord_id", rpUser.id)
      .single();
    if (!property) return { success: false, error: "Property not found or access denied" };

    const tenantAmount = parseFloat(((totalAmount * splitPercent) / 100).toFixed(2));
    const landlordAmount = parseFloat((totalAmount - tenantAmount).toFixed(2));

    // Upload bill files
    const fileUrls: { url: string; name: string; size: number }[] = [];
    const files = formData.getAll("files") as File[];
    for (const file of files) {
      if (!file || file.size === 0) continue;
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `utility-bills/${propertyId}/${timestamp}_${safeName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) continue;
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(uploadData.path);
      fileUrls.push({ url: urlData.publicUrl, name: file.name, size: file.size });
    }

    // Insert utility bill
    const { data: bill, error: insertError } = await supabase
      .from("rp_utility_bills")
      .insert({
        lease_id: leaseId,
        property_id: propertyId,
        billing_period: billingPeriod || null,
        utility_type: utilityType,
        total_amount: totalAmount,
        currency_code: currencyCode,
        split_percent: splitPercent,
        tenant_amount: tenantAmount,
        landlord_amount: landlordAmount,
        due_date: dueDate || null,
        status: sendNow ? "sent" : "draft",
        sent_at: sendNow ? new Date().toISOString() : null,
        file_urls: fileUrls,
        notes: notes || null,
        created_by: rpUser.id,
      })
      .select("id")
      .single();

    if (insertError || !bill) {
      return { success: false, error: insertError?.message ?? "Failed to create bill" };
    }

    if (sendNow) {
      await _sendBillToTenants(supabase, bill.id, rpUser, false);
    }

    revalidatePath("/admin/utilities");
    return { success: true, billId: bill.id };
  } catch (err) {
    console.error("createUtilityBill error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ─── Send a bill to tenants ────────────────────────────────────────────────

export async function sendUtilityBillToTenant(billId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name, email")
      .eq("auth_id", user.id)
      .single();
    if (!rpUser) return { success: false, error: "User profile not found" };

    // Verify ownership
    const { data: bill } = await supabase
      .from("rp_utility_bills")
      .select("id, lease_id, property_id, status")
      .eq("id", billId)
      .single();
    if (!bill) return { success: false, error: "Bill not found" };

    const { data: prop } = await supabase
      .from("rp_properties")
      .select("landlord_id")
      .eq("id", bill.property_id)
      .single();
    if ((prop as any)?.landlord_id !== rpUser.id) return { success: false, error: "Access denied" };

    if (bill.status === "paid" || bill.status === "cancelled") {
      return { success: false, error: "Cannot send a paid or cancelled bill" };
    }

    // Update status
    await supabase
      .from("rp_utility_bills")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", billId);

    await _sendBillToTenants(supabase, billId, rpUser, false);

    revalidatePath("/admin/utilities");
    revalidatePath(`/admin/utilities/${billId}`);
    return { success: true };
  } catch (err) {
    console.error("sendUtilityBillToTenant error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ─── Send reminder ─────────────────────────────────────────────────────────

export async function sendUtilityReminder(billId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name, email")
      .eq("auth_id", user.id)
      .single();
    if (!rpUser) return { success: false, error: "User profile not found" };

    const { data: bill } = await supabase
      .from("rp_utility_bills")
      .select("id, lease_id, property_id, status, due_date")
      .eq("id", billId)
      .single();
    if (!bill) return { success: false, error: "Bill not found" };

    const { data: prop } = await supabase
      .from("rp_properties")
      .select("landlord_id")
      .eq("id", bill.property_id)
      .single();
    if ((prop as any)?.landlord_id !== rpUser.id) return { success: false, error: "Access denied" };

    const now = new Date();
    const isOverdue = bill.due_date && new Date(bill.due_date) < now;

    await supabase
      .from("rp_utility_bills")
      .update({
        reminder_sent_at: now.toISOString(),
        status: isOverdue ? "overdue" : bill.status,
      })
      .eq("id", billId);

    await _sendBillToTenants(supabase, billId, rpUser, true);

    revalidatePath("/admin/utilities");
    revalidatePath(`/admin/utilities/${billId}`);
    return { success: true };
  } catch (err) {
    console.error("sendUtilityReminder error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ─── Record payment ────────────────────────────────────────────────────────

export async function recordUtilityPayment(billId: string, formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!rpUser) return { success: false, error: "User profile not found" };

    const { data: bill } = await supabase
      .from("rp_utility_bills")
      .select("id, property_id, lease_id, tenant_amount, currency_code, utility_type, billing_period")
      .eq("id", billId)
      .single();
    if (!bill) return { success: false, error: "Bill not found" };

    const { data: prop } = await supabase
      .from("rp_properties")
      .select("landlord_id")
      .eq("id", bill.property_id)
      .single();
    if ((prop as any)?.landlord_id !== rpUser.id) return { success: false, error: "Access denied" };

    const paymentMethod = formData.get("payment_method") as string;
    const etransferReference = formData.get("etransfer_reference") as string | null;
    const paidDate = (formData.get("paid_date") as string) || new Date().toISOString().split("T")[0];

    await supabase
      .from("rp_utility_bills")
      .update({
        status: "paid",
        payment_method: paymentMethod,
        paid_at: new Date(paidDate + "T12:00:00").toISOString(),
        paid_by: rpUser.id,
        etransfer_reference: etransferReference || null,
      })
      .eq("id", billId);

    // Also record in rp_payments for financial tracking
    const { data: leaseTenants } = await supabase
      .from("rp_lease_tenants")
      .select("tenant_id")
      .eq("lease_id", bill.lease_id);
    const tenantId = leaseTenants?.[0]?.tenant_id ?? null;

    await supabase.from("rp_payments").insert({
      lease_id: bill.lease_id,
      tenant_id: tenantId,
      amount: Number(bill.tenant_amount),
      total_charged: Number(bill.tenant_amount),
      payment_method: paymentMethod as string,
      payment_type: "utilities",
      paid_date: paidDate,
      status: "confirmed",
      currency_code: bill.currency_code,
      notes: `Utility bill: ${getUtilityLabel(bill.utility_type)}${bill.billing_period ? ` (${bill.billing_period})` : ""}`,
    });

    // Notify tenants
    const tenants = await getTenants(supabase, bill.lease_id);
    for (const tenant of tenants) {
      await createNotification(supabase, {
        userId: tenant.id,
        title: "Utility Payment Confirmed",
        body: `Your ${getUtilityLabel(bill.utility_type)} utility payment has been recorded.`,
        type: "payment",
      });
    }

    revalidatePath("/admin/utilities");
    revalidatePath(`/admin/utilities/${billId}`);
    revalidatePath("/admin/financials");
    return { success: true };
  } catch (err) {
    console.error("recordUtilityPayment error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ─── Cancel a bill ─────────────────────────────────────────────────────────

export async function cancelUtilityBill(billId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!rpUser) return { success: false, error: "User profile not found" };

    const { data: bill } = await supabase
      .from("rp_utility_bills")
      .select("id, property_id, status")
      .eq("id", billId)
      .single();
    if (!bill) return { success: false, error: "Bill not found" };

    const { data: prop } = await supabase
      .from("rp_properties")
      .select("landlord_id")
      .eq("id", bill.property_id)
      .single();
    if ((prop as any)?.landlord_id !== rpUser.id) return { success: false, error: "Access denied" };

    if (bill.status === "paid") return { success: false, error: "Cannot cancel a paid bill" };

    await supabase.from("rp_utility_bills").update({ status: "cancelled" }).eq("id", billId);

    revalidatePath("/admin/utilities");
    revalidatePath(`/admin/utilities/${billId}`);
    return { success: true };
  } catch (err) {
    console.error("cancelUtilityBill error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ─── Internal: send bill emails + notifications to all tenants ─────────────

async function _sendBillToTenants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  billId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpUser: any,
  isReminder: boolean
) {
  const { data: bill } = await supabase
    .from("rp_utility_bills")
    .select(
      "id, lease_id, property_id, utility_type, billing_period, total_amount, tenant_amount, due_date, currency_code"
    )
    .eq("id", billId)
    .single();
  if (!bill) return;

  const { data: property } = await supabase
    .from("rp_properties")
    .select("address_line1, city, province_state")
    .eq("id", bill.property_id)
    .single();

  const propertyAddress = property
    ? `${property.address_line1}, ${property.city}`
    : "your property";

  const tenants = await getTenants(supabase, bill.lease_id);
  const utilityLabel = getUtilityLabel(bill.utility_type);
  const currency = bill.currency_code ?? "CAD";
  const dueDateStr = bill.due_date ? formatDateSimple(bill.due_date) : "Upon receipt";

  // Fetch landlord's e-transfer email from their profile
  const landlordProfile = await getLandlordProfile(supabase, rpUser.id);
  let etransferEmail: string | undefined;
  if (landlordProfile) {
    const { data: profileDetail } = await supabase
      .from("rp_landlord_profiles")
      .select("etransfer_email")
      .eq("id", landlordProfile.id)
      .single();
    etransferEmail = (profileDetail as any)?.etransfer_email ?? rpUser.email;
  } else {
    etransferEmail = rpUser.email;
  }

  for (const tenant of tenants) {
    // In-app notification
    await createNotification(supabase, {
      userId: tenant.id,
      title: isReminder ? `Reminder: ${utilityLabel} Bill Due` : `${utilityLabel} Utility Bill`,
      body: `Your share: ${formatCurrencySimple(Number(bill.tenant_amount), currency)} — Due ${dueDateStr}`,
      type: "payment",
      urgency: isReminder ? "high" : "normal",
    });

    // Email
    try {
      await sendUtilityBillEmail({
        to: tenant.email,
        firstName: tenant.first_name,
        landlordName: `${rpUser.first_name} ${rpUser.last_name}`,
        landlordEmail: rpUser.email,
        propertyAddress,
        utilityType: utilityLabel,
        billingPeriod: bill.billing_period ?? "",
        totalAmount: formatCurrencySimple(Number(bill.total_amount), currency),
        tenantAmount: formatCurrencySimple(Number(bill.tenant_amount), currency),
        dueDate: dueDateStr,
        isReminder,
        etransferEmail,
      });
    } catch (emailErr) {
      console.error("Failed to send utility email to tenant:", emailErr);
    }
  }
}

// ─── Internal cron helper: process overdue bills (called by cron route) ────

export async function processOverdueUtilityBills() {
  try {
    const supabase = await createClient();

    // Find bills past due 7 days, still 'sent', no reminder yet
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const { data: bills } = await supabase
      .from("rp_utility_bills")
      .select(
        "id, lease_id, property_id, utility_type, billing_period, total_amount, tenant_amount, due_date, currency_code, rp_properties!inner(landlord_id, rp_users!rp_properties_landlord_id_fkey(id, first_name, last_name, email))"
      )
      .eq("status", "sent")
      .is("reminder_sent_at", null)
      .lt("due_date", cutoff.toISOString().split("T")[0]);

    if (!bills || bills.length === 0) return { processed: 0 };

    for (const bill of bills) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const landlordUser = (bill.rp_properties as any)?.rp_users;
      if (!landlordUser) continue;

      // Mark overdue + set reminder timestamp
      await supabase
        .from("rp_utility_bills")
        .update({
          status: "overdue",
          reminder_sent_at: new Date().toISOString(),
        })
        .eq("id", bill.id);

      // Send reminder emails/notifications
      await _sendBillToTenants(supabase, bill.id, landlordUser, true);
    }

    return { processed: bills.length };
  } catch (err) {
    console.error("processOverdueUtilityBills error:", err);
    return { processed: 0, error: String(err) };
  }
}
