import { createClient } from "@/lib/supabase/server";
import { DateDisplay } from "@/components/shared/date-display";

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

  // Check if rp_messages table exists by trying a query
  let messages: Array<{
    id: string;
    subject: string;
    body: string;
    is_read: boolean;
    is_formal_notice: boolean;
    created_at: string;
    sender_id: string;
  }> = [];

  const { data, error } = await supabase
    .from("rp_messages")
    .select("*")
    .eq("recipient_id", rpUser.id)
    .order("created_at", { ascending: false });

  if (!error && data) {
    messages = data;
  }

  // Also fetch notifications as activity
  const { data: notifications } = await supabase
    .from("rp_notifications")
    .select("*")
    .eq("user_id", rpUser.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-primary tracking-tight">
            Messages & Notices
          </h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Messages list */}
        <div className="lg:col-span-8">
          {messages.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-headline font-bold text-primary mb-4">
                Messages
              </h2>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bg-surface-container-lowest rounded-xl p-5 shadow-ambient-sm border-l-4 transition-colors ${
                    msg.is_formal_notice
                      ? "border-error"
                      : msg.is_read
                        ? "border-outline-variant"
                        : "border-secondary"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {!msg.is_read && (
                        <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />
                      )}
                      <h3 className="font-headline font-bold text-primary">
                        {msg.subject}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {msg.is_formal_notice && (
                        <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-full uppercase">
                          Formal Notice
                        </span>
                      )}
                      <DateDisplay
                        date={msg.created_at}
                        format="relative"
                        className="text-xs text-on-surface-variant"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-2">
                    {msg.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-container-low rounded-2xl">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
                mail
              </span>
              <h2 className="font-headline text-xl font-bold text-primary mb-2">
                No Messages Yet
              </h2>
              <p className="text-on-surface-variant">
                Messages from your landlord will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Notifications sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
            <div className="px-6 py-5 bg-surface-container-highest flex justify-between items-center">
              <h3 className="font-headline font-bold text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-secondary text-on-secondary text-[10px] font-bold rounded-full">
                  {unreadCount} new
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
