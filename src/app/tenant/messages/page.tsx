import { createClient } from "@/lib/supabase/server";
import { DateDisplay } from "@/components/shared/date-display";
import Link from "next/link";
import { TenantMessageList } from "./message-list";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // Fetch all messages where tenant is sender or recipient
  const { data: receivedMessages } = await supabase
    .from("rp_messages")
    .select(
      "id, property_id, sender_id, recipient_id, subject, body, is_read, is_formal_notice, notice_type, delivery_method, parent_message_id, created_at"
    )
    .eq("recipient_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: sentMessages } = await supabase
    .from("rp_messages")
    .select(
      "id, property_id, sender_id, recipient_id, subject, body, is_read, is_formal_notice, notice_type, delivery_method, parent_message_id, created_at"
    )
    .eq("sender_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(100);

  // Merge and deduplicate
  const allMessagesMap = new Map<string, any>();
  for (const msg of [...(receivedMessages ?? []), ...(sentMessages ?? [])]) {
    allMessagesMap.set(msg.id, msg);
  }
  const allMessages = Array.from(allMessagesMap.values()).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Group messages into threads:
  // A thread root is any message without a parent_message_id
  // Replies are messages with a parent_message_id
  const threadMap = new Map<string, any[]>();
  const rootMessages: any[] = [];

  for (const msg of allMessages) {
    if (!msg.parent_message_id) {
      rootMessages.push(msg);
      if (!threadMap.has(msg.id)) {
        threadMap.set(msg.id, []);
      }
    } else {
      const parentId = msg.parent_message_id;
      if (!threadMap.has(parentId)) {
        threadMap.set(parentId, []);
      }
      threadMap.get(parentId)!.push(msg);
    }
  }

  // Build threads sorted by latest activity (most recent message in thread)
  const threads = rootMessages
    .map((root) => {
      const replies = threadMap.get(root.id) ?? [];
      const allInThread = [root, ...replies];
      const latestMessage = allInThread[allInThread.length - 1];
      const hasUnread = allInThread.some(
        (m) => !m.is_read && m.recipient_id === rpUser.id
      );
      return {
        root,
        replies,
        latestMessage,
        hasUnread,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.latestMessage.created_at).getTime() -
        new Date(a.latestMessage.created_at).getTime()
    );

  // Batch-fetch user names for all sender/recipient IDs
  const userIds = new Set<string>();
  for (const msg of allMessages) {
    if (msg.sender_id) userIds.add(msg.sender_id);
    if (msg.recipient_id) userIds.add(msg.recipient_id);
  }

  let usersById: Record<string, { first_name: string; last_name: string }> = {};
  if (userIds.size > 0) {
    const { data: users } = await supabase
      .from("rp_users")
      .select("id, first_name, last_name")
      .in("id", Array.from(userIds));

    for (const u of users ?? []) {
      usersById[u.id] = { first_name: u.first_name, last_name: u.last_name };
    }
  }

  // Also fetch notifications as activity
  const { data: notifications } = await supabase
    .from("rp_notifications")
    .select("*")
    .eq("user_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const unreadCount = threads.filter((t) => t.hasUnread).length;
  const unreadNotifCount = (notifications ?? []).filter(
    (n) => !n.is_read
  ).length;

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Messages & Notices
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread conversation${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        <Link
          href="/tenant/messages/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          New Message
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Messages list */}
        <div className="lg:col-span-8">
          <TenantMessageList
            threads={threads}
            currentUserId={rpUser.id}
            usersById={usersById}
          />
        </div>

        {/* Notifications sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
            <div className="px-6 py-5 bg-surface-container-highest flex justify-between items-center">
              <h3 className="font-headline font-bold text-base">
                Notifications
              </h3>
              {unreadNotifCount > 0 && (
                <span className="px-2 py-0.5 bg-secondary text-on-secondary text-[10px] font-bold rounded-full">
                  {unreadNotifCount} new
                </span>
              )}
            </div>
            <div className="divide-y divide-outline-variant/10 max-h-[600px] overflow-y-auto">
              {(notifications ?? []).length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-on-surface-variant">
                  No notifications
                </div>
              ) : (
                (notifications ?? []).map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-6 py-4 hover:bg-surface-container-low transition-colors ${
                      !notif.is_read ? "bg-secondary-fixed/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!notif.is_read && (
                        <span className="w-2 h-2 bg-secondary rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                          {notif.body}
                        </p>
                        <DateDisplay
                          date={notif.created_at}
                          format="relative"
                          className="text-[10px] text-on-surface-variant mt-1 block"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
