import { useEffect, useState } from "react";
import { Crown, Shield, Check, X, Users, BadgeCheck, Radio, FileText } from "lucide-react";
import type { UserBadge, Profile, AdminStats, AdminAction } from "@/lib/types";
import { formatCount, timeAgo } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user-context";
import Avatar from "@/components/Avatar";
import BadgeIcons from "@/components/BadgeIcons";

export default function AdminPage() {
  const { t } = useI18n();
  const { user } = useUser();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [view, setView] = useState<"dashboard" | "badges" | "users" | "log">("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_admin) loadAll();
  }, [user]);

  async function loadAll() {
    await Promise.all([loadBadges(), loadUsers(), loadStats(), loadActions()]);
    setLoading(false);
  }

  async function loadBadges() {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/badges`,
      { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    setBadges(data || []);
  }

  async function loadUsers() {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/users`,
      { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    setUsers(data || []);
  }

  async function loadStats() {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/stats`,
      { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    setStats(data);
  }

  async function loadActions() {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/actions`,
      { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    setActions(data || []);
  }

  async function approveBadge(badgeId: string) {
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/badges/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ badgeId, adminId: user?.id }),
    });
    loadAll();
  }

  async function rejectBadge(badgeId: string) {
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/badges/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ badgeId, adminId: user?.id }),
    });
    loadAll();
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <Shield size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Admin access required.</p>
        </div>
      </div>
    );
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
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Shield size={22} className="text-[#00d9a3]" />
          <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
        </div>
        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 flex gap-4 pb-2 overflow-x-auto scrollbar-hide">
          {[
            { key: "dashboard", label: "Dashboard", icon: FileText },
            { key: "badges", label: "Badges", icon: Crown },
            { key: "users", label: "Users", icon: Users },
            { key: "log", label: "Audit Log", icon: BadgeCheck },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key as typeof view)}
              className={`flex items-center gap-1.5 text-sm font-medium pb-2 border-b-2 whitespace-nowrap transition-colors ${
                view === key ? "text-[#00d9a3] border-[#00d9a3]" : "text-gray-500 border-transparent"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Dashboard */}
        {view === "dashboard" && stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#00d9a3]/10 to-transparent border border-[#00d9a3]/20">
              <Users size={20} className="text-[#00d9a3] mb-2" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-gray-400">{t("total_users")}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20">
              <Crown size={20} className="text-yellow-400 mb-2" />
              <p className="text-2xl font-bold">{stats.totalBadges}</p>
              <p className="text-xs text-gray-400">{t("total_badges")}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/20">
              <FileText size={20} className="text-orange-400 mb-2" />
              <p className="text-2xl font-bold">{stats.pendingBadges}</p>
              <p className="text-xs text-gray-400">{t("pending_badges")}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20">
              <Radio size={20} className="text-red-400 mb-2" />
              <p className="text-2xl font-bold">{stats.activeLiveStreams}</p>
              <p className="text-xs text-gray-400">{t("active_streams")}</p>
            </div>
          </div>
        )}

        {/* Badge requests */}
        {view === "badges" && (
          <div className="space-y-3">
            {badges.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">No badge requests.</p>
            ) : (
              badges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {badge.profile && <Avatar profile={badge.profile} size={40} />}
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm">{badge.profile?.display_name}</span>
                        <BadgeIcons
                          verified={badge.profile?.verified}
                          isCelebrity={badge.profile?.is_celebrity}
                          isAdfree={badge.profile?.is_adfree}
                          size={12}
                        />
                      </div>
                      <span className="text-xs text-gray-500">@{badge.profile?.username}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {badge.badge_type === "celebrity" ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
                          <Crown size={12} /> ${badge.amount_paid}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                          <Shield size={12} /> ${badge.amount_paid}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        badge.status === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : badge.status === "rejected"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}
                    >
                      {badge.status}
                    </span>
                    {badge.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveBadge(badge.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30 transition-colors"
                        >
                          <Check size={13} /> {t("approve")}
                        </button>
                        <button
                          onClick={() => rejectBadge(badge.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors"
                        >
                          <X size={13} /> {t("reject")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users */}
        {view === "users" && (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <Avatar profile={u} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm">{u.display_name}</span>
                    <BadgeIcons verified={u.verified} isCelebrity={u.is_celebrity} isAdfree={u.is_adfree} size={12} />
                    {u.is_admin && <Shield size={12} className="text-[#00d9a3]" />}
                  </div>
                  <span className="text-xs text-gray-500">
                    @{u.username} · {formatCount(u.followers_count)} followers
                  </span>
                </div>
                <div className="flex gap-1">
                  {u.is_celebrity && <Crown size={14} className="text-yellow-400" />}
                  {u.is_adfree && <Shield size={14} className="text-blue-400" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audit log */}
        {view === "log" && (
          <div className="space-y-2">
            {actions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">No admin actions yet.</p>
            ) : (
              actions.map((action) => (
                <div key={action.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {action.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-500">{timeAgo(action.created_at)}</span>
                  </div>
                  {action.notes && <p className="text-xs text-gray-400 mt-1">{action.notes}</p>}
                  {action.admin && (
                    <p className="text-xs text-gray-500 mt-1">by {action.admin.display_name}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
