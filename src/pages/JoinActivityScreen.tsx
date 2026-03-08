import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVITY_CATEGORIES } from "@/lib/mock-data";
import SquadAvatar from "@/components/squad/Avatar";
import GlowOrb from "@/components/squad/GlowOrb";

interface PublicActivity {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  deposit: number;
  max_people: number;
  description: string | null;
  status: string;
  creator_name: string;
  accepted_count: number;
}

export default function JoinActivityScreen() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<PublicActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activityId) return;

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-activity?id=${activityId}`;
    fetch(url, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setActivity(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load activity");
        setLoading(false);
      });
  }, [activityId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-squad-saffron animate-pulse-soft text-xl font-display font-bold">
          Loading…
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="font-display text-xl font-bold mb-2">Activity not found</p>
        <p className="text-squad-text2 text-sm mb-6">
          This link may have expired or the activity may have been cancelled.
        </p>
        <button
          onClick={() => navigate("/")}
          className="py-3 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium active:scale-[0.97] transition-all"
        >
          Go to Squad
        </button>
      </div>
    );
  }

  const catInfo = ACTIVITY_CATEGORIES.find((c) => c.id === activity.category);
  const dateStr = new Date(activity.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const spotsLeft = activity.max_people - activity.accepted_count;
  const isFull = spotsLeft <= 0;
  const isPast = activity.status === "completed" || activity.status === "cancelled";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">
        {/* Hero */}
        <div className="relative pt-14 px-6 pb-8">
          <GlowOrb color="hsl(25 100% 50%)" size={300} top="-80px" right="-100px" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-squad-saffron/10 border border-squad-saffron/20 flex items-center justify-center text-3xl">
                {catInfo?.icon || "🎯"}
              </div>
              <div>
                <p className="text-xs text-squad-saffron font-semibold uppercase tracking-wider">
                  You're invited!
                </p>
                <h1 className="font-display text-2xl font-extrabold tracking-tight leading-tight">
                  {activity.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <SquadAvatar name={activity.creator_name} size="sm" />
              <span className="text-sm text-squad-text2">
                Hosted by{" "}
                <strong className="text-foreground">{activity.creator_name}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 flex flex-col gap-4 flex-1">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              [<Calendar size={14} />, "Date", dateStr],
              [<Calendar size={14} />, "Time", activity.time],
              [<MapPin size={14} />, "Location", activity.location],
              [
                <Users size={14} />,
                "Spots",
                isFull
                  ? "Full!"
                  : `${spotsLeft} of ${activity.max_people} left`,
              ],
            ].map(([icon, label, val]) => (
              <div
                key={label as string}
                className="p-3.5 bg-card border border-border rounded-[14px]"
              >
                <div className="flex items-center gap-1.5 mb-1 text-squad-text2 text-xs">
                  {icon} {label as string}
                </div>
                <p className="text-sm font-medium">{val as string}</p>
              </div>
            ))}
          </div>

          {/* Deposit badge */}
          <div className="p-[18px] bg-squad-saffron/[0.08] border border-squad-saffron/20 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-[13px] text-squad-text2 mb-0.5">
                Commitment Deposit
              </p>
              <p className="font-display text-[28px] font-extrabold text-squad-saffron">
                ₹{activity.deposit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-squad-text3 mb-1">
                Refunded if you
              </p>
              <p className="text-xs text-squad-green font-semibold">
                ✅ Show up
              </p>
            </div>
          </div>

          {/* Description */}
          {activity.description && (
            <div>
              <p className="text-xs text-squad-text3 mb-2">ABOUT THIS ACTIVITY</p>
              <p className="text-sm text-squad-text2 leading-relaxed">
                {activity.description}
              </p>
            </div>
          )}

          {/* How it works */}
          <div className="p-4 bg-squad-green/[0.06] border border-squad-green/15 rounded-[14px]">
            <p className="text-[13px] text-squad-green font-semibold mb-2">
              🔐 How it works
            </p>
            <ol className="text-[13px] text-squad-text2 leading-relaxed space-y-1.5 list-decimal list-inside">
              <li>Sign up for Squad (takes 30 seconds)</li>
              <li>Pay ₹{activity.deposit} commitment deposit</li>
              <li>Show up to the activity</li>
              <li>Get your deposit back! 🎉</li>
            </ol>
          </div>

          {/* CTA */}
          <div className="mt-auto pb-10 pt-4">
            {isPast ? (
              <div className="p-4 bg-squad-bg3 border border-border rounded-[14px] text-center">
                <p className="text-squad-text2 text-sm">
                  This activity has already {activity.status === "cancelled" ? "been cancelled" : "ended"}.
                </p>
              </div>
            ) : isFull ? (
              <div className="p-4 bg-squad-bg3 border border-border rounded-[14px] text-center">
                <p className="text-squad-text2 text-sm">
                  This activity is full. Check back later!
                </p>
              </div>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-semibold text-base shadow-saffron active:scale-[0.97] transition-all w-full"
              >
                Join & Pay ₹{activity.deposit}
                <ArrowRight size={18} />
              </button>
            )}
            <p className="text-center text-[11px] text-squad-text3 mt-3">
              No-show? Deposit is forfeited. Show up and it's refunded within 48h.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
