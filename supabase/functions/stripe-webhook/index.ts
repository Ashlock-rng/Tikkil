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
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.text();

    // If Stripe is not configured, return demo response
    if (!stripeKey || !webhookSecret) {
      return new Response(JSON.stringify({ demo: true, message: "Stripe not configured (demo mode)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const profileId = session.metadata?.profile_id;
      const badgeType = session.metadata?.badge_type;

      if (profileId && badgeType) {
        const amount = (session.amount_total || 0) / 100;

        // Create pending badge record for admin review
        await supabase.from("user_badges").insert({
          profile_id: profileId,
          badge_type: badgeType,
          status: "pending",
          stripe_payment_id: session.payment_intent as string,
          amount_paid: amount,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Webhook error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
