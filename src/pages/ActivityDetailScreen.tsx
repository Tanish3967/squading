import { useState } from "react";
import { ChevronLeft, Calendar, Clock, MapPin, Users, X, Check, Pencil, Trash2, Ban, Share2, CheckCheck, BellRing, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Activity, User, MOCK_USERS, ACTIVITY_CATEGORIES } from "@/lib/mock-data";
import SquadAvatar from "@/components/squad/Avatar";
import StatusPill from "@/components/squad/StatusPill";
import GlowOrb from "@/components/squad/GlowOrb";
import ActivityEditForm from "@/components/squad/ActivityEditForm";
import PaymentScreen from "@/components/squad/PaymentScreen";
import ActivityComments from "@/components/squad/ActivityComments";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  activity: Activity;
  currentUser: User;
  onBack: () => void;
  onUpdateActivity: (a: Activity) => void;
  onDeleteActivity?: (id: string) => void;
}

export default function ActivityDetailScreen({ activity, currentUser, onBack, onUpdateActivity, onDeleteActivity }: Props) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    title: activity.title,
    date: activity.date.split("T")[0],
    time: activity.time,
    location: activity.location,
    deposit: activity.deposit,
    description: activity.description || "",
    maxPeople: activity.maxPeople,
  });

  const creator = MOCK_USERS.find(u => u.id === activity.creatorId) || currentUser;
  const isCreator = activity.creatorId === currentUser.id;
  const catInfo = ACTIVITY_CATEGORIES.find(c => c.id === activity.category);
  const joinedInvitees = activity.invitees.filter(i => i.status === "accepted");
  const myInvite = activity.invitees.find(i => i.userId === currentUser.id);

  const handleAccept = () => {
    onUpdateActivity({
      ...activity,
      invitees: activity.invitees.map(i => i.userId === currentUser.id ? { ...i, status: "accepted" } : i),
    });
    setShowPayment(true);
  };

  const handleDecline = () => {
    onUpdateActivity({
      ...activity,
      invitees: activity.invitees.map(i => i.userId === currentUser.id ? { ...i, status: "declined" } : i),
    });
    setShowDeclineConfirm(false);
  };

  const handlePayment = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      onUpdateActivity({
        ...activity,
        invitees: activity.invitees.map(i => i.userId === currentUser.id ? { ...i, paid: true } : i),
      });
      setPaymentProcessing(false);
      setShowPayment(false);
    }, 2000);
  };

  const handleMarkAttendance = (userId: string) => {
    onUpdateActivity({
      ...activity,
      invitees: activity.invitees.map(i => i.userId === userId ? { ...i, attended: !i.attended } : i),
    });
  };

  const handleSaveEdit = () => {
    onUpdateActivity({
      ...activity,
      title: editForm.title,
      date: editForm.date,
      time: editForm.time,
      location: editForm.location,
      deposit: editForm.deposit,
      description: editForm.description,
      maxPeople: editForm.maxPeople,
    });
    setShowEdit(false);
  };

  const handleCancel = async () => {
    // Mark activity as cancelled
    onUpdateActivity({ ...activity, status: "cancelled" });
    setShowCancelConfirm(false);

    // Create refund notifications for all paid invitees
    const paidInvitees = activity.invitees.filter(i => i.paid);
    if (paidInvitees.length > 0) {
      const notifications = paidInvitees.map(inv => ({
        user_id: inv.userId,
        activity_id: activity.id,
        type: "refund",
        title: "Activity Cancelled — Refund Incoming",
        body: `"${activity.title}" was cancelled by the host. Your ₹${activity.deposit} deposit will be refunded.`,
      }));
      await supabase.from("notifications").insert(notifications);
    }
    toast.success("Activity cancelled. Paid invitees will be notified about refunds.");
  };

  const handleDelete = () => {
    onDeleteActivity?.(activity.id);
    setShowDeleteConfirm(false);
  };

  const setEdit = (key: string, val: string | number) => setEditForm(f => ({ ...f, [key]: val }));

  if (showEdit) {
    return <ActivityEditForm editForm={editForm} onUpdate={setEdit} onSave={handleSaveEdit} onCancel={() => setShowEdit(false)} />;
  }

  if (showPayment) {
    return <PaymentScreen deposit={activity.deposit} activityTitle={activity.title} processing={paymentProcessing} onPay={handlePayment} onBack={() => setShowPayment(false)} />;
  }

  const dateObj = new Date(activity.date);
  const dayName = dateObj.toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const capacityPercent = Math.round((joinedInvitees.length / activity.maxPeople) * 100);

  return (
    <div className="min-h-screen flex flex-col pb-24 animate-fade-up">
      {/* Hero Header */}
      <div className="relative pt-12 pb-8 px-6 overflow-hidden">
        <GlowOrb color="hsl(var(--primary))" size={350} top="-100px" right="-120px" />
        <GlowOrb color="hsl(var(--squad-green))" size={200} top="60px" right="200px" />

        {/* Nav bar */}
        <div className="flex items-center justify-between relative z-10 mb-8">
          <button onClick={onBack} className="w-11 h-11 rounded-2xl bg-background/60 backdrop-blur-xl border border-border flex items-center justify-center text-foreground active:scale-95 transition-transform">
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const joinUrl = `${window.location.origin}/join/${activity.id}`;
                navigator.clipboard.writeText(joinUrl).then(() => {
                  toast.success("Invite link copied to clipboard!");
                });
              }}
              className="w-11 h-11 rounded-2xl bg-background/60 backdrop-blur-xl border border-border flex items-center justify-center text-foreground active:scale-95 transition-transform"
            >
              <Share2 size={16} />
            </button>
            {isCreator && activity.status === "upcoming" && (
              <>
                <button onClick={() => setShowEdit(true)} className="w-11 h-11 rounded-2xl bg-background/60 backdrop-blur-xl border border-border flex items-center justify-center text-foreground active:scale-95 transition-transform">
                  <Pencil size={16} />
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="w-11 h-11 rounded-2xl bg-destructive/10 backdrop-blur-xl border border-destructive/20 flex items-center justify-center text-destructive active:scale-95 transition-transform">
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Category & Status */}
        <div className="flex items-center gap-2.5 mb-4 relative z-10">
        {catInfo && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              {catInfo.icon} {catInfo.label}
            </span>
          )}
          <StatusPill status={activity.status === "upcoming" ? "upcoming" : activity.status === "cancelled" ? "cancelled" : "completed"} />
        </div>

        {/* Title */}
        <h1 className="font-display text-[32px] font-extrabold tracking-tight leading-[1.1] mb-4 relative z-10">
          {activity.title}
        </h1>

        {/* Host */}
        <div className="flex items-center gap-3 relative z-10">
          <SquadAvatar name={creator.name} size="sm" />
          <div>
            <p className="text-xs text-muted-foreground">Hosted by</p>
            <p className="text-sm font-semibold">{creator.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 flex flex-col gap-5">
        {/* Cancelled banner */}
        {activity.status === "cancelled" && (
          <div className="p-5 bg-destructive/[0.06] border border-destructive/15 rounded-2xl text-center animate-fade-up">
            <p className="text-destructive font-display font-bold text-lg">🚫 Cancelled</p>
            <p className="text-muted-foreground text-xs mt-1">This activity has been cancelled by the host</p>
          </div>
        )}

        {/* Cancel/Delete confirmations */}
        {showCancelConfirm && (
          <div className="p-5 bg-card border border-destructive/20 rounded-2xl animate-fade-up">
            <p className="text-sm font-bold mb-1">Cancel this activity?</p>
            <p className="text-[13px] text-muted-foreground mb-4">All invitees will be notified. Paid deposits will be refunded.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium">Keep it</button>
              <button onClick={handleCancel} className="flex-1 py-2.5 rounded-xl bg-destructive text-primary-foreground text-sm font-medium">Yes, cancel</button>
            </div>
          </div>
        )}
        {showDeleteConfirm && (
          <div className="p-5 bg-card border border-destructive/20 rounded-2xl animate-fade-up">
            <p className="text-sm font-bold mb-1">Delete forever?</p>
            <p className="text-[13px] text-muted-foreground mb-4">This cannot be undone. All data will be permanently removed.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium">Keep it</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-destructive text-primary-foreground text-sm font-medium">Delete forever</button>
            </div>
          </div>
        )}

        {/* Info strips — vertical timeline style */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">{dayName}</p>
              <p className="text-[15px] font-semibold">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Time</p>
              <p className="text-[15px] font-semibold">{activity.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Location</p>
              <p className="text-[15px] font-semibold">{activity.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-muted-foreground">Capacity</p>
              <p className="text-[15px] font-semibold">{joinedInvitees.length} / {activity.maxPeople} joined</p>
            </div>
            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${capacityPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Deposit card — large prominent */}
        <div className="relative p-6 rounded-2xl overflow-hidden border border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.12] via-transparent to-[hsl(var(--squad-green)/0.06)]" />
          <div className="relative flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1.5">Commitment Deposit</p>
              <p className="font-display text-[36px] font-extrabold text-primary leading-none">₹{activity.deposit}</p>
            </div>
            <div className="text-right pb-1">
              <p className="text-[11px] text-muted-foreground mb-1">Refunded when you</p>
              <p className="text-sm text-[hsl(var(--squad-green))] font-bold">✅ Show up</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2.5">About</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{activity.description}</p>
          </div>
        )}

        {/* Creator cancel button */}
        {isCreator && activity.status === "upcoming" && (
          <button onClick={() => setShowCancelConfirm(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors">
            <Ban size={15} /> Cancel Activity
          </button>
        )}

        {/* Invitees */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Squad ({activity.invitees.length})</p>
            <div className="flex -space-x-2">
              {joinedInvitees.slice(0, 5).map(inv => {
                const u = MOCK_USERS.find(mu => mu.id === inv.userId);
                return <div key={inv.userId} className="w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold">{u?.name?.[0] || "?"}</div>;
              })}
              {joinedInvitees.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">+{joinedInvitees.length - 5}</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {activity.invitees.map(invitee => {
              const user = MOCK_USERS.find(u => u.id === invitee.userId) || { id: invitee.userId, name: "Squad Member", phone: "", avatar: "SM" };
              return (
                <div key={invitee.userId} className="flex items-center gap-3 p-3 px-4 bg-card rounded-2xl border border-border">
                  <SquadAvatar name={user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap">
                      <StatusPill status={invitee.status} />
                      {invitee.paid && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[hsl(var(--squad-green)/0.1)] text-[hsl(var(--squad-green))] border border-[hsl(var(--squad-green)/0.2)]">💰 Paid</span>}
                      {invitee.attended && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[hsl(var(--squad-green)/0.1)] text-[hsl(var(--squad-green))] border border-[hsl(var(--squad-green)/0.2)]">✓ Attended</span>}
                    </div>
                  </div>
                  {isCreator && invitee.status === "accepted" && invitee.paid && (
                    <button onClick={() => handleMarkAttendance(invitee.userId)}
                      className={`px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                        invitee.attended
                          ? "bg-transparent text-foreground border border-border"
                          : "bg-[hsl(var(--squad-green))] text-primary-foreground shadow-green"
                      }`}>
                      {invitee.attended ? "Undo" : "Mark ✓"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Creator tip */}
        {isCreator && activity.status === "upcoming" && (
          <div className="p-4 bg-primary/[0.06] border border-primary/15 rounded-2xl text-center">
            <p className="text-[13px] text-muted-foreground">👆 Tap <strong className="text-foreground">"Mark ✓"</strong> next to each person who shows up to trigger their refund.</p>
          </div>
        )}

        {/* Invitee CTAs */}
        {!isCreator && myInvite && activity.status === "upcoming" && (
          <div>
            {myInvite.status === "pending" && (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-muted-foreground text-center">You've been invited! Will you join?</p>

                {/* Decline confirmation */}
                {showDeclineConfirm && (
                  <div className="p-5 bg-card border border-destructive/20 rounded-2xl animate-fade-up">
                    <p className="text-sm font-bold mb-1">Decline this invite?</p>
                    <p className="text-[13px] text-muted-foreground mb-4">You won't be able to join this activity afterwards.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDeclineConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium">Go back</button>
                      <button onClick={handleDecline} className="flex-1 py-2.5 rounded-xl bg-destructive text-primary-foreground text-sm font-medium">Yes, decline</button>
                    </div>
                  </div>
                )}

                {!showDeclineConfirm && (
                  <div className="flex gap-2.5">
                    <button onClick={() => setShowDeclineConfirm(true)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-transparent text-destructive border border-destructive/30 font-medium active:bg-destructive/10 transition-all">
                      <X size={16} /> Decline
                    </button>
                    <button onClick={handleAccept} className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all">
                      <Check size={16} /> Join & Pay ₹{activity.deposit}
                    </button>
                  </div>
                )}
              </div>
            )}
            {myInvite.status === "accepted" && !myInvite.paid && (
              <button onClick={() => setShowPayment(true)} className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[hsl(var(--squad-phonepe))] text-foreground font-medium shadow-phonepe active:scale-[0.97] transition-all w-full">
                Complete payment · ₹{activity.deposit}
              </button>
            )}
            {myInvite.status === "accepted" && myInvite.paid && !myInvite.attended && (
              <div className="p-5 bg-[hsl(var(--squad-green)/0.06)] border border-[hsl(var(--squad-green)/0.15)] rounded-2xl text-center">
                <p className="text-[hsl(var(--squad-green))] font-bold mb-1">✅ You're in! Deposit paid.</p>
                <p className="text-[13px] text-muted-foreground">Show up to get ₹{activity.deposit} refunded.</p>
              </div>
            )}
            {myInvite.attended && (
              <div className="animate-pop-in p-6 bg-[hsl(var(--squad-green)/0.08)] border border-[hsl(var(--squad-green)/0.25)] rounded-2xl text-center">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-display text-lg font-bold text-[hsl(var(--squad-green))] mb-1">You attended!</p>
                <p className="text-[13px] text-muted-foreground">₹{activity.deposit} will be refunded to your PhonePe in 48h.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
