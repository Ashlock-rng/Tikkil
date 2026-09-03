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
    const { message, sessionId, history } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sid = sessionId || crypto.randomUUID();

    // Build conversation context from history (last 10 messages)
    const contextMessages = (history || [])
      .slice(-10)
      .map((h: { role: string; content: string }) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      }));

    contextMessages.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Try Gemini API
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    let aiResponse: string;

    if (geminiKey) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: contextMessages,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Gemini API error: ${errText}`);
      }

      const geminiData = await geminiRes.json();
      aiResponse =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I could not generate a response. Please try again.";
    } else {
      // Fallback: contextual responses when no API key is configured
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
        aiResponse = "Hey there! I am Tikkil AI. I can help you discover content, answer questions, or just chat. What is on your mind?";
      } else if (lowerMsg.includes("reel") || lowerMsg.includes("video")) {
        aiResponse = "Looking for content? Check out the Reels tab for short-form videos, or the Watch tab for longer content. You will find curated picks from creators across film, music, food, and more.";
      } else if (lowerMsg.includes("status") || lowerMsg.includes("story")) {
        aiResponse = "Status updates work like WhatsApp stories - they disappear after 24 hours. Head to the Status tab to see what your friends are sharing right now.";
      } else if (lowerMsg.includes("post") || lowerMsg.includes("feed")) {
        aiResponse = "The Home tab is your main feed - a mix of posts, photos, and updates from creators you follow. You can like, comment, and repost from there.";
      } else if (lowerMsg.includes("recommend") || lowerMsg.includes("suggest")) {
        aiResponse = "Based on trending content right now, I would suggest checking out Sophia Moon's 30-second ice cream reel and Leo Wild's wildlife photography video. Both are going viral on Tikkil today.";
      } else if (lowerMsg.includes("who") && lowerMsg.includes("you")) {
        aiResponse = "I am Tikkil AI, your in-app assistant. I can help you navigate the app, discover content, answer questions about features, or just have a conversation. Think of me as your guide to everything Tikkil.";
      } else if (lowerMsg.includes("thank")) {
        aiResponse = "You are welcome! Anything else I can help you with?";
      } else {
        aiResponse = `That is interesting! Tell me more about "${message}". I am here to chat, help you discover content, or answer questions about Tikkil. What would you like to explore?`;
      }
    }

    // Persist to database
    await supabase.from("ai_chats").insert([
      { session_id: sid, role: "user", content: message },
      { session_id: sid, role: "assistant", content: aiResponse },
    ]);

    return new Response(JSON.stringify({ response: aiResponse, sessionId: sid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
