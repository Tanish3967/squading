import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = new Date();

    // Find activities happening in ~1 hour (55-65 min window)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourWindowStart = new Date(oneHourFromNow.getTime() - 5 * 60 * 1000);
    const oneHourWindowEnd = new Date(oneHourFromNow.getTime() + 5 * 60 * 1000);

    // Find activities happening in ~24 hours (23h55m - 24h05m window)
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneDayWindowStart = new Date(oneDayFromNow.getTime() - 5 * 60 * 1000);
    const oneDayWindowEnd = new Date(oneDayFromNow.getTime() + 5 * 60 * 1000);

    // Get upcoming activities
    const { data: activities } = await supabaseAdmin
      .from("activities")
      .select("id, title, date, time, creator_id")
      .eq("status", "upcoming");

    if (!activities?.length) {
      return new Response(JSON.stringify({ reminders_sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get VAPID keys
    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("key, value")
      .in("key", ["vapid_public_key", "vapid_private_key", "vapid_subject"]);

    const cfg: Record<string, string> = {};
    settings?.forEach((s: any) => { cfg[s.key] = s.value; });

    if (!cfg.vapid_public_key || !cfg.vapid_private_key) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      cfg.vapid_subject || "mailto:noreply@squad.app",
      cfg.vapid_public_key,
      cfg.vapid_private_key
    );

    let remindersSent = 0;

    for (const activity of activities) {
      // Parse activity datetime
      const activityDate = new Date(activity.date);
      const [hours, minutes] = (activity.time || "00:00").split(":").map(Number);
      activityDate.setHours(hours, minutes, 0, 0);

      let reminderType: string | null = null;
      if (activityDate >= oneHourWindowStart && activityDate <= oneHourWindowEnd) {
        reminderType = "1h";
      } else if (activityDate >= oneDayWindowStart && activityDate <= oneDayWindowEnd) {
        reminderType = "1d";
      }

      if (!reminderType) continue;

      // Get invitees who accepted
      const { data: invitees } = await supabaseAdmin
        .from("invitees")
        .select("user_id")
        .eq("activity_id", activity.id)
        .eq("status", "accepted");

      const userIds = [
        activity.creator_id,
        ...(invitees?.map((i: any) => i.user_id) || []),
      ];

      // Get push subscriptions
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

      if (!subs?.length) continue;

      const timeLabel = reminderType === "1h" ? "in 1 hour" : "tomorrow";
      const payload = JSON.stringify({
        title: `⏰ ${activity.title} is ${timeLabel}!`,
        body: `Don't forget — your squad activity starts ${timeLabel}.`,
        data: { activityId: activity.id },
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          remindersSent++;
        } catch (_) {
          // Stale subscription — ignore
        }
      }
    }

    return new Response(JSON.stringify({ reminders_sent: remindersSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
