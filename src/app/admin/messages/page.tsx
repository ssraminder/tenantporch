import { createClient } from "@/lib/supabase/server";
import { DateDisplay } from "@/components/shared/date-display";
import Link from "next/link";
import { AdminMessageList } from "./message-list";

const NOTIF_ICON: Record<string, { icon: string; color: string }> = {
  rent_due: { icon: "payments", color: "bg-secondary" },
  rent_overdue: { icon: "warning", color: "bg-error" },
  payment_received: { icon: "check_circle", color: "bg-tertiary" },
  maintenance_update: { icon: "handyman", color: "bg-secondary" },
  document_uploaded: { icon: "description", color: "bg-primary" },
  notice: { icon: "gavel", color: "bg-primary" },
  utility_bill: { icon: "receipt_long", color: "bg-secondary" },
  general: { icon: "info", color: "bg-outline" },
  screening_complete: { icon: "verified", color: "bg-tertiary" },
  message: { icon: "mail", color: "bg-primary" },
};

export default async function AdminMessages() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rpUser } = await supabase
    .from("rp_users")
    .select("id, first_name, last_name, email")
    .eq("auth_id", user!.id)
    .single();

  if (!rpUser) return <div>User not found</div>;

  // ─── Fetch messages where user is sender or recipient ───
  const { data: sentMessages } = await supabase
    .from("rp_messages")
    .select(
      "id, property_id, sender_id, recipient_id, subject, body, is_read, is_formal_notice, notice_type, delivery_method, parent_message_id, created_at"
    )
    .eq("sender_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: receivedMessages } = await supabase
    .from("rp_messages")
    .select(
      "id, property_id, sender_id, recipient_id, subject, body, is_read, is_formal_notice, notice_type, delivery_method, parent_message_id, created_at"
    )
    .eq("recipient_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(100);

  // Merge and deduplicate, sort by created_at asc for threading
  const allMessagesMap = new Map<string, any>();
  for (const msg of [...(sentMessages ?? []), ...(receivedMessages ?? [])]) {
    allMessagesMap.set(msg.id, msg);
  }
  const allMessages = Array.from(allMessagesMap.values()).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // ─── Group messages into threads ───
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

  const threads = rootMessages
    .map((root) => {
      const replies = threadMap.get(root.id) ?? [];
      const allInThread = [root, ...replies];
      const latestMessage = allInThread[allInThread.length - 1];
      const hasUnread = allInThread.some(
        (m) => !m.is_read && m.recipient_id === rpUser.id
      );
      const unreadReplyCount = replies.filter(
        (m) => !m.is_read && m.recipient_id === rpUser.id
      ).length;
      return {
        root,
        replies,
        latestMessage,
        hasUnread,
        unreadReplyCount,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.latestMessage.created_at).getTime() -
        new Date(a.latestMessage.created_at).getTime()
    );

  // ─── Batch-fetch user names for all sender/recipient IDs ───
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

  // ─── Batch-fetch property addresses ───
  const propertyIds = new Set<string>();
  for (const msg of allMessages) {
    if (msg.property_id) propertyIds.add(msg.property_id);
  }

  let propertiesById: Record<string, string> = {};
  if (propertyIds.size > 0) {
    const { data: props } = await supabase
      .from("rp_properties")
      .select("id, address_line1, city")
      .in("id", Array.from(propertyIds));

    for (const p of props ?? []) {
      propertiesById[p.id] = `${p.address_line1}, ${p.city}`;
    }
  }

  // ─── Unread count ───
  const unreadCount = threads.filter((t) => t.hasUnread).length;

  // ─── Notifications ───
  const { data: notifications } = await supabase
    .from("rp_notifications")
    .select("*")
    .eq("user_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const unreadNotifCount = (notifications ?? []).filter(
    (n) => !n.is_read
  ).length;

  return (
    <section className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-2xl font-bold text-primary">
            Messages
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-secondary text-on-secondary text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <Link
          href="/admin/messages/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          New Message
        </Link>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── Message List ─── */}
        <div className="lg:col-span-8">
          <AdminMessageList
            threads={threads}
            currentUserId={rpUser.id}
            usersById={usersById}
            propertiesById={propertiesById}
          />
        </div>

        {/* ─── Notifications Sidebar ─── */}
        <div className="lg:col-span-4 bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm h-fit">
          <div className="px-6 py-5 bg-surface-container-highest flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">
              notifications
            </span>
            <h3 className="font-headline font-bold text-lg">Notifications</h3>
            {unreadNotifCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold ml-auto">
                {unreadNotifCount}
              </span>
            )}
          </div>

          {(notifications ?? []).length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-outline-variant text-4xl mb-3 block">
                notifications_none
              </span>
              <p className="text-sm text-on-surface-variant">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {(notifications ?? []).map((notif) => {
                const config =
                  NOTIF_ICON[notif.type] ?? NOTIF_ICON.general;
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-6 py-4 hover:bg-surface-container-low transition-colors ${
                      !notif.is_read ? "bg-primary-fixed/5" : ""
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <span className="material-symbols-outlined text-white text-sm">
                        {config.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          !notif.is_read
                            ? "font-semibold text-primary"
                            : "font-medium text-on-surface"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                      <span className="text-[10px] text-on-surface-variant mt-1 block">
                        <DateDisplay
                          date={notif.created_at}
                          format="relative"
                        />
                      </span>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
