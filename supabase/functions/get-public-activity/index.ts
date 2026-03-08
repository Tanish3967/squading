import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const activityId = url.searchParams.get("id");

    if (!activityId) {
      return new Response(
        JSON.stringify({ error: "Missing activity ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: activity, error } = await supabase
      .from("activities")
      .select("id, title, category, date, time, location, deposit, max_people, description, status, creator_id")
      .eq("id", activityId)
      .single();

    if (error || !activity) {
      return new Response(
        JSON.stringify({ error: "Activity not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get creator name
    const { data: creator } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", activity.creator_id)
      .single();

    // Get invitee count
    const { count } = await supabase
      .from("invitees")
      .select("*", { count: "exact", head: true })
      .eq("activity_id", activityId)
      .eq("status", "accepted");

    return new Response(
      JSON.stringify({
        ...activity,
        creator_name: creator?.name || "Squad Member",
        accepted_count: count || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
