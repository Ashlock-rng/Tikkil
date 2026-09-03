import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/admin-api", "");
    const { method } = req;

    // GET /badges — list all pending badge requests
    if (method === "GET" && path === "/badges") {
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, profile:profiles(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /badges/approve — approve a badge
    if (method === "POST" && path === "/badges/approve") {
      const { badgeId, adminId } = await req.json();

      const { data: badge } = await supabase
        .from("user_badges")
        .select("*")
        .eq("id", badgeId)
        .maybeSingle();

      if (!badge) {
        return new Response(JSON.stringify({ error: "Badge not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update badge status
      await supabase
        .from("user_badges")
        .update({ status: "approved", reviewed_by: adminId, reviewed_at: new Date().toISOString() })
        .eq("id", badgeId);

      // Update profile flags
      if (badge.badge_type === "celebrity") {
        await supabase
          .from("profiles")
          .update({ is_celebrity: true, verified: true })
          .eq("id", badge.profile_id);
      } else if (badge.badge_type === "adfree") {
        await supabase
          .from("profiles")
          .update({ is_adfree: true })
          .eq("id", badge.profile_id);
      }

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: adminId,
        action: "approve_badge",
        target_profile_id: badge.profile_id,
        target_badge_id: badgeId,
        notes: `Approved ${badge.badge_type} badge`,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /badges/reject — reject a badge
    if (method === "POST" && path === "/badges/reject") {
      const { badgeId, adminId, reason } = await req.json();

      const { data: badge } = await supabase
        .from("user_badges")
        .select("*")
        .eq("id", badgeId)
        .maybeSingle();

      if (!badge) {
        return new Response(JSON.stringify({ error: "Badge not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("user_badges")
        .update({ status: "rejected", reviewed_by: adminId, reviewed_at: new Date().toISOString() })
        .eq("id", badgeId);

      await supabase.from("admin_actions").insert({
        admin_id: adminId,
        action: "reject_badge",
        target_profile_id: badge.profile_id,
        target_badge_id: badgeId,
        notes: reason || "Rejected by admin",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /users — list all users
    if (method === "GET" && path === "/users") {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /actions — admin audit log
    if (method === "GET" && path === "/actions") {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*, admin:profiles!admin_id(*)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /stats — dashboard stats
    if (method === "GET" && path === "/stats") {
      const [{ count: badgeCount }, { count: userCount }, { count: pendingBadges }, { count: liveCount }] = await Promise.all([
        supabase.from("user_badges").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_badges").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("live_streams").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);

      return new Response(JSON.stringify({
        totalBadges: badgeCount || 0,
        totalUsers: userCount || 0,
        pendingBadges: pendingBadges || 0,
        activeLiveStreams: liveCount || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
