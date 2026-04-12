"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DateDisplay } from "@/components/shared/date-display";
import {
  markMessageRead,
  replyToMessageAdmin,
} from "@/app/admin/actions/message-actions";

const DELIVERY_METHOD: Record<string, { label: string; icon: string }> = {
  portal: { label: "Portal", icon: "language" },
  in_app: { label: "Portal", icon: "language" },
  email: { label: "Email", icon: "email" },
  mail: { label: "Mail", icon: "local_post_office" },
  personal: { label: "In Person", icon: "person" },
};

type Message = {
  id: string;
  property_id: string | null;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  is_formal_notice: boolean;
  notice_type: string | null;
  delivery_method: string | null;
  parent_message_id: string | null;
  created_at: string;
};

type Thread = {
  root: Message;
  replies: Message[];
  latestMessage: Message;
  hasUnread: boolean;
  unreadReplyCount: number;
};

type Props = {
  threads: Thread[];
  currentUserId: string;
  usersById: Record<string, { first_name: string; last_name: string }>;
  propertiesById: Record<string, string>;
};

export function AdminMessageList({
  threads,
  currentUserId,
  usersById,
  propertiesById,
}: Props) {
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [markedRead, setMarkedRead] = useState<Set<string>>(new Set());

  function getUserName(userId: string) {
    const u = usersById[userId];
    if (!u) return "Unknown User";
    return `${u.first_name} ${u.last_name}`;
  }

  async function handleExpand(threadId: string, thread: Thread) {
    if (expandedThread === threadId) {
      setExpandedThread(null);
      setReplyBody("");
      return;
    }
    setExpandedThread(threadId);
    setReplyBody("");

    // Mark all unread messages in this thread as read
    const unreadMessages = [thread.root, ...thread.replies].filter(
      (m) =>
        !m.is_read &&
        m.recipient_id === currentUserId &&
        !markedRead.has(m.id)
    );

    for (const msg of unreadMessages) {
      await markMessageRead(msg.id);
      setMarkedRead((prev) => new Set(prev).add(msg.id));
    }
  }

  async function handleReply(parentMessageId: string) {
    if (!replyBody.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("parent_message_id", parentMessageId);
      formData.set("body", replyBody.trim());

      const result = await replyToMessageAdmin(formData);
      if (result.success) {
        toast.success("Reply sent");
        setReplyBody("");
      } else {
        toast.error(result.error ?? "Failed to send reply");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (threads.length === 0) {
    return (
      <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
        <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">mail</span>
          <h3 className="font-headline font-bold text-lg">All Messages</h3>
        </div>
        <div className="px-8 py-16 text-center">
          <span className="material-symbols-outlined text-outline-variant text-5xl mb-4 block">
            forum
          </span>
          <h3 className="font-headline font-bold text-on-surface mb-2">
            No messages yet
          </h3>
          <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
            Messages between you and your tenants will appear here. Start a
            conversation by sending a new message.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-bright rounded-3xl overflow-hidden shadow-ambient-sm">
      <div className="px-6 md:px-8 py-5 bg-surface-container-highest flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">mail</span>
        <h3 className="font-headline font-bold text-lg">All Messages</h3>
        <span className="text-xs text-on-surface-variant ml-auto">
          {threads.length}{" "}
          {threads.length === 1 ? "conversation" : "conversations"}
        </span>
      </div>

      <div className="divide-y divide-outline-variant/10">
        {threads.map((thread) => {
          const { root, replies, hasUnread, unreadReplyCount } = thread;
          const isExpanded = expandedThread === root.id;
          const isSent = root.sender_id === currentUserId;
          const otherUserId = isSent ? root.recipient_id : root.sender_id;
          const otherName = getUserName(otherUserId);
          const replyCount = replies.length;
          const latestMsg = thread.latestMessage;
          const bodyPreview =
            latestMsg.body && latestMsg.body.length > 100
              ? latestMsg.body.substring(0, 100) + "..."
              : latestMsg.body ?? "";
          const delivery =
            DELIVERY_METHOD[root.delivery_method ?? "in_app"] ??
            DELIVERY_METHOD.in_app;
          const propertyAddress = root.property_id
            ? propertiesById[root.property_id]
            : null;

          const threadUnread =
            hasUnread &&
            [root, ...replies].some(
              (m) =>
                !m.is_read &&
                m.recipient_id === currentUserId &&
                !markedRead.has(m.id)
            );

          return (
            <div key={root.id}>
              {/* Thread summary row */}
              <button
                onClick={() => handleExpand(root.id, thread)}
                className={`w-full text-left flex items-start gap-4 px-6 md:px-8 py-5 hover:bg-surface-container-low transition-colors ${
                  threadUnread ? "bg-primary-fixed/5" : ""
                }`}
              >
                {/* Unread indicator */}
                <div className="flex-shrink-0 pt-2">
                  {threadUnread ? (
                    <span className="block w-2.5 h-2.5 rounded-full bg-secondary" />
                  ) : (
                    <span className="block w-2.5 h-2.5 rounded-full bg-transparent" />
                  )}
                </div>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm font-semibold ${
                        threadUnread ? "text-primary" : "text-on-surface"
                      } truncate`}
                    >
                      {isSent ? `To: ${otherName}` : otherName}
                    </span>
                    {isSent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[10px]">
                          send
                        </span>
                        Sent
                      </span>
                    )}
                    {replyCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[10px]">
                          forum
                        </span>
                        {replyCount} {replyCount === 1 ? "reply" : "replies"}
                      </span>
                    )}
                    {unreadReplyCount > 0 &&
                      !markedRead.has(root.id) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-on-secondary bg-secondary px-2 py-0.5 rounded-full">
                          {unreadReplyCount} new
                        </span>
                      )}
                  </div>

                  {/* Subject */}
                  <p
                    className={`text-sm truncate ${
                      threadUnread
                        ? "font-semibold text-on-surface"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {root.subject || bodyPreview || "No subject"}
                  </p>

                  {/* Body preview */}
                  {root.subject && bodyPreview && (
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                      {bodyPreview}
                    </p>
                  )}

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {root.is_formal_notice && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error-container text-on-error-container">
                        <span className="material-symbols-outlined text-[10px]">
                          gavel
                        </span>
                        Formal Notice
                      </span>
                    )}
                    {root.notice_type && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-fixed/30 text-on-secondary-fixed-variant">
                        {root.notice_type.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">
                      <span className="material-symbols-outlined text-[10px]">
                        {delivery.icon}
                      </span>
                      {delivery.label}
                    </span>
                    {propertyAddress && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[10px]">
                          location_on
                        </span>
                        {propertyAddress}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date + expand icon */}
                <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">
                    <DateDisplay
                      date={latestMsg.created_at}
                      format="relative"
                    />
                  </span>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">
                    {isExpanded ? "expand_less" : "expand_more"}
                  </span>
                </div>
              </button>

              {/* Expanded thread view */}
              {isExpanded && (
                <div className="bg-surface-container-low border-t border-outline-variant/10">
                  {/* All messages in thread */}
                  <div className="divide-y divide-outline-variant/10">
                    {/* Root message */}
                    <div className="px-6 md:px-8 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-sm text-primary">
                          {root.sender_id === currentUserId
                            ? "arrow_upward"
                            : "arrow_downward"}
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {root.sender_id === currentUserId
                            ? "You"
                            : getUserName(root.sender_id)}
                        </span>
                        <DateDisplay
                          date={root.created_at}
                          format="relative"
                          className="text-[10px] text-on-surface-variant ml-auto"
                        />
                      </div>
                      <p className="text-sm text-on-surface whitespace-pre-wrap ml-6">
                        {root.body}
                      </p>
                    </div>

                    {/* Replies */}
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`px-6 md:px-8 py-4 ${
                          reply.sender_id === currentUserId
                            ? "bg-primary-fixed/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-sm text-primary">
                            {reply.sender_id === currentUserId
                              ? "arrow_upward"
                              : "arrow_downward"}
                          </span>
                          <span className="text-xs font-semibold text-primary">
                            {reply.sender_id === currentUserId
                              ? "You"
                              : getUserName(reply.sender_id)}
                          </span>
                          <DateDisplay
                            date={reply.created_at}
                            format="relative"
                            className="text-[10px] text-on-surface-variant ml-auto"
                          />
                        </div>
                        <p className="text-sm text-on-surface whitespace-pre-wrap ml-6">
                          {reply.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Reply form */}
                  <div className="px-6 md:px-8 py-4 border-t border-outline-variant/10">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">
                          reply
                        </span>
                        <textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder="Write a reply..."
                          rows={2}
                          className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                        />
                      </div>
                      <button
                        onClick={() => handleReply(root.id)}
                        disabled={submitting || !replyBody.trim()}
                        className="self-end px-4 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {submitting ? "hourglass_empty" : "send"}
                        </span>
                        {submitting ? "..." : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
