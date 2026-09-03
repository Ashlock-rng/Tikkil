import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { AIChat } from "@/lib/types";

export default function AIChatPage() {
  const [messages, setMessages] = useState<AIChat[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function loadHistory() {
    const { data } = await supabase
      .from("ai_chats")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!data || data.length === 0) {
      setMessages([
        {
          id: "welcome",
          session_id: sessionId,
          role: "assistant",
          content: "Hi! I am Tikkil AI, your personal assistant. I can help you discover content, answer questions, or just chat. What would you like to explore?",
          created_at: new Date().toISOString(),
        },
      ]);
    } else {
      const { data: all } = await supabase
        .from("ai_chats")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (all) setMessages(all as AIChat[]);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: AIChat = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            message: userMsg.content,
            sessionId,
            history: messages.filter((m) => m.id !== "welcome").map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const aiMsg: AIChat = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "assistant",
        content: data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const aiMsg: AIChat = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "assistant",
        content: "I am having trouble connecting right now. Please try again in a moment.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }
    setLoading(false);
  }

  const suggestions = [
    "Recommend me some content",
    "What is trending on Tikkil?",
    "How do statuses work?",
    "Tell me about the Watch tab",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20 flex flex-col">
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00d9a3] to-[#0099ff] flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Tikkil AI</h1>
            <p className="text-xs text-[#00d9a3]">Online · Ready to chat</p>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-4 space-y-3"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {msg.role === "assistant" ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00d9a3] to-[#0099ff] flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <User size={14} className="text-gray-300" />
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#00d9a3] text-black rounded-tr-sm"
                  : "bg-white/10 text-gray-100 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00d9a3] to-[#0099ff] flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {messages.length <= 1 && (
          <div className="pt-4">
            <p className="text-xs text-gray-500 mb-2 text-center">Try asking</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-16 bg-[#0a0a0f]/90 backdrop-blur-lg border-t border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Message Tikkil AI..."
            className="flex-1 px-4 py-2.5 rounded-full bg-white/10 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-[#00d9a3]/50 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-[#00d9a3] flex items-center justify-center disabled:opacity-40 hover:bg-[#00d9a3]/90 transition-colors shrink-0"
          >
            <Send size={17} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
