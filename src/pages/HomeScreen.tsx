import { Bell, Plus, Sparkles } from "lucide-react";
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

  const createdCount = activities.filter(a => a.creatorId === currentUser.id).length;
  const attendedCount = activities.filter(a => a.invitees.some(i => i.userId === currentUser.id && i.attended)).length;
  const depositedAmount = activities.reduce((sum, a) => {
    const inv = a.invitees.find(i => i.userId === currentUser.id && i.paid);
    return inv ? sum + a.deposit : sum;
  }, 0);

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      {/* Header */}
      <div className="pt-[52px] px-6 pb-6 relative">
        <GlowOrb color="hsl(var(--primary))" size={250} top="-60px" right="-80px" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-muted-foreground text-[13px] mb-0.5">Hey,</p>
            <p className="font-display text-[22px] font-extrabold tracking-tight">{currentUser.name.split(" ")[0]} 👋</p>
          </div>
          <div className="flex gap-2.5 items-center">
            {myInvites.length > 0 && (
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center cursor-pointer">
                  <Bell size={20} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {myInvites.length}
                </div>
              </div>
            )}
            <SquadAvatar name={currentUser.name} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2.5 px-6 pb-6">
        {[
          { val: createdCount, label: "Created", color: "text-primary" },
          { val: attendedCount, label: "Attended", color: "text-[hsl(var(--squad-green))]" },
          { val: `₹${depositedAmount}`, label: "Deposited", color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="flex flex-col gap-0.5 p-3.5 bg-secondary border border-border rounded-2xl flex-1">
            <span className={`text-[22px] font-bold font-display ${s.color}`}>{s.val}</span>
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Pending invites section */}
      {myInvites.length > 0 && (
        <div className="px-6 pb-5">
          <div className="flex items-center gap-2 mb-3.5">
            <Sparkles size={14} className="text-primary" />
            <p className="font-display text-sm font-bold text-primary tracking-wide uppercase">
              Waiting for you ({myInvites.length})
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {myInvites.map(a => (
              <ActivityCard key={a.id} activity={a} currentUserId={currentUser.id as string} onClick={onActivityClick} />
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {myInvites.length > 0 && myActivities.length > 0 && (
        <div className="px-6 pb-4">
          <div className="h-px bg-border" />
        </div>
      )}

      {/* All activities */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3.5">
          <p className="font-display text-sm font-bold tracking-wide uppercase text-muted-foreground">Your Activities</p>
          <span className="text-[12px] text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">{myActivities.length}</span>
        </div>
        <div className="flex flex-col gap-3">
          {myActivities.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border border-dashed border-border bg-secondary/30">
              <div className="text-[48px] mb-3">🎯</div>
              <p className="text-muted-foreground text-sm mb-4">No activities yet.<br />Create one and invite your squad!</p>
              <button onClick={onCreateClick} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform">
                <Plus size={16} /> Create Activity
              </button>
            </div>
          ) : (
            myActivities.map(a => (
              <ActivityCard key={a.id} activity={a} currentUserId={currentUser.id as string} onClick={onActivityClick} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
