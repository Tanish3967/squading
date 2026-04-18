import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SquadAvatar from "@/components/squad/Avatar";
import { sendPush } from "@/hooks/usePushNotifications";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  user_name: string;
}

interface Props {
  activityId: string;
  currentUserId: string;
  currentUserName: string;
}

export default function ActivityComments({ activityId, currentUserId, currentUserName }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("id, body, created_at, user_id")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .rpc("get_public_profiles", { user_ids: userIds });

      const nameMap: Record<string, string> = {};
      (profiles as { id: string; name: string | null }[] | null)?.forEach(p => { nameMap[p.id] = p.name || "Squad Member"; });

      setComments(data.map(c => ({
        ...c,
        user_name: nameMap[c.user_id] || "Squad Member",
      })));
    }
  };

  const appendComment = async (row: { id: string; body: string; created_at: string; user_id: string }) => {
    let userName = "Squad Member";
    if (row.user_id === currentUserId) {
      userName = currentUserName;
    } else {
      const { data: profiles } = await supabase
        .rpc("get_public_profiles", { user_ids: [row.user_id] });
      const p = (profiles as { id: string; name: string | null }[] | null)?.[0];
      if (p?.name) userName = p.name;
    }
    setComments(prev => prev.some(c => c.id === row.id) ? prev : [...prev, { ...row, user_name: userName }]);
  };

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments-${activityId}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `activity_id=eq.${activityId}` },
        (payload) => {
          appendComment(payload.new as any);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments", filter: `activity_id=eq.${activityId}` },
        (payload) => {
          setComments(prev => prev.filter(c => c.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSend = async () => {
    if (!newComment.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("comments").insert({
      activity_id: activityId,
      user_id: currentUserId,
      body: newComment.trim(),
    });
    if (!error) {
      // Notify other participants via push
      const { data: invitees } = await supabase
        .from("invitees")
        .select("user_id")
        .eq("activity_id", activityId);
      const { data: activity } = await supabase
        .from("activities")
        .select("creator_id, title")
        .eq("id", activityId)
        .single();

      if (activity) {
        const otherUserIds = [
          activity.creator_id,
          ...(invitees?.map(i => i.user_id) || []),
        ].filter(id => id !== currentUserId);

        if (otherUserIds.length > 0) {
          sendPush(
            otherUserIds,
            `💬 New message in "${activity.title}"`,
            `${currentUserName}: ${newComment.trim().slice(0, 80)}`,
            { activityId }
          );
        }
      }
      setNewComment("");
    }
    setSending(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <p className="text-xs text-muted-foreground tracking-widest uppercase">💬 Chat ({comments.length})</p>
      </div>

      <div className="max-h-[280px] overflow-y-auto p-4 flex flex-col gap-3">
        {comments.length === 0 && (
          <p className="text-[13px] text-muted-foreground text-center py-4">No messages yet. Start the conversation!</p>
        )}
        {comments.map(c => {
          const isMe = c.user_id === currentUserId;
          return (
            <div key={c.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
              <SquadAvatar name={c.user_name} size="sm" />
              <div className={`max-w-[75%] ${isMe ? "items-end" : ""}`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                  isMe
                    ? "bg-primary/10 border border-primary/20 text-foreground rounded-tr-md"
                    : "bg-secondary border border-border text-foreground rounded-tl-md"
                }`}>
                  {!isMe && <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{c.user_name}</p>}
                  {c.body}
                </div>
                <p className={`text-[10px] text-muted-foreground mt-0.5 ${isMe ? "text-right" : ""}`}>{timeAgo(c.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <input
          type="text"
          placeholder="Type a message…"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          className="flex-1 bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <button
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
