import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@14.25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

const BADGE_PRICES: Record<string, { amount: number; name: string }> = {
  celebrity: { amount: 800, name: "Celebrity Verification Badge (Yellow)" },
  adfree: { amount: 500, name: "Ad-Free Badge (Blue)" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { badgeType, profileId, origin } = await req.json();

    if (!badgeType || !profileId) {
      return new Response(JSON.stringify({ error: "badgeType and profileId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!BADGE_PRICES[badgeType]) {
      return new Response(JSON.stringify({ error: "Invalid badge type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceInfo = BADGE_PRICES[badgeType];
    const successUrl = `${origin || "https://tikkil.app"}?payment=success&badge=${badgeType}`;
    const cancelUrl = `${origin || "https://tikkil.app"}?payment=cancelled`;

    // If Stripe is not configured, create a pending badge record directly (demo mode)
    if (!stripeKey) {
      const { data: existing } = await supabase
        .from("user_badges")
        .select("*")
        .eq("profile_id", profileId)
        .eq("badge_type", badgeType)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({
          demo: true,
          message: "Badge request already pending review",
          badgeId: existing.id,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data, error } = await supabase
        .from("user_badges")
        .insert({
          profile_id: profileId,
          badge_type: badgeType,
          status: "pending",
          amount_paid: priceInfo.amount / 100,
        })
        .select("*")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        demo: true,
        message: "Stripe not configured. Badge request submitted for admin review (demo mode).",
        badgeId: data.id,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Real Stripe checkout
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { profileId },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", profileId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: priceInfo.name },
            unit_amount: priceInfo.amount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        profile_id: profileId,
        badge_type: badgeType,
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
