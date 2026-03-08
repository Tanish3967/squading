import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function getOrCreateVapidKeys() {
  // Check if VAPID keys already exist
  const { data: existing } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", ["vapid_public_key", "vapid_private_key", "vapid_subject"]);

  const settings: Record<string, string> = {};
  existing?.forEach((s: any) => { settings[s.key] = s.value; });

  if (settings.vapid_public_key && settings.vapid_private_key) {
    return {
      publicKey: settings.vapid_public_key,
      privateKey: settings.vapid_private_key,
      subject: settings.vapid_subject || "mailto:noreply@squad.app",
    };
  }

  // Generate new keys
  const vapidKeys = webpush.generateVAPIDKeys();
  const subject = "mailto:noreply@squad.app";

  await supabaseAdmin.from("app_settings").upsert([
    { key: "vapid_public_key", value: vapidKeys.publicKey },
    { key: "vapid_private_key", value: vapidKeys.privateKey },
    { key: "vapid_subject", value: subject },
  ]);

  return { publicKey: vapidKeys.publicKey, privateKey: vapidKeys.privateKey, subject };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "get-key";

    if (action === "get-key") {
      const keys = await getOrCreateVapidKeys();
      return new Response(JSON.stringify({ publicKey: keys.publicKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send") {
      const { user_ids, title, body, data } = await req.json();
      if (!user_ids?.length || !title) {
        return new Response(JSON.stringify({ error: "user_ids and title required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const keys = await getOrCreateVapidKeys();
      webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);

      // Get all subscriptions for the given user_ids
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .in("user_id", user_ids);

      if (!subs?.length) {
        return new Response(JSON.stringify({ sent: 0, reason: "no_subscriptions" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payload = JSON.stringify({ title, body: body || "", data: data || {} });
      let sent = 0;
      const staleIds: string[] = [];

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            staleIds.push(sub.id);
          }
        }
      }

      // Clean up stale subscriptions
      if (staleIds.length) {
        await supabaseAdmin.from("push_subscriptions").delete().in("id", staleIds);
      }

      return new Response(JSON.stringify({ sent, total: subs.length, cleaned: staleIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
