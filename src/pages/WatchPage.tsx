import { useEffect, useState } from "react";
import { Play, ThumbsUp, Share2, Eye, Clock, X, SkipForward } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Video, Advertisement } from "@/lib/types";
import { formatViews, timeAgo, formatCount } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user-context";
import Avatar from "@/components/Avatar";
import BadgeIcons from "@/components/BadgeIcons";

export default function WatchPage() {
  const { t } = useI18n();
  const { user } = useUser();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Video | null>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    loadVideos();
    loadAds();
  }, []);

  async function loadVideos() {
    const { data } = await supabase
      .from("videos")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false });
    if (data) setVideos(data as Video[]);
    setLoading(false);
  }

  async function loadAds() {
    const { data } = await supabase
      .from("advertisements")
      .select("*")
      .eq("is_active", true);
    if (data) setAds(data as Advertisement[]);
  }

  function openVideo(video: Video) {
    setSelected(video);
    // Show ad before video if user is not ad-free
    if (!user?.is_adfree && ads.length > 0) {
      const ad = ads[Math.floor(Math.random() * ads.length)];
      setCurrentAd(ad);
      setShowAd(true);
      setAdCountdown(5);
      const interval = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowAd(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }

  function skipAd() {
    setShowAd(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-[#00d9a3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
        <div className="max-w-lg mx-auto">
          {/* Video player area */}
          <div className="relative aspect-video bg-black">
            {showAd && currentAd ? (
              // YouTube-style pre-roll ad
              <div className="absolute inset-0 z-10">
                <img src={currentAd.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-yellow-500 text-black text-[10px] font-bold uppercase">
                      {t("ad")}
                    </span>
                    <span className="text-xs text-gray-300">{t("sponsored")}</span>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{currentAd.title}</h3>
                  <p className="text-gray-300 text-xs line-clamp-2 mb-2">{currentAd.description}</p>
                  <button className="px-3 py-1 rounded-full bg-white text-black text-xs font-semibold">
                    Learn More
                  </button>
                </div>
                {/* Skip button */}
                <button
                  onClick={skipAd}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur text-white text-xs font-medium hover:bg-black/90 transition-colors"
                >
                  {t("skip_ad")} ({adCountdown}s)
                  <SkipForward size={14} />
                </button>
              </div>
            ) : (
              <video
                src={selected.video_url}
                poster={selected.thumbnail_url}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            )}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors z-20"
            >
              <span className="text-white text-lg">←</span>
            </button>
          </div>

          {/* Info */}
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold leading-snug">{selected.title}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Eye size={14} /> {formatViews(selected.views)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {timeAgo(selected.created_at)}
              </span>
            </div>

            {/* Channel + actions */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selected.profile && <Avatar profile={selected.profile} size={40} />}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm">{selected.profile?.display_name}</span>
                    <BadgeIcons
                      verified={selected.profile?.verified}
                      isCelebrity={selected.profile?.is_celebrity}
                      isAdfree={selected.profile?.is_adfree}
                      size={12}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{formatCount(selected.profile?.followers_count || 0)} followers</span>
                </div>
                <button className="ml-2 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors">
                  {t("follow")}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm">
                  <ThumbsUp size={15} /> {formatCount(selected.likes)}
                </button>
                <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Share2 size={15} />
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mt-3 p-3 rounded-xl bg-white/5 text-sm text-gray-300 leading-relaxed">
              {selected.description}
            </div>
          </div>

          {/* Up next */}
          <div className="px-4 pb-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-2">Up next</h2>
            {videos
              .filter((v) => v.id !== selected.id)
              .slice(0, 5)
              .map((v) => (
                <button
                  key={v.id}
                  onClick={() => openVideo(v)}
                  className="flex gap-3 w-full py-2 text-left hover:bg-white/5 rounded-lg p-2 transition-colors"
                >
                  <div className="relative w-32 h-18 rounded-lg overflow-hidden shrink-0">
                    <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[10px] font-medium">
                      {v.duration}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{v.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{v.profile?.display_name}</p>
                    <p className="text-xs text-gray-500">{formatViews(v.views)} · {timeAgo(v.created_at)}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[#00d9a3]">{t("watch")}</span>
          </h1>
        </div>
      </header>

      {/* Categories */}
      <div className="max-w-lg mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {["All", "Film", "Travel", "Music", "Food", "Nature", "Tech", "Dance", "Fashion"].map((cat, i) => (
          <button
            key={cat}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              i === 0
                ? "bg-white text-black font-semibold"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="max-w-lg mx-auto px-4 grid grid-cols-1 gap-4">
        {videos.map((video) => (
          <button
            key={video.id}
            onClick={() => openVideo(video)}
            className="text-left group"
          >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5">
              <img
                src={video.thumbnail_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[11px] font-medium">
                {video.duration}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-[#00d9a3]/90 flex items-center justify-center">
                  <Play size={22} className="text-black ml-0.5" fill="black" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-3">
              {video.profile && <Avatar profile={video.profile} size={34} />}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold leading-snug line-clamp-2">{video.title}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  {video.profile?.display_name}
                  <BadgeIcons
                    verified={video.profile?.verified}
                    isCelebrity={video.profile?.is_celebrity}
                    size={11}
                  />
                  <span>· {formatViews(video.views)} · {timeAgo(video.created_at)}</span>
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
