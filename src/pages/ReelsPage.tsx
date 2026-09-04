import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Music, Sparkles, X, SkipForward } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Reel, Advertisement } from "@/lib/types";
import { formatCount } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user-context";
import Avatar from "@/components/Avatar";
import BadgeIcons from "@/components/BadgeIcons";

export default function ReelsPage() {
  const { t } = useI18n();
  const { user } = useUser();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [showReelAd, setShowReelAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [currentReelIdx, setCurrentReelIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const reelIndexRef = useRef(0);

  useEffect(() => {
    loadReels();
    loadAds();
    loadLikes();
  }, []);

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

  async function loadLikes() {
    if (!user) return;
    const { data } = await supabase
      .from("likes")
      .select("reel_id")
      .eq("profile_id", user.id)
      .not("reel_id", "is", null);
    if (data) setLikedReels(new Set(data.map((l: { reel_id: string }) => l.reel_id)));
  }

  function onScroll() {
    const container = containerRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollTop / window.innerHeight);
    if (idx !== reelIndexRef.current) {
      reelIndexRef.current = idx;
      setCurrentReelIdx(idx);
      const newCount = idx + 1;
      if (newCount % 4 === 0 && !user?.is_adfree && ads.length > 0 && !showReelAd) {
        showReelAdOverlay();
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

  async function toggleLike(reelId: string) {
    if (!user) return;
    const isLiked = likedReels.has(reelId);
    setLikedReels((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(reelId);
      else next.add(reelId);
      return next;
    });
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, likes: r.likes + (isLiked ? -1 : 1) } : r
      )
    );
    if (isLiked) {
      await supabase.from("likes").delete().eq("reel_id", reelId).eq("profile_id", user.id);
    } else {
      await supabase.from("likes").insert({ reel_id: reelId, profile_id: user.id });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-[#00d9a3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400 text-sm">No reels yet.</p>
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
          <div key={reel.id} className="h-screen snap-start snap-always relative flex items-center justify-center">
            <video
              src={reel.video_url}
              loop
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

            <div className="absolute bottom-20 left-0 right-16 px-4 z-10">
              <div className="flex items-center gap-2 mb-3">
                {reel.profile && <Avatar profile={reel.profile} size={36} />}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold text-sm">{reel.profile?.display_name}</span>
                    <BadgeIcons verified={reel.profile?.verified} isCelebrity={reel.profile?.is_celebrity} isAdfree={reel.profile?.is_adfree} size={12} />
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

            <div className="absolute bottom-24 right-2 flex flex-col items-center gap-5 z-10">
              <button onClick={() => toggleLike(reel.id)} className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors">
                  <Heart size={24} className={likedReels.has(reel.id) ? "text-red-500" : "text-white"} fill={likedReels.has(reel.id) ? "currentColor" : "none"} />
                </div>
                <span className="text-white text-xs font-medium">{formatCount(reel.likes)}</span>
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

      {showReelAd && currentAd && !user?.is_adfree && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center animate-fadeIn">
          <div className="max-w-sm w-full mx-4">
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t("sponsored")}</span>
              </div>
              <img src={currentAd.image_url} alt="" className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm mb-1">{currentAd.title}</h3>
                <p className="text-gray-400 text-xs line-clamp-2">{currentAd.description}</p>
                <a href={currentAd.target_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block px-3 py-1 rounded-full bg-[#00d9a3]/20 text-[#00d9a3] text-xs font-semibold">
                  Learn More
                </a>
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
    </div>
  );
}
