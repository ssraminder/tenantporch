"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function replyToMessage(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, full_name")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    const parentMessageId = formData.get("parent_message_id") as string;
    const body = formData.get("body") as string;

    if (!parentMessageId || !body?.trim()) {
      return { success: false, error: "Message body is required" };
    }

    // Verify the parent message exists and was sent TO this tenant
    const { data: parentMessage, error: parentError } = await supabase
      .from("rp_messages")
      .select("id, sender_id, recipient_id, property_id, subject")
      .eq("id", parentMessageId)
      .single();

    if (parentError || !parentMessage) {
      return { success: false, error: "Original message not found" };
    }

    // Tenant must be the recipient of the parent message OR the sender (for ongoing threads)
    if (
      parentMessage.recipient_id !== rpUser.id &&
      parentMessage.sender_id !== rpUser.id
    ) {
      return { success: false, error: "You do not have access to this message" };
    }

    // The reply goes to the other party
    const newRecipientId =
      parentMessage.sender_id === rpUser.id
        ? parentMessage.recipient_id
        : parentMessage.sender_id;

    // Build subject with RE: prefix
    const originalSubject = parentMessage.subject || "";
    const replySubject = originalSubject.startsWith("RE: ")
      ? originalSubject
      : `RE: ${originalSubject}`;

    const { error: insertError } = await supabase.from("rp_messages").insert({
      sender_id: rpUser.id,
      recipient_id: newRecipientId,
      property_id: parentMessage.property_id,
      subject: replySubject,
      body: body.trim(),
      is_read: false,
      is_formal_notice: false,
      parent_message_id: parentMessageId,
      delivery_method: "in_app",
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Notify the recipient of the reply
    const tenantName = (rpUser as any).full_name || "A tenant";
    const preview = body.trim().slice(0, 50);
    await createNotification(supabase, {
      userId: newRecipientId,
      title: `New Message from ${tenantName}`,
      body: preview,
      type: "message",
      urgency: "normal",
    });

    revalidatePath("/tenant/messages");
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function sendTenantMessage(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id, role, full_name")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    if (rpUser.role !== "tenant" && rpUser.role !== "occupant") {
      return { success: false, error: "Only tenants can use this action" };
    }

    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;

    if (!body?.trim()) {
      return { success: false, error: "Message body is required" };
    }

    // Find tenant's active lease to get property and landlord
    const { data: leaseLink, error: leaseLinkError } = await supabase
      .from("rp_lease_tenants")
      .select(
        "lease_id, rp_leases!inner(id, property_id, status, rp_properties!inner(id, landlord_id))"
      )
      .eq("user_id", rpUser.id)
      .in("rp_leases.status", ["active", "draft"])
      .limit(1)
      .single();

    if (leaseLinkError || !leaseLink) {
      return { success: false, error: "No active lease found for your account" };
    }

    const lease = leaseLink.rp_leases as any;
    const propertyId = lease?.property_id;
    const landlordId = lease?.rp_properties?.landlord_id;

    if (!propertyId || !landlordId) {
      return { success: false, error: "Could not determine your landlord" };
    }

    const { error: insertError } = await supabase.from("rp_messages").insert({
      sender_id: rpUser.id,
      recipient_id: landlordId,
      property_id: propertyId,
      subject: subject?.trim() || null,
      body: body.trim(),
      is_read: false,
      is_formal_notice: false,
      delivery_method: "in_app",
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Notify the landlord
    const tenantName = (rpUser as any).full_name || "A tenant";
    const preview = subject?.trim() || body.trim().slice(0, 50);
    await createNotification(supabase, {
      userId: landlordId,
      title: `New Message from ${tenantName}`,
      body: preview,
      type: "message",
      urgency: "normal",
    });

    revalidatePath("/tenant/messages");
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function markTenantMessageRead(messageId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: rpUser } = await supabase
      .from("rp_users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!rpUser) {
      return { success: false, error: "User profile not found" };
    }

    // Only mark as read if this user is the recipient
    const { error: updateError } = await supabase
      .from("rp_messages")
      .update({ is_read: true })
      .eq("id", messageId)
      .eq("recipient_id", rpUser.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/tenant/messages");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
