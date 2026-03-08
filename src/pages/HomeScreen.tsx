import { Bell } from "lucide-react";
import { Activity, User } from "@/lib/mock-data";
import SquadAvatar from "@/components/squad/Avatar";
import ActivityCard from "@/components/squad/ActivityCard";
import GlowOrb from "@/components/squad/GlowOrb";

interface Props {
  currentUser: User;
  activities: Activity[];
  onActivityClick: (a: Activity) => void;
  onCreateClick: () => void;
}

export default function HomeScreen({ currentUser, activities, onActivityClick, onCreateClick }: Props) {
  const myInvites = activities.filter(a =>
    a.invitees.some(i => i.userId === currentUser.id && i.status === "pending")
  );
  const myActivities = activities.filter(a =>
    a.creatorId === currentUser.id || a.invitees.some(i => i.userId === currentUser.id && i.status === "accepted")
  );

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      {/* Header */}
      <div className="pt-[52px] px-6 pb-5 relative">
        <GlowOrb color="hsl(25 100% 50%)" size={250} top="-60px" right="-80px" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-squad-text2 text-[13px] mb-0.5">Hey,</p>
            <p className="font-display text-[22px] font-extrabold tracking-tight">{currentUser.name.split(" ")[0]} 👋</p>
          </div>
          <div className="flex gap-2.5 items-center">
            {myInvites.length > 0 && (
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center cursor-pointer">
                  <Bell size={20} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-squad-saffron flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {myInvites.length}
                </div>
              </div>
            )}
            <SquadAvatar name={currentUser.name} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2.5 px-6 pb-6">
        {[
          { val: activities.filter(a => a.creatorId === currentUser.id).length, label: "Created", color: "text-squad-saffron" },
          { val: activities.filter(a => a.invitees.some(i => i.userId === currentUser.id && i.attended)).length, label: "Attended", color: "text-squad-green" },
          { val: `₹${activities.reduce((sum, a) => { const inv = a.invitees.find(i => i.userId === currentUser.id && i.paid); return inv ? sum + a.deposit : sum; }, 0)}`, label: "Deposited", color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="flex flex-col gap-0.5 p-3.5 bg-squad-bg3 border border-border rounded-[14px] flex-1">
            <span className={`text-[22px] font-bold font-display ${s.color}`}>{s.val}</span>
            <span className="text-[11px] text-squad-text3">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Pending invites */}
      {myInvites.length > 0 && (
        <div className="px-6 pb-6">
          <p className="font-display text-base font-bold mb-3.5 text-squad-saffron">
            🔥 Waiting for you ({myInvites.length})
          </p>
          <div className="flex flex-col gap-2.5">
            {myInvites.map(a => (
              <ActivityCard key={a.id} activity={a} currentUserId={currentUser.id as string} onClick={onActivityClick} />
            ))}
          </div>
        </div>
      )}

      {/* All activities */}
      <div className="px-6">
        <p className="font-display text-base font-bold mb-3.5">Your Activities</p>
        <div className="flex flex-col gap-3">
          {myActivities.length === 0 ? (
            <div className="text-center py-10 text-squad-text3">
              <div className="text-[40px] mb-2.5">🎯</div>
              <p>No activities yet.<br />Create one and invite your squad!</p>
            </div>
          ) : (
            myActivities.map(a => (
              <ActivityCard key={a.id} activity={a} currentUserId={currentUser.id} onClick={onActivityClick} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
