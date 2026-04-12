"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DateDisplay } from "@/components/shared/date-display";
import {
  replyToMessage,
  markTenantMessageRead,
} from "@/app/tenant/actions/message-actions";

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
};

type Props = {
  threads: Thread[];
  currentUserId: string;
  usersById: Record<string, { first_name: string; last_name: string }>;
};

export function TenantMessageList({
  threads,
  currentUserId,
  usersById,
}: Props) {
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [markedRead, setMarkedRead] = useState<Set<string>>(new Set());

  function getUserName(userId: string) {
    const u = usersById[userId];
    if (!u) return "Unknown";
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
      await markTenantMessageRead(msg.id);
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

      const result = await replyToMessage(formData);
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
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-headline font-bold text-primary mb-4">
        Conversations
      </h2>
      {threads.map((thread) => {
        const { root, replies, hasUnread } = thread;
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
        const threadUnread =
          hasUnread &&
          !markedRead.has(root.id) &&
          [root, ...replies].some(
            (m) =>
              !m.is_read &&
              m.recipient_id === currentUserId &&
              !markedRead.has(m.id)
          );

        return (
          <div key={root.id} className="rounded-xl overflow-hidden">
            {/* Thread summary row */}
            <button
              onClick={() => handleExpand(root.id, thread)}
              className={`w-full text-left bg-surface-container-lowest p-5 shadow-ambient-sm border-l-4 transition-colors hover:bg-surface-container-low ${
                root.is_formal_notice
                  ? "border-error"
                  : threadUnread
                    ? "border-secondary"
                    : "border-outline-variant"
              } ${isExpanded ? "rounded-t-xl rounded-b-none" : "rounded-xl"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {threadUnread && (
                    <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />
                  )}
                  <h3 className="font-headline font-bold text-primary truncate">
                    {root.subject || "No subject"}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {root.is_formal_notice && (
                    <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-full uppercase">
                      Formal Notice
                    </span>
                  )}
                  {replyCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full">
                      <span className="material-symbols-outlined text-[10px]">
                        forum
                      </span>
                      {replyCount}
                    </span>
                  )}
                  <DateDisplay
                    date={latestMsg.created_at}
                    format="relative"
                    className="text-xs text-on-surface-variant"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-on-surface-variant">
                  {isSent ? `To: ${otherName}` : `From: ${otherName}`}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant line-clamp-2">
                {bodyPreview}
              </p>
            </button>

            {/* Expanded thread view */}
            {isExpanded && (
              <div className="bg-surface-container-low rounded-b-xl border-l-4 border-outline-variant/30">
                {/* All messages in thread */}
                <div className="divide-y divide-outline-variant/10">
                  {/* Root message */}
                  <div className="px-5 py-4">
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
                    <p className="text-sm text-on-surface whitespace-pre-wrap">
                      {root.body}
                    </p>
                  </div>

                  {/* Replies */}
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`px-5 py-4 ${
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
                      <p className="text-sm text-on-surface whitespace-pre-wrap">
                        {reply.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reply form - only show if not a formal notice */}
                {!root.is_formal_notice && (
                  <div className="px-5 py-4 border-t border-outline-variant/10">
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
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
