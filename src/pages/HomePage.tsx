import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share, Image as ImageIcon, Send, Crown, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Post, Profile, Advertisement } from "@/lib/types";
import { formatCount, timeAgo } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user-context";
import Avatar from "@/components/Avatar";
import BadgeIcons from "@/components/BadgeIcons";
import LanguageSelector from "@/components/LanguageSelector";
import BadgePurchaseModal from "@/components/BadgePurchaseModal";

export default function HomePage() {
  const { t } = useI18n();
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  useEffect(() => {
    loadPosts();
    loadAds();
  }, []);

  async function loadPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as Post[]);
    setLoading(false);
  }

  async function loadAds() {
    const { data } = await supabase
      .from("advertisements")
      .select("*")
      .eq("is_active", true);
    if (data) setAds(data as Advertisement[]);
  }

  async function submitPost() {
    if (!newPost.trim() || !user) return;
    const { data } = await supabase
      .from("posts")
      .insert({ profile_id: user.id, content: newPost.trim() })
      .select("*, profile:profiles(*)")
      .single();
    if (data) {
      setPosts((prev) => [data as Post, ...prev]);
      setNewPost("");
    }
  }

  function toggleLike(postId: string) {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-[#00d9a3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[#00d9a3]">Tikkil</span>
          </h1>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            {user && !user.is_celebrity && !user.is_adfree && (
              <button
                onClick={() => setShowBadgeModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-blue-500/20 border border-white/10 text-xs font-medium hover:from-yellow-500/30 hover:to-blue-500/30 transition-colors"
              >
                <Crown size={13} className="text-yellow-400" />
                <Shield size={13} className="text-blue-400" />
                <span className="hidden sm:inline">Get Badge</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Composer */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-3">
          {user && <Avatar profile={user} size={40} />}
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What is happening?"
              rows={2}
              className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-base"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <button className="text-[#00d9a3] hover:bg-[#00d9a3]/10 p-2 rounded-full transition-colors">
                <ImageIcon size={18} />
              </button>
              <button
                onClick={submitPost}
                disabled={!newPost.trim()}
                className="px-5 py-1.5 rounded-full bg-[#00d9a3] text-black font-semibold text-sm disabled:opacity-40 hover:bg-[#00d9a3]/90 transition-colors"
              >
                {t("post")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-lg mx-auto">
        {posts.map((post, idx) => (
          <div key={post.id}>
            <article className="px-4 py-4 border-t border-white/5 hover:bg-white/[0.02] transition-colors">
              <div className="flex gap-3">
                {post.profile && <Avatar profile={post.profile} size={44} />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-semibold text-white truncate">
                      {post.profile?.display_name}
                    </span>
                    <BadgeIcons
                      verified={post.profile?.verified}
                      isCelebrity={post.profile?.is_celebrity}
                      isAdfree={post.profile?.is_adfree}
                    />
                    <span className="text-gray-500">@{post.profile?.username}</span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-500">{timeAgo(post.created_at)}</span>
                  </div>

                  <p className="mt-1 text-[15px] leading-relaxed text-gray-100 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {post.image_url && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-white/10">
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-full max-h-96 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Actions - No repost, comment-focused pattern */}
                  <div className="mt-3 flex items-center justify-between max-w-md">
                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-[#0099ff] transition-colors group">
                      <div className="p-1.5 rounded-full group-hover:bg-[#0099ff]/10 transition-colors">
                        <MessageCircle size={17} />
                      </div>
                      <span className="text-xs">{formatCount(post.comments_count)}</span>
                    </button>
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors group ${
                        likedPosts.has(post.id) ? "text-red-500" : "text-gray-500 hover:text-red-500"
                      }`}
                    >
                      <div className="p-1.5 rounded-full group-hover:bg-red-500/10 transition-colors">
                        <Heart
                          size={17}
                          fill={likedPosts.has(post.id) ? "currentColor" : "none"}
                        />
                      </div>
                      <span className="text-xs">
                        {formatCount(post.likes_count + (likedPosts.has(post.id) ? 1 : 0))}
                      </span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-[#00d9a3] transition-colors group">
                      <div className="p-1.5 rounded-full group-hover:bg-[#00d9a3]/10 transition-colors">
                        <Share size={16} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Insert ad every 3 posts (only for non-adfree users) */}
            {idx > 0 && idx % 3 === 0 && !user?.is_adfree && ads.length > 0 && (
              <div className="px-4 py-3 border-t border-white/5">
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#111] to-[#0a0a0f]">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-white/5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      {t("sponsored")}
                    </span>
                  </div>
                  <div className="flex">
                    <img
                      src={ads[idx % ads.length].image_url}
                      alt=""
                      className="w-24 h-24 object-cover shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 p-3">
                      <p className="text-sm font-semibold text-white line-clamp-1">
                        {ads[idx % ads.length].title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {ads[idx % ads.length].description}
                      </p>
                      <button className="mt-2 px-3 py-1 rounded-full bg-[#00d9a3]/20 text-[#00d9a3] text-xs font-semibold">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showBadgeModal && <BadgePurchaseModal onClose={() => setShowBadgeModal(false)} />}
    </div>
  );
}
