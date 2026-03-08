import { ChevronRight } from "lucide-react";
import { Activity, User } from "@/lib/mock-data";
import SquadAvatar from "@/components/squad/Avatar";
import GlowOrb from "@/components/squad/GlowOrb";

interface Props {
  currentUser: User;
  activities: Activity[];
  onLogout: () => void;
}

export default function ProfileScreen({ currentUser, activities, onLogout }: Props) {
  const myCreated = activities.filter(a => a.creatorId === currentUser.id);
  const myAttended = activities.filter(a => a.invitees.some(i => i.userId === currentUser.id && i.attended));
  const totalPaid = activities.reduce((sum, a) => {
    const inv = a.invitees.find(i => i.userId === currentUser.id && i.paid);
    return inv ? sum + a.deposit : sum;
  }, 0);
  const totalRefunded = activities.reduce((sum, a) => {
    const inv = a.invitees.find(i => i.userId === currentUser.id && i.attended);
    return inv ? sum + a.deposit : sum;
  }, 0);

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      <div className="pt-[52px] px-6 pb-7 relative">
        <GlowOrb color="#845EC2" size={200} top="-40px" right="-60px" />
        <div className="flex gap-4 items-center mb-5 relative z-10">
          <SquadAvatar name={currentUser.name} size="lg" />
          <div>
            <p className="font-display text-xl font-extrabold">{currentUser.name}</p>
            <p className="text-[13px] text-squad-text2">+91 {currentUser.phone}</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-squad-saffron/10 text-squad-saffron border border-squad-saffron/20 mt-1.5">Squad Member</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            ["🎯", "Created", myCreated.length],
            ["✅", "Attended", myAttended.length],
            ["💸", "Paid", `₹${totalPaid}`],
            ["🔄", "Refunded", `₹${totalRefunded}`],
          ].map(([icon, label, val]) => (
            <div key={label as string} className="flex flex-col items-center gap-0.5 p-3.5 bg-squad-bg3 border border-border rounded-[14px]">
              <span className="text-[22px]">{icon}</span>
              <span className="font-display text-xl font-bold">{val}</span>
              <span className="text-[11px] text-squad-text3">{label as string}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 flex flex-col gap-2.5">
        <p className="text-xs text-squad-text3 mb-1">ACCOUNT</p>
        {[
          ["🔔", "Notification preferences"],
          ["💳", "Payment methods"],
          ["🔐", "Privacy & security"],
          ["📋", "Transaction history"],
          ["❓", "Help & support"],
        ].map(([icon, label]) => (
          <div key={label} className="flex items-center gap-3.5 p-3.5 px-4 bg-card border border-border rounded-[14px] cursor-pointer">
            <span className="text-lg">{icon}</span>
            <span className="text-sm flex-1">{label}</span>
            <ChevronRight size={16} className="text-squad-text3" />
          </div>
        ))}
        <button onClick={onLogout} className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-transparent text-squad-red border border-squad-red/30 font-medium active:bg-squad-red/10 transition-all w-full mt-2">
          Sign out
        </button>
      </div>
    </div>
  );
}
