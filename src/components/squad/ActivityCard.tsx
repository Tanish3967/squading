import { ArrowRight } from "lucide-react";
import { Activity, ACTIVITY_CATEGORIES } from "@/lib/mock-data";
import StatusPill from "./StatusPill";

interface Props {
  activity: Activity;
  currentUserId: string;
  onClick: (activity: Activity) => void;
}

export default function ActivityCard({ activity, currentUserId, onClick }: Props) {
  const myInvite = activity.invitees.find(i => i.userId === currentUserId);
  const catInfo = ACTIVITY_CATEGORIES.find(c => c.id === activity.category);
  const dateObj = new Date(activity.date);
  const dayNum = dateObj.getDate();
  const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  const isPending = myInvite?.status === "pending";

  return (
    <div
      className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] group"
      onClick={() => onClick(activity)}
    >
      <div className={`absolute inset-0 ${isPending ? "bg-gradient-to-br from-primary/[0.08] via-card to-card" : "bg-card"}`} />
      <div className="absolute inset-0 border border-border rounded-2xl" />
      {isPending && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />}

      <div className="relative p-4 flex items-center gap-4">
        {/* Date block */}
        <div className="shrink-0 w-12 h-14 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
          <span className="font-display text-[20px] font-extrabold text-primary leading-none">{dayNum}</span>
          <span className="text-[9px] font-semibold text-primary/70 tracking-wider mt-0.5">{monthStr}</span>
        </div>

        {/* Title & category only */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-[15px] font-bold truncate leading-tight mb-1">{activity.title}</h3>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium inline-flex items-center gap-1">
            {catInfo?.icon} {catInfo?.label}
          </span>
        </div>

        {/* Status */}
        <div className="shrink-0 flex items-center gap-2">
          {myInvite && <StatusPill status={myInvite.status} />}
          {activity.creatorId === currentUserId && !myInvite && <StatusPill status={activity.status} />}
        </div>
      </div>

      {/* Pending action hint */}
      {isPending && (
        <div className="relative border-t border-border px-4 py-2 flex items-center justify-between bg-primary/[0.04]">
          <span className="text-[12px] text-primary font-medium">Tap to respond</span>
          <ArrowRight size={14} className="text-primary" />
        </div>
      )}
    </div>
  );
}
