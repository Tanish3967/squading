import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Activity, MOCK_USERS, ACTIVITY_CATEGORIES } from "@/lib/mock-data";
import StatusPill from "./StatusPill";

interface Props {
  activity: Activity;
  currentUserId: string;
  onClick: (activity: Activity) => void;
}

export default function ActivityCard({ activity, currentUserId, onClick }: Props) {
  const creator = MOCK_USERS.find(u => u.id === activity.creatorId);
  const joined = activity.invitees.filter(i => i.status === "accepted").length;
  const myInvite = activity.invitees.find(i => i.userId === currentUserId);
  const catInfo = ACTIVITY_CATEGORIES.find(c => c.id === activity.category);
  const capacityPercent = Math.round((joined / activity.maxPeople) * 100);
  const dateObj = new Date(activity.date);
  const dayNum = dateObj.getDate();
  const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();

  const isPending = myInvite?.status === "pending";

  return (
    <div
      className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] group"
      onClick={() => onClick(activity)}
    >
      {/* Background with subtle gradient based on status */}
      <div className={`absolute inset-0 ${isPending ? "bg-gradient-to-br from-primary/[0.08] via-card to-card" : "bg-card"}`} />
      <div className="absolute inset-0 border border-border rounded-2xl" />
      {isPending && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />}

      <div className="relative p-4 flex gap-4">
        {/* Date block */}
        <div className="shrink-0 w-14 h-16 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
          <span className="font-display text-[22px] font-extrabold text-primary leading-none">{dayNum}</span>
          <span className="text-[10px] font-semibold text-primary/70 tracking-wider mt-0.5">{monthStr}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-display text-[15px] font-bold truncate leading-tight">{activity.title}</h3>
            {myInvite && <StatusPill status={myInvite.status} />}
            {activity.creatorId === currentUserId && !myInvite && <StatusPill status={activity.status} />}
          </div>

          <div className="flex items-center gap-3 mb-2.5">
            <span className="text-[12px] text-muted-foreground flex items-center gap-1">
              <MapPin size={12} /> {activity.location.split(",")[0]}
            </span>
            <span className="text-[12px] text-muted-foreground">
              {activity.time}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Category chip */}
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium">
                {catInfo?.icon} {catInfo?.label}
              </span>

              {/* Avatars stack */}
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {activity.invitees.filter(i => i.status === "accepted").slice(0, 3).map(inv => {
                    const u = MOCK_USERS.find(mu => mu.id === inv.userId);
                    return (
                      <div key={inv.userId} className="w-5 h-5 rounded-full bg-secondary border border-background flex items-center justify-center text-[8px] font-bold">
                        {u?.name?.[0] || "?"}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[11px] text-muted-foreground">{joined}/{activity.maxPeople}</span>
              </div>
            </div>

            {/* Deposit */}
            <span className="text-[13px] font-bold text-primary">₹{activity.deposit}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 h-[3px] bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pending action hint */}
      {isPending && (
        <div className="relative border-t border-border px-4 py-2.5 flex items-center justify-between bg-primary/[0.04]">
          <span className="text-[12px] text-primary font-medium">You've been invited — tap to respond</span>
          <ArrowRight size={14} className="text-primary" />
        </div>
      )}
    </div>
  );
}
