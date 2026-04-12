"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function sendMessage(formData: FormData) {
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

    const recipientId = formData.get("recipient_id") as string;
    const propertyId = formData.get("property_id") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const isFormalNotice = formData.get("is_formal_notice") === "true";
    const noticeType = formData.get("notice_type") as string;
    const deliveryMethod = (formData.get("delivery_method") as string) || "in_app";

    if (!recipientId || !body.trim()) {
      return { success: false, error: "Recipient and message body are required" };
    }

    // Verify recipient is a tenant on one of landlord's properties
    const { data: properties } = await supabase
      .from("rp_properties")
      .select("id")
      .eq("landlord_id", rpUser.id);

    const propertyIds = (properties ?? []).map((p) => p.id);

    if (propertyIds.length === 0) {
      return { success: false, error: "No properties found" };
    }

    const { error: insertError } = await supabase
      .from("rp_messages")
      .insert({
        property_id: propertyId || null,
        sender_id: rpUser.id,
        recipient_id: recipientId,
        subject: subject?.trim() || null,
        body: body.trim(),
        is_read: false,
        is_formal_notice: isFormalNotice,
        notice_type: isFormalNotice ? noticeType || null : null,
        delivery_method: deliveryMethod,
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Notify the recipient
    const preview = subject?.trim() || body.trim().slice(0, 50);
    await createNotification(supabase, {
      userId: recipientId,
      title: "New Message from your landlord",
      body: preview,
      type: "message",
      urgency: isFormalNotice ? "high" : "normal",
    });

    revalidatePath("/admin/messages");
    revalidatePath("/tenant/messages");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function markMessageRead(messageId: string) {
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

    const { error: updateError } = await supabase
      .from("rp_messages")
      .update({ is_read: true })
      .eq("id", messageId)
      .eq("recipient_id", rpUser.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function replyToMessageAdmin(formData: FormData) {
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

    const parentMessageId = formData.get("parent_message_id") as string;
    const body = formData.get("body") as string;

    if (!parentMessageId || !body?.trim()) {
      return { success: false, error: "Message body is required" };
    }

    // Verify the parent message exists and admin is involved
    const { data: parentMessage, error: parentError } = await supabase
      .from("rp_messages")
      .select("id, sender_id, recipient_id, property_id, subject")
      .eq("id", parentMessageId)
      .single();

    if (parentError || !parentMessage) {
      return { success: false, error: "Original message not found" };
    }

    if (
      parentMessage.sender_id !== rpUser.id &&
      parentMessage.recipient_id !== rpUser.id
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
    const preview = replySubject || body.trim().slice(0, 50);
    await createNotification(supabase, {
      userId: newRecipientId,
      title: "New Reply from your landlord",
      body: preview,
      type: "message",
      urgency: "normal",
    });

    revalidatePath("/admin/messages");
    revalidatePath("/tenant/messages");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
