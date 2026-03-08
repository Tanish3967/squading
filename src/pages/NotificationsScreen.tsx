import { useState, useEffect } from "react";
import { Activity, User } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface DBNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  activity_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface Props {
  currentUser: User;
  activities: Activity[];
  onActivityClick: (a: Activity) => void;
}

const ICON_MAP: Record<string, string> = {
  invite: "🎯",
  refund: "💸",
  reminder: "🔔",
  system: "👋",
};

export default function NotificationsScreen({ currentUser, activities, onActivityClick }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, activity_id, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications((data as DBNotification[]) || []);
      setLoading(false);
    };

    fetchNotifications();

    // Mark all as read after a short delay
    const timer = setTimeout(async () => {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    }, 1500);

    // Realtime subscription
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as DBNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleClick = (n: DBNotification) => {
    if (n.activity_id) {
      const activity = activities.find((a) => a.id === n.activity_id);
      if (activity) {
        onActivityClick(activity);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      <div className="pt-[52px] px-6 pb-5">
        <p className="font-display text-[22px] font-extrabold">Notifications</p>
      </div>
      <div className="px-6 flex flex-col gap-2.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3.5 p-4 bg-card border border-border rounded-2xl items-start animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-secondary shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded-lg w-3/4" />
                <div className="h-3 bg-secondary rounded-md w-1/3" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-14 rounded-2xl border border-dashed border-border bg-secondary/30">
            <div className="text-[48px] mb-3">🔔</div>
            <p className="text-muted-foreground text-sm">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex gap-3.5 p-4 bg-card border rounded-2xl items-start transition-colors ${
                n.activity_id ? "cursor-pointer hover:border-foreground/10" : ""
              } ${!n.is_read ? "border-primary/30" : "border-border"}`}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">
                {ICON_MAP[n.type] || "📌"}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold mb-0.5">{n.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
