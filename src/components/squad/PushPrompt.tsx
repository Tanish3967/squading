import { Bell, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Props {
  userId: string;
}

export default function PushPrompt({ userId }: Props) {
  const { permission, subscribed, loading, subscribe } = usePushNotifications(userId);

  // Don't show if already subscribed, denied, or not supported
  if (
    subscribed ||
    permission === "denied" ||
    typeof Notification === "undefined" ||
    !("PushManager" in window)
  ) {
    return null;
  }

  return (
    <div className="mx-1 mb-3 p-3.5 bg-card border border-border rounded-2xl flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Bell size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Enable notifications</p>
        <p className="text-xs text-muted-foreground">Get reminders & squad updates</p>
      </div>
      <button
        onClick={subscribe}
        disabled={loading}
        className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shrink-0 active:scale-95 transition-transform disabled:opacity-50"
      >
        {loading ? "…" : "Enable"}
      </button>
    </div>
  );
}
