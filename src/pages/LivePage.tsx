import { useState } from "react";
import { Radio, Users, Heart, MessageCircle, Share2, X, Gift, Sparkles, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { LiveStream, LiveGift } from "@/lib/types";
import { formatCount, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user-context";
import Avatar from "@/components/Avatar";
import BadgeIcons from "@/components/BadgeIcons";

const MIN_FOLLOWERS_FOR_LIVE = 5000;

const GIFT_PRESETS = [10, 25, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];

export default function LivePage() {
  const { t } = useI18n();
  const { user, refreshUser } = useUser();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<LiveStream | null>(null);
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState("");
  const [giftSending, setGiftSending] = useState(false);
  const [giftSent, setGiftSent] = useState(false);
  const [recentGifts, setRecentGifts] = useState<LiveGift[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    loadStreams();
  }, []);

  useEffect(() => {
    if (viewing) {
      loadGifts();
      // Simulate some chat messages
      setChatMessages([
        { id: "1", sender: "Sophia Moon", text: "This stream is amazing!" },
        { id: "2", sender: "Leo Wild", text: "Greetings from Switzerland!" },
        { id: "3", sender: "Aria Sky", text: "Can you show the view again?" },
      ]);
    }
  }, [viewing]);

  async function loadStreams() {
    const { data } = await supabase
      .from("live_streams")
      .select("*, host:profiles(*)")
      .eq("is_active", true)
      .order("viewer_count", { ascending: false });
    if (data) setStreams(data as LiveStream[]);
    setLoading(false);
  }

  async function loadGifts() {
    if (!viewing) return;
    const { data } = await supabase
      .from("live_gifts")
      .select("*, sender:profiles!sender_id(*)")
      .eq("stream_id", viewing.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setRecentGifts(data as LiveGift[]);
  }

  async function startLive() {
    if (!user || !liveTitle.trim()) return;
    const { data } = await supabase
      .from("live_streams")
      .insert({
        host_id: user.id,
        title: liveTitle.trim(),
        is_active: true,
      })
      .select("*, host:profiles(*)")
      .single();
    if (data) {
      setStreams((prev) => [data as LiveStream, ...prev]);
      setViewing(data as LiveStream);
      setShowGoLiveModal(false);
      setLiveTitle("");
    }
  }

  async function endStream() {
    if (!viewing) return;
    await supabase
      .from("live_streams")
      .update({ is_active: false })
      .eq("id", viewing.id);
    setViewing(null);
    loadStreams();
  }

  async function sendGift() {
    if (!user || !viewing) return;
    const amount = customAmount ? parseFloat(customAmount) : giftAmount;
    if (amount < 10 || amount > 100000) return;

    setGiftSending(true);
    const platformShare = amount * 0.5;
    const receiverShare = amount * 0.5;

    const { data } = await supabase
      .from("live_gifts")
      .insert({
        stream_id: viewing.id,
        sender_id: user.id,
        receiver_id: viewing.host_id,
        amount,
        platform_share: platformShare,
        receiver_share: receiverShare,
        status: "holding",
      })
      .select("*, sender:profiles!sender_id(*)")
      .single();

    if (data) {
      setRecentGifts((prev) => [data as LiveGift, ...prev]);
      // Update host's pending balance
      await supabase
        .from("profiles")
        .update({
          gift_balance_pending: (viewing.host?.gift_balance_pending || 0) + receiverShare,
        })
        .eq("id", viewing.host_id);
      await refreshUser();
      setGiftSent(true);
      setTimeout(() => {
        setGiftSent(false);
        setShowGiftModal(false);
        setCustomAmount("");
      }, 1500);
    }
    setGiftSending(false);
  }

  function sendChat() {
    if (!chatInput.trim() || !user) return;
    setChatMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender: user.display_name, text: chatInput.trim() },
    ]);
    setChatInput("");
  }

  const canGoLive = user?.verified && (user.followers_count >= MIN_FOLLOWERS_FOR_LIVE || user.is_celebrity);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-[#00d9a3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Live viewer
  if (viewing) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Stream area */}
        <div className="relative flex-1 flex items-center justify-center bg-gradient-to-b from-red-950/20 to-black">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Radio size={36} className="text-red-500" />
            </div>
            <p className="text-gray-400 text-sm">Live stream in progress</p>
          </div>

          {/* Live badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-bold uppercase">Live</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur">
              <Users size={13} className="text-white" />
              <span className="text-white text-xs font-medium">{formatCount(viewing.viewer_count)}</span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={() => setViewing(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X size={18} className="text-white" />
          </button>

          {/* Recent gifts ticker */}
          {recentGifts.length > 0 && (
            <div className="absolute top-14 right-4 max-w-[200px] space-y-1">
              {recentGifts.slice(0, 3).map((g) => (
                <div
                  key={g.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/30 to-orange-500/30 backdrop-blur border border-yellow-500/30 animate-fadeIn"
                >
                  <Gift size={12} className="text-yellow-400" />
                  <span className="text-xs text-white font-medium truncate">
                    {g.sender?.display_name}
                  </span>
                  <span className="text-xs text-yellow-400 font-bold">${formatCurrency(g.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Chat overlay */}
          <div className="absolute bottom-24 left-0 right-16 px-4 max-h-32 overflow-y-auto scrollbar-hide space-y-1">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[#00d9a3]">{msg.sender}:</span>
                <span className="text-gray-200">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Host info */}
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <div className="flex items-center gap-3">
              {viewing.host && <Avatar profile={viewing.host} size={44} />}
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm">{viewing.host?.display_name}</span>
                  <BadgeIcons
                    verified={viewing.host?.verified}
                    isCelebrity={viewing.host?.is_celebrity}
                    size={12}
                  />
                </div>
                <span className="text-xs text-gray-400">{viewing.title}</span>
              </div>
              <button className="ml-auto px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold">
                {t("follow")}
              </button>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="sticky bottom-16 bg-black/90 backdrop-blur border-t border-white/10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder={t("type_message")}
              className="flex-1 px-4 py-2.5 rounded-full bg-white/10 text-white text-sm placeholder-gray-500 outline-none border border-white/10"
            />
            <button
              onClick={sendChat}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Send size={16} className="text-white" />
            </button>
            {viewing.host_id !== user?.id && (
              <button
                onClick={() => setShowGiftModal(true)}
                className="flex items-center gap-1 px-3 py-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Gift size={16} />
                Gift
              </button>
            )}
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Heart size={18} className="text-white" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Share2 size={16} className="text-white" />
            </button>
            {viewing.host_id === user?.id && (
              <button
                onClick={endStream}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
              >
                {t("end_stream")}
              </button>
            )}
          </div>
        </div>

        {/* Gift modal */}
        {showGiftModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="max-w-sm w-full bg-gradient-to-b from-[#1a1505] to-[#0a0a0f] rounded-3xl border border-yellow-500/20 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Gift size={20} className="text-black" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Send a Gift</h2>
                    <p className="text-xs text-gray-400">To {viewing.host?.display_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>

              {giftSent ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-3 animate-bounce">
                    <Gift size={32} className="text-black" />
                  </div>
                  <p className="text-white font-semibold">Gift sent!</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatCurrency(customAmount ? parseFloat(customAmount) : giftAmount)} sent to {viewing.host?.display_name}
                  </p>
                </div>
              ) : (
                <>
                  {/* Preset amounts */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {GIFT_PRESETS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => { setGiftAmount(amt); setCustomAmount(""); }}
                        className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                          giftAmount === amt && !customAmount
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {amt >= 1000 ? `$${amt / 1000}k` : `$${amt}`}
                      </button>
                    ))}
                  </div>

                  {/* Custom amount */}
                  <div className="relative mb-4">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Custom amount ($10 – $100,000)"
                      min={10}
                      max={100000}
                      className="w-full pl-7 pr-4 py-3 rounded-xl bg-white/5 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-yellow-500/50 transition-colors"
                    />
                  </div>

                  {/* Split info */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 mb-4">
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-400">Receiver gets (50%)</p>
                      <p className="text-sm font-bold text-[#00d9a3]">
                        ${formatCurrency((customAmount ? parseFloat(customAmount) : giftAmount) * 0.5)}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-400">Platform (50%)</p>
                      <p className="text-sm font-bold text-gray-300">
                        ${formatCurrency((customAmount ? parseFloat(customAmount) : giftAmount) * 0.5)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 text-center">
                    Gifts are held for 21 days before the receiver can withdraw.
                  </p>

                  <button
                    onClick={sendGift}
                    disabled={giftSending || (customAmount ? parseFloat(customAmount) < 10 || parseFloat(customAmount) > 100000 : false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    {giftSending ? "Sending..." : `Send ${formatCurrency(customAmount ? parseFloat(customAmount) : giftAmount)} Gift`}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stream list
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[#00d9a3]">{t("live")}</span>
          </h1>
          {canGoLive && (
            <button
              onClick={() => setShowGoLiveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
            >
              <Radio size={15} />
              {t("go_live")}
            </button>
          )}
        </div>
      </header>

      {/* Eligibility notice */}
      {user && !canGoLive && (
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <Radio size={24} className="text-gray-500 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              Live streaming requires verification and {formatCount(MIN_FOLLOWERS_FOR_LIVE)} followers.
              You have {formatCount(user.followers_count)} followers.
            </p>
          </div>
        </div>
      )}

      {/* Active streams */}
      <div className="max-w-lg mx-auto px-4 py-2">
        {streams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Radio size={40} className="text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No active live streams right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {streams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => setViewing(stream)}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-b from-red-950/30 to-black border border-white/10 group"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Radio size={26} className="text-red-500" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-[10px] font-bold uppercase">Live</span>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur">
                  <Users size={11} className="text-white" />
                  <span className="text-white text-[10px] font-medium">{formatCount(stream.viewer_count)}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-xs font-semibold line-clamp-2 mb-1">{stream.title}</p>
                  <div className="flex items-center gap-1">
                    {stream.host && <Avatar profile={stream.host} size={20} />}
                    <span className="text-[10px] text-gray-300">{stream.host?.display_name}</span>
                    <BadgeIcons verified={stream.host?.verified} isCelebrity={stream.host?.is_celebrity} size={9} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Go Live modal */}
      {showGoLiveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-sm w-full bg-gradient-to-b from-[#1a0a0a] to-[#0a0a0f] rounded-3xl border border-red-500/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Radio size={20} className="text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-white">{t("go_live")}</h2>
              </div>
              <button
                onClick={() => setShowGoLiveModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
            <input
              type="text"
              value={liveTitle}
              onChange={(e) => setLiveTitle(e.target.value)}
              placeholder="Stream title..."
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-red-500/50 transition-colors mb-4"
            />
            <button
              onClick={startLive}
              disabled={!liveTitle.trim()}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-40 hover:bg-red-500 transition-colors"
            >
              Start Streaming
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
