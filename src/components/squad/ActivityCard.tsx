import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { Activity, MOCK_USERS, ACTIVITY_CATEGORIES } from "@/lib/mock-data";
import SquadAvatar from "./Avatar";
import StatusPill from "./StatusPill";

interface Props {
  activity: Activity;
  currentUserId: number;
  onClick: (activity: Activity) => void;
}

export default function ActivityCard({ activity, currentUserId, onClick }: Props) {
  const creator = MOCK_USERS.find(u => u.id === activity.creatorId);
  const joined = activity.invitees.filter(i => i.status === "accepted").length;
  const myInvite = activity.invitees.find(i => i.userId === currentUserId);
  const catInfo = ACTIVITY_CATEGORIES.find(c => c.id === activity.category);

  return (
    <div
      className="relative overflow-hidden bg-card border border-border rounded-xl p-5 cursor-pointer transition-all duration-200 active:scale-[0.98] active:border-foreground/10 group"
      onClick={() => onClick(activity)}
    >
      {/* Top saffron gradient line on hover/active */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-squad-saffron to-transparent opacity-0 group-active:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start mb-3.5">
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-[14px] bg-squad-saffron/10 border border-squad-saffron/20 flex items-center justify-center text-[22px]">
            {catInfo?.icon}
          </div>
          <div>
            <div className="font-display text-base font-bold mb-0.5">{activity.title}</div>
            <div className="text-xs text-squad-text2">by {creator?.name.split(" ")[0]}</div>
          </div>
        </div>
        {myInvite && <StatusPill status={myInvite.status} />}
        {activity.creatorId === currentUserId && !myInvite && <StatusPill status={activity.status} />}
      </div>

      <div className="flex gap-4 mb-3.5">
        <div className="flex items-center gap-1.5 text-[13px] text-squad-text2">
          <Calendar size={14} />
          {new Date(activity.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {activity.time}
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-squad-text2">
          <MapPin size={14} />
          {activity.location.split(",")[0]}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 text-[13px] text-squad-text2">
            <Users size={14} />{joined}/{activity.maxPeople}
          </div>
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-squad-saffron font-semibold">₹{activity.deposit}</span>
            <span className="text-squad-text3">deposit</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-squad-text3" />
      </div>

      <div className="mt-3">
        <div className="h-1 bg-squad-bg3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-squad-saffron to-[#FF8C35] rounded-full transition-all duration-600"
            style={{ width: `${(joined / activity.maxPeople) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
