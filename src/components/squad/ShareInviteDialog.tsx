import { useState } from "react";
import { X, Copy, Check, Share2 } from "lucide-react";
import { ACTIVITY_CATEGORIES } from "@/lib/mock-data";

interface ShareInviteDialogProps {
  activity: {
    id: string;
    title: string;
    category: string;
    date: string;
    time: string;
    location: string;
    deposit: number;
  };
  inviteeNames: string[];
  onClose: () => void;
}

export default function ShareInviteDialog({ activity, inviteeNames, onClose }: ShareInviteDialogProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${activity.id}`;
  const categoryIcon = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category)?.icon || "🎯";
  const dateStr = activity.date
    ? new Date(activity.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    : "";

  const shareText = `🎯 You're invited to "${activity.title}"!\n\n${categoryIcon} ${activity.location}\n📅 ${dateStr} at ${activity.time}\n💰 Deposit: ₹${activity.deposit}\n\nJoin here: ${inviteUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: activity.title, text: shareText, url: inviteUrl });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card border-t border-border rounded-t-[24px] p-6 pb-10 animate-fade-up">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-squad-bg3 flex items-center justify-center text-squad-text2">
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-squad-green/10 border border-squad-green/20 flex items-center justify-center text-2xl">✅</div>
          <div>
            <p className="font-display text-lg font-bold">Activity Created!</p>
            <p className="text-sm text-squad-text2">Share the invite with your squad</p>
          </div>
        </div>

        {/* Activity summary */}
        <div className="bg-squad-bg3 border border-border rounded-[14px] p-4 mb-5">
          <p className="font-medium text-sm">{categoryIcon} {activity.title}</p>
          <p className="text-xs text-squad-text2 mt-1">{dateStr} · {activity.location} · ₹{activity.deposit} deposit</p>
          {inviteeNames.length > 0 && (
            <p className="text-xs text-squad-text3 mt-2">
              Inviting: {inviteeNames.join(", ")}
            </p>
          )}
        </div>

        {/* Share buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2.5 py-3.5 rounded-[14px] bg-[#25D366] text-white font-medium text-sm active:scale-[0.97] transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Share via WhatsApp
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2.5 py-3.5 rounded-[14px] bg-squad-bg3 border border-border text-foreground font-medium text-sm active:scale-[0.97] transition-all"
          >
            {copied ? <Check size={18} className="text-squad-green" /> : <Copy size={18} />}
            {copied ? "Copied!" : "Copy Invite Text"}
          </button>

          {typeof navigator.share === "function" && (
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2.5 py-3.5 rounded-[14px] bg-squad-bg3 border border-border text-foreground font-medium text-sm active:scale-[0.97] transition-all"
            >
              <Share2 size={18} />
              More sharing options
            </button>
          )}

          <button
            onClick={onClose}
            className="text-sm text-squad-text3 mt-1 py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
