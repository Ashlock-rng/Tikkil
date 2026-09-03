import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Music, Sparkles, X, SkipForward } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Reel, Advertisement } from "@/lib/types";
import { formatCount } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user-context";
import Avatar from "@/components/Avatar";
import BadgeIcons from "@/components/BadgeIcons";

const REELS_BEFORE_INTERSTITIAL = 5;
const TIME_BEFORE_INTERSTITIAL_MS = 180000;

export default function ReelsPage() {
  const { t } = useI18n();
  const { user } = useUser();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [showAI, setShowAI] = useState(false);
  const [reelsWatched, setReelsWatched] = useState(0);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [showReelAd, setShowReelAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [currentReelIdx, setCurrentReelIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const reelIndexRef = useRef(0);

  useEffect(() => {
    loadReels();
    loadAds();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= TIME_BEFORE_INTERSTITIAL_MS && !showAI && !showReelAd && reelsWatched >= 3) {
        triggerAI("You have been scrolling for a while. Want a personalized recommendation?");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [showAI, showReelAd, reelsWatched]);

  async function loadReels() {
    const { data } = await supabase
      .from("reels")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false });
    if (data) setReels(data as Reel[]);
    setLoading(false);
  }

  async function loadAds() {
    const { data } = await supabase
      .from("advertisements")
      .select("*")
      .eq("is_active", true);
    if (data) setAds(data as Advertisement[]);
  }

  function onScroll() {
    const container = containerRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollTop / window.innerHeight);
    if (idx !== reelIndexRef.current) {
      reelIndexRef.current = idx;
      setCurrentReelIdx(idx);
      const newCount = idx + 1;
      if (newCount > reelsWatched) {
        setReelsWatched(newCount);
        if (newCount % REELS_BEFORE_INTERSTITIAL === 0 && !showAI && !showReelAd) {
          triggerAI("You just watched 5 reels. Here is a personalized pick for you.");
        }
        // Show ad every 3 reels for non-adfree users
        if (newCount % 3 === 0 && !user?.is_adfree && ads.length > 0 && !showAI) {
          showReelAdOverlay();
        }
      }
    }
  }

  function showReelAdOverlay() {
    setShowReelAd(true);
    setAdCountdown(5);
    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowReelAd(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function triggerAI(prompt: string) {
    setShowAI(true);
    fetchAIResponse(prompt);
  }

  async function fetchAIResponse(prompt: string) {
    setAiLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ message: prompt }),
        }
      );
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      setAiResponse(data.response || "Here is a recommendation for you.");
    } catch {
      setAiResponse("Based on your viewing patterns, I recommend checking out the food and travel reels. Sophia Moon's 30-second recipes and Maya Chen's travel content are trending right now.");
    }
    setAiLoading(false);
  }

  function toggleLike(reelId: string) {
    setLikedReels((prev) => {
      const next = new Set(prev);
      if (next.has(reelId)) next.delete(reelId);
      else next.add(reelId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-[#00d9a3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentAd = ads[currentReelIdx % ads.length];

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {reels.map((reel) => (
          <div
            key={reel.id}
            className="h-screen snap-start snap-always relative flex items-center justify-center"
          >
            <video
              src={reel.video_url}
              loop
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

            {/* Content overlay */}
            <div className="absolute bottom-20 left-0 right-16 px-4 z-10">
              <div className="flex items-center gap-2 mb-3">
                {reel.profile && <Avatar profile={reel.profile} size={36} />}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold text-sm">{reel.profile?.display_name}</span>
                    <BadgeIcons
                      verified={reel.profile?.verified}
                      isCelebrity={reel.profile?.is_celebrity}
                      isAdfree={reel.profile?.is_adfree}
                      size={12}
                    />
                  </div>
                  <span className="text-gray-300 text-xs">@{reel.profile?.username}</span>
                </div>
                <button className="ml-2 px-3 py-1 rounded-full border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition-colors">
                  {t("follow")}
                </button>
              </div>
              <p className="text-white text-sm leading-relaxed mb-2">{reel.caption}</p>
              <div className="flex items-center gap-1.5 text-gray-300 text-xs">
                <Music size={12} />
                <span className="truncate">Original audio · {reel.profile?.display_name}</span>
              </div>
            </div>

            {/* Action bar */}
            <div className="absolute bottom-24 right-2 flex flex-col items-center gap-5 z-10">
              <button onClick={() => toggleLike(reel.id)} className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors">
                  <Heart
                    size={24}
                    className={likedReels.has(reel.id) ? "text-red-500" : "text-white"}
                    fill={likedReels.has(reel.id) ? "currentColor" : "none"}
                  />
                </div>
                <span className="text-white text-xs font-medium">
                  {formatCount(reel.likes + (likedReels.has(reel.id) ? 1 : 0))}
                </span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <span className="text-white text-xs font-medium">{formatCount(reel.comments_count)}</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors">
                  <Bookmark size={22} className="text-white" />
                </div>
              </button>
              <button className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors">
                  <Share2 size={22} className="text-white" />
                </div>
                <span className="text-white text-xs font-medium">{formatCount(reel.shares)}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Skippable Reel Ad */}
      {showReelAd && currentAd && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center animate-fadeIn">
          <div className="max-w-sm w-full mx-4">
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  {t("sponsored")}
                </span>
              </div>
              <img src={currentAd.image_url} alt="" className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm mb-1">{currentAd.title}</h3>
                <p className="text-gray-400 text-xs line-clamp-2">{currentAd.description}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowReelAd(false)}
            className="absolute bottom-8 right-4 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-white text-sm font-medium hover:bg-white/30 transition-colors"
          >
            {t("skip_ad")} ({adCountdown}s)
            <SkipForward size={16} />
          </button>
        </div>
      )}

      {/* AI Interstitial */}
      {showAI && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="max-w-sm w-full bg-gradient-to-b from-[#0f1a1a] to-[#0a0a0f] rounded-3xl border border-[#00d9a3]/30 p-6 shadow-2xl shadow-[#00d9a3]/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00d9a3] to-[#0099ff] flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Tikkil AI</h3>
                  <p className="text-[#00d9a3] text-xs">Personalized for you</p>
                </div>
              </div>
              <button
                onClick={() => setShowAI(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="min-h-[80px] py-2">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-4 h-4 border-2 border-[#00d9a3] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              ) : (
                <p className="text-gray-200 text-sm leading-relaxed">{aiResponse}</p>
              )}
            </div>
            <button
              onClick={() => setShowAI(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#00d9a3] text-black font-semibold text-sm hover:bg-[#00d9a3]/90 transition-colors"
            >
              Continue scrolling
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
