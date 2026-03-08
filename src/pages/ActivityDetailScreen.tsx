import { useState } from "react";
import { ChevronLeft, Calendar, MapPin, Users, X, Check } from "lucide-react";
import { Activity, User, MOCK_USERS, ACTIVITY_CATEGORIES } from "@/lib/mock-data";
import SquadAvatar from "@/components/squad/Avatar";
import StatusPill from "@/components/squad/StatusPill";

interface Props {
  activity: Activity;
  currentUser: User;
  onBack: () => void;
  onUpdateActivity: (a: Activity) => void;
}

export default function ActivityDetailScreen({ activity, currentUser, onBack, onUpdateActivity }: Props) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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

  // Payment screen
  if (showPayment) {
    return (
      <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
        <div className="flex items-center justify-between pt-14 px-6 pb-5">
          <button onClick={() => setShowPayment(false)} className="w-10 h-10 rounded-xl bg-squad-bg3 border border-border flex items-center justify-center text-foreground">
            <ChevronLeft size={22} />
          </button>
          <p className="font-display text-[17px] font-bold">Pay Deposit</p>
          <div className="w-10" />
        </div>

        <div className="px-6 flex flex-col gap-5">
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-3xl bg-squad-phonepe/15 border border-squad-phonepe/30 flex items-center justify-center text-4xl mx-auto mb-4">💸</div>
            <p className="font-display text-xl font-bold mb-1.5">Commitment Deposit</p>
            <p className="text-squad-text2 text-sm leading-relaxed">
              This ₹{activity.deposit} deposit will be refunded after you show up to <strong className="text-foreground">{activity.title}</strong>
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-squad-text3 mb-3">PAYMENT SUMMARY</p>
            {[["Commitment deposit", `₹${activity.deposit}`], ["Platform fee", "₹0"], ["GST", "₹0"]].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b border-border text-sm">
                <span className="text-squad-text2">{l}</span><span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3.5 text-base font-bold">
              <span>Total</span>
              <span className="text-squad-saffron">₹{activity.deposit}</span>
            </div>
          </div>

          <div className="p-3.5 bg-squad-green/[0.06] border border-squad-green/15 rounded-[14px]">
            <p className="text-[13px] text-squad-green leading-relaxed">
              ✅ <strong>100% refund</strong> when the activity host marks you as attended. Usually within 48 hours after the event.
            </p>
          </div>

          <div>
            <p className="text-xs text-squad-text3 mb-2.5 text-center">PAY SECURELY VIA</p>
            <div className="flex items-center gap-2.5 p-4 bg-squad-phonepe/10 border border-squad-phonepe/25 rounded-[14px] mb-3.5">
              <div className="w-9 h-9 rounded-[10px] bg-squad-phonepe flex items-center justify-center text-lg">🟣</div>
              <div>
                <p className="font-semibold text-sm">PhonePe</p>
                <p className="text-xs text-squad-text3">UPI · Wallet · Cards</p>
              </div>
              <div className="ml-auto text-[11px] px-2 py-0.5 bg-squad-green/10 text-squad-green rounded-md border border-squad-green/20">Secured</div>
            </div>
            <button onClick={handlePayment} disabled={paymentProcessing}
              className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-phonepe text-foreground font-medium shadow-phonepe active:scale-[0.97] transition-all w-full disabled:opacity-50">
              {paymentProcessing ? <span className="animate-pulse-soft">Processing…</span> : `Pay ₹${activity.deposit} via PhonePe`}
            </button>
          </div>
          <p className="text-center text-[11px] text-squad-text3">Powered by PhonePe Payment Gateway · PCI-DSS Compliant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      <div className="flex items-center justify-between pt-14 px-6 pb-5">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-squad-bg3 border border-border flex items-center justify-center text-foreground">
          <ChevronLeft size={22} />
        </button>
        <StatusPill status={activity.status === "upcoming" ? "upcoming" : "completed"} />
        <div className="w-10" />
      </div>

      <div className="px-6 flex flex-col gap-5">
        <div>
          <h1 className="font-display text-[26px] font-extrabold tracking-tight leading-tight mb-2.5">{activity.title}</h1>
          <div className="flex items-center gap-2">
            <SquadAvatar name={creator.name} size="sm" />
            <span className="text-[13px] text-squad-text2">Hosted by <strong className="text-foreground">{creator.name}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            [<Calendar size={14} />, "Date", new Date(activity.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })],
            [<Calendar size={14} />, "Time", activity.time],
            [<MapPin size={14} />, "Location", activity.location],
            [<Users size={14} />, "Capacity", `${joinedInvitees.length}/${activity.maxPeople} joined`],
          ].map(([icon, label, val]) => (
            <div key={label as string} className="p-3.5 bg-card border border-border rounded-[14px]">
              <div className="flex items-center gap-1.5 mb-1 text-squad-text2 text-xs">{icon} {label as string}</div>
              <p className="text-sm font-medium">{val as string}</p>
            </div>
          ))}
        </div>

        <div className="p-[18px] bg-squad-saffron/[0.08] border border-squad-saffron/20 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-[13px] text-squad-text2 mb-0.5">Commitment Deposit</p>
            <p className="font-display text-[28px] font-extrabold text-squad-saffron">₹{activity.deposit}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-squad-text3 mb-1">Refunded if you</p>
            <p className="text-xs text-squad-green font-semibold">✅ Show up</p>
          </div>
        </div>

        {activity.description && (
          <div>
            <p className="text-xs text-squad-text3 mb-2">ABOUT THIS ACTIVITY</p>
            <p className="text-sm text-squad-text2 leading-relaxed">{activity.description}</p>
          </div>
        )}

        {/* Invitees */}
        <div>
          <p className="text-xs text-squad-text3 mb-3">INVITEES ({activity.invitees.length})</p>
          <div className="flex flex-col gap-2">
            {activity.invitees.map(invitee => {
              const user = MOCK_USERS.find(u => u.id === invitee.userId)!;
              return (
                <div key={invitee.userId} className="flex items-center gap-3 p-2.5 px-3.5 bg-card rounded-[14px] border border-border">
                  <SquadAvatar name={user.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      <StatusPill status={invitee.status} />
                      {invitee.paid && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-squad-green/10 text-squad-green border border-squad-green/20">💰 Paid</span>}
                      {invitee.attended && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-squad-green/10 text-squad-green border border-squad-green/20">✓ Attended</span>}
                    </div>
                  </div>
                  {isCreator && invitee.status === "accepted" && invitee.paid && (
                    <button onClick={() => handleMarkAttendance(invitee.userId)}
                      className={`px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
                        invitee.attended
                          ? "bg-transparent text-foreground border border-foreground/10"
                          : "bg-squad-green text-primary-foreground shadow-green"
                      }`}>
                      {invitee.attended ? "Undo" : "Mark ✓"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTAs */}
        {!isCreator && myInvite && (
          <div>
            {myInvite.status === "pending" && (
              <div className="flex flex-col gap-2.5">
                <p className="text-[13px] text-squad-text2 text-center">You've been invited! Will you join?</p>
                <div className="flex gap-2.5">
                  <button onClick={handleDecline} className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-transparent text-squad-red border border-squad-red/30 font-medium active:bg-squad-red/10 transition-all">
                    <X size={16} /> Decline
                  </button>
                  <button onClick={handleAccept} className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all">
                    <Check size={16} /> Join & Pay ₹{activity.deposit}
                  </button>
                </div>
              </div>
            )}
            {myInvite.status === "accepted" && !myInvite.paid && (
              <button onClick={() => setShowPayment(true)} className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-phonepe text-foreground font-medium shadow-phonepe active:scale-[0.97] transition-all w-full">
                Complete payment · ₹{activity.deposit}
              </button>
            )}
            {myInvite.status === "accepted" && myInvite.paid && !myInvite.attended && (
              <div className="p-4 bg-squad-green/[0.06] border border-squad-green/15 rounded-[14px] text-center">
                <p className="text-squad-green font-semibold mb-1">✅ You're in! Deposit paid.</p>
                <p className="text-[13px] text-squad-text2">Show up to get ₹{activity.deposit} refunded.</p>
              </div>
            )}
            {myInvite.attended && (
              <div className="animate-pop-in p-5 bg-squad-green/[0.08] border border-squad-green/25 rounded-2xl text-center">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-display text-lg font-bold text-squad-green mb-1">You attended!</p>
                <p className="text-[13px] text-squad-text2">₹{activity.deposit} will be refunded to your PhonePe in 48h.</p>
              </div>
            )}
          </div>
        )}

        {isCreator && activity.status === "upcoming" && (
          <div className="p-4 bg-card border border-border rounded-[14px]">
            <p className="text-[13px] text-squad-text2">👆 Tap "Mark ✓" next to each person who shows up to trigger their refund.</p>
          </div>
        )}
      </div>
    </div>
  );
}
