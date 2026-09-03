import { useEffect, useState } from "react";
import { Camera, Plus, X, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Status, Profile } from "@/lib/types";
import { timeAgo, formatCount } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function StatusPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [viewingStatuses, setViewingStatuses] = useState<Status[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    loadStatuses();
  }, []);

  async function loadStatuses() {
    const { data } = await supabase
      .from("statuses")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false });
    if (data) setStatuses(data as Status[]);
    setLoading(false);
  }

  function openStatus(profile: Profile) {
    const userStatuses = statuses.filter((s) => s.profile_id === profile.id);
    setViewing(profile);
    setViewingStatuses(userStatuses);
    setCurrentIdx(0);
  }

  function nextStatus() {
    if (currentIdx < viewingStatuses.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setViewing(null);
    }
  }

  // Group statuses by user
  const groupedByUser = statuses.reduce((acc, s) => {
    if (!acc[s.profile_id]) acc[s.profile_id] = { profile: s.profile!, statuses: [] };
    acc[s.profile_id].statuses.push(s);
    return acc;
  }, {} as Record<string, { profile: Profile; statuses: Status[] }>);

  const userList = Object.values(groupedByUser);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-[#00d9a3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Status viewer
  if (viewing && viewingStatuses.length > 0) {
    const current = viewingStatuses[currentIdx];
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Progress bars */}
        <div className="flex gap-1 p-2">
          {viewingStatuses.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full bg-white transition-all duration-300 ${i <= currentIdx ? "w-full" : "w-0"}`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2">
          {viewing && <Avatar profile={viewing} size={36} />}
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-white font-semibold text-sm">{viewing?.display_name}</span>
              {viewing?.verified && <VerifiedBadge size={12} />}
            </div>
            <span className="text-gray-400 text-xs">{timeAgo(current.created_at)}</span>
          </div>
          <button
            onClick={() => setViewing(null)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Image */}
        <div
          className="flex-1 flex items-center justify-center relative cursor-pointer"
          onClick={nextStatus}
        >
          <img
            src={current.media_url}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
          {current.caption && (
            <div className="absolute bottom-8 left-0 right-0 text-center px-6">
              <p className="text-white text-lg font-medium drop-shadow-lg">{current.caption}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Eye size={16} />
            <span>{formatCount(current.views)} views</span>
          </div>
          <input
            type="text"
            placeholder="Reply..."
            className="flex-1 max-w-xs mx-4 px-4 py-2 rounded-full bg-white/10 text-white text-sm placeholder-gray-500 outline-none border border-white/10"
          />
          <button className="text-[#00d9a3]">
            <Camera size={22} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[#00d9a3]">Status</span>
          </h1>
          <button className="w-9 h-9 rounded-full bg-[#00d9a3]/10 flex items-center justify-center hover:bg-[#00d9a3]/20 transition-colors">
            <Camera size={18} className="text-[#00d9a3]" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* My Status */}
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">My Status</h2>
          <button className="flex items-center gap-3 w-full">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center border-2 border-dashed border-gray-600">
                <Plus size={20} className="text-gray-400" />
              </div>
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Add to status</p>
              <p className="text-xs text-gray-500">Share photos that disappear in 24h</p>
            </div>
          </button>
        </div>

        {/* Recent updates */}
        <div className="px-4 py-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Updates</h2>
          <div className="space-y-1">
            {userList.map(({ profile, statuses: userStatuses }) => (
              <button
                key={profile.id}
                onClick={() => openStatus(profile)}
                className="flex items-center gap-3 w-full py-2 hover:bg-white/5 rounded-lg p-1 transition-colors"
              >
                <Avatar profile={profile} size={52} ring />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm">{profile.display_name}</span>
                    {profile.verified && <VerifiedBadge size={12} />}
                  </div>
                  <p className="text-xs text-gray-500">
                    {timeAgo(userStatuses[0].created_at)} · {userStatuses.length} {userStatuses.length === 1 ? "update" : "updates"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
