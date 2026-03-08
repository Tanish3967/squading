import { TrendingUp, Target, Wallet, Trophy, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import GlowOrb from "@/components/squad/GlowOrb";

interface ActivityData {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
  deposit: number;
  creatorId: string;
  invitees: {
    userId: string;
    status: string;
    paid: boolean;
    attended: boolean;
  }[];
}

interface Props {
  currentUserId: string;
  activities: ActivityData[];
}

export default function ActivityStatsScreen({ currentUserId, activities }: Props) {
  // Compute stats
  const created = activities.filter(a => a.creatorId === currentUserId);
  const invitedTo = activities.filter(a => a.invitees.some(i => i.userId === currentUserId));
  const accepted = invitedTo.filter(a => a.invitees.some(i => i.userId === currentUserId && i.status === "accepted"));
  const declined = invitedTo.filter(a => a.invitees.some(i => i.userId === currentUserId && i.status === "declined"));
  const attended = activities.filter(a => a.invitees.some(i => i.userId === currentUserId && i.attended));
  const paid = activities.filter(a => a.invitees.some(i => i.userId === currentUserId && i.paid));
  const totalDeposited = paid.reduce((sum, a) => sum + a.deposit, 0);
  const totalRefunded = attended.reduce((sum, a) => sum + a.deposit, 0);
  const pendingRefund = totalDeposited - totalRefunded;

  const attendanceRate = accepted.length > 0 ? Math.round((attended.length / accepted.length) * 100) : 0;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  [...created, ...accepted].forEach(a => {
    categoryMap[a.category] = (categoryMap[a.category] || 0) + 1;
  });
  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];

  // Monthly activity (last 6 months)
  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const count = activities.filter(a => {
      const ad = new Date(a.date);
      return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear() &&
        (a.creatorId === currentUserId || a.invitees.some(inv => inv.userId === currentUserId && inv.status === "accepted"));
    }).length;
    months.push({ label, count });
  }
  const maxMonth = Math.max(...months.map(m => m.count), 1);

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      {/* Header */}
      <div className="pt-[52px] px-6 pb-6 relative">
        <GlowOrb color="hsl(var(--squad-green))" size={220} top="-50px" right="-60px" />
        <div className="relative z-10">
          <p className="text-muted-foreground text-[13px] mb-0.5">Your</p>
          <p className="font-display text-[22px] font-extrabold tracking-tight">Stats & Insights 📊</p>
        </div>
      </div>

      <div className="px-6 flex flex-col gap-5">
        {/* Attendance Rate — hero stat */}
        <div className="relative p-6 rounded-2xl overflow-hidden border border-[hsl(var(--squad-green)/0.2)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--squad-green)/0.1)] via-transparent to-transparent" />
          <div className="relative flex items-center gap-5">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none" stroke="hsl(var(--squad-green))" strokeWidth="6"
                  strokeDasharray={`${(attendanceRate / 100) * 188.5} 188.5`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-[20px] font-extrabold text-[hsl(var(--squad-green))]">{attendanceRate}%</span>
              </div>
            </div>
            <div>
              <p className="font-display text-lg font-bold">Attendance Rate</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {attended.length} attended out of {accepted.length} joined
              </p>
            </div>
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Target size={18} />, value: created.length, label: "Created", color: "text-primary" },
            { icon: <CheckCircle2 size={18} />, value: accepted.length, label: "Joined", color: "text-[hsl(var(--squad-green))]" },
            { icon: <XCircle size={18} />, value: declined.length, label: "Declined", color: "text-destructive" },
            { icon: <Clock size={18} />, value: invitedTo.filter(a => a.invitees.some(i => i.userId === currentUserId && i.status === "pending")).length, label: "Pending", color: "text-muted-foreground" },
          ].map(stat => (
            <div key={stat.label} className="p-4 bg-card border border-border rounded-2xl">
              <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
              <p className={`font-display text-[24px] font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Financial summary */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground tracking-widest uppercase">Money Tracker</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-muted-foreground">Total deposited</span>
              <span className="font-display font-bold text-primary">₹{totalDeposited}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-muted-foreground">Refunded</span>
              <span className="font-display font-bold text-[hsl(var(--squad-green))]">₹{totalRefunded}</span>
            </div>
            {pendingRefund > 0 && (
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-muted-foreground">Pending refund</span>
                <span className="font-display font-bold text-foreground">₹{pendingRefund}</span>
              </div>
            )}
          </div>
        </div>

        {/* Monthly activity chart */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Monthly Activity</p>
          </div>
          <div className="flex items-end justify-between gap-2 h-24">
            {months.map(m => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex flex-col items-center justify-end h-16">
                  <div
                    className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-primary to-primary/60 transition-all duration-500"
                    style={{ height: `${(m.count / maxMonth) * 100}%`, minHeight: m.count > 0 ? 6 : 2 }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Favourite category */}
        {topCategory && (
          <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Trophy size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Top Category</p>
              <p className="font-display text-base font-bold capitalize">{topCategory[0]}</p>
              <p className="text-[11px] text-muted-foreground">{topCategory[1]} activities</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
