import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a notification for a user.
 * This is a plain utility — NOT a server action.
 * Errors are silently caught so notifications never break the main flow.
 */
export async function createNotification(
  supabase: SupabaseClient,
  params: {
    userId: string;
    title: string;
    body: string;
    type: string; // 'payment' | 'maintenance' | 'message' | 'lease' | 'document' | 'system'
    urgency?: string; // 'low' | 'normal' | 'high' | 'urgent' — defaults to 'normal'
  }
): Promise<void> {
  try {
    await supabase.from("rp_notifications").insert({
      user_id: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      urgency: params.urgency ?? "normal",
      is_read: false,
    });
  } catch {
    // Silently ignore — notifications should never break the main flow
  }
}
