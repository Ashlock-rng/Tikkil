import { useEffect, useState } from "react";
import { Wallet, Gift, DollarSign, Calendar, Clock, TrendingUp, ArrowDownToLine } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Payout, LiveGift } from "@/lib/types";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useUser } from "@/lib/user-context";
import Avatar from "@/components/Avatar";
import BadgeIcons from "@/components/BadgeIcons";

export default function WalletPage() {
  const { user } = useUser();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [gifts, setGifts] = useState<LiveGift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPayouts();
      loadGifts();
    }
  }, [user]);

  async function loadPayouts() {
    if (!user) return;
    const { data } = await supabase
      .from("payouts")
      .select("*")
      .eq("profile_id", user.id)
      .order("payout_date", { ascending: false });
    if (data) setPayouts(data as Payout[]);
    setLoading(false);
  }

  async function loadGifts() {
    if (!user) return;
    const { data } = await supabase
      .from("live_gifts")
      .select("*, sender:profiles!sender_id(*)")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setGifts(data as LiveGift[]);
  }

  if (!user) return null;

  const nextPayout = payouts.find((p) => p.status === "scheduled");
  const totalPending = user.gift_balance_pending;
  const totalAvailable = user.gift_balance_available;
  const adRevenue = user.ad_revenue_balance;
  const totalEarned = user.total_earned;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Wallet size={22} className="text-[#00d9a3]" />
          <h1 className="text-xl font-bold tracking-tight">Wallet</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Balance cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Available balance */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#00d9a3]/15 to-transparent border border-[#00d9a3]/20">
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign size={16} className="text-[#00d9a3]" />
              <span className="text-xs text-gray-400">Available</span>
            </div>
            <p className="text-2xl font-bold text-[#00d9a3]">${formatCurrency(totalAvailable)}</p>
            <button className="mt-2 w-full py-1.5 rounded-lg bg-[#00d9a3]/20 text-[#00d9a3] text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#00d9a3]/30 transition-colors">
              <ArrowDownToLine size={12} />
              Withdraw
            </button>
          </div>

          {/* Pending (21-day hold) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-orange-500/15 to-transparent border border-orange-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={16} className="text-orange-400" />
              <span className="text-xs text-gray-400">Pending (21-day hold)</span>
            </div>
            <p className="text-2xl font-bold text-orange-400">${formatCurrency(totalPending)}</p>
            <p className="mt-2 text-[10px] text-gray-500">Released after 21 days</p>
          </div>
        </div>

        {/* Ad revenue + total earned */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={16} className="text-blue-400" />
              <span className="text-xs text-gray-400">Ad Revenue</span>
            </div>
            <p className="text-xl font-bold text-blue-400">${formatCurrency(adRevenue)}</p>
            {user.is_celebrity && (
              <p className="mt-1 text-[10px] text-gray-500">40% share from your content</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <Gift size={16} className="text-yellow-400" />
              <span className="text-xs text-gray-400">Total Earned</span>
            </div>
            <p className="text-xl font-bold text-yellow-400">${formatCurrency(totalEarned)}</p>
            <p className="mt-1 text-[10px] text-gray-500">Lifetime earnings</p>
          </div>
        </div>

        {/* Next payout */}
        {nextPayout && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-[#00d9a3]" />
              <h3 className="text-sm font-semibold">Next Payout</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Scheduled for</p>
                <p className="text-sm font-semibold text-white">
                  {new Date(nextPayout.payout_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-bold text-[#00d9a3]">${formatCurrency(nextPayout.total_amount)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-[#00d9a3] rounded-full" style={{ width: "60%" }} />
              </div>
              <span>Payouts process on the 29th of each month</span>
            </div>
          </div>
        )}

        {/* Payout history */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Payout History</h3>
          {payouts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No payouts yet.</p>
          ) : (
            <div className="space-y-2">
              {payouts.map((payout) => (
                <div key={payout.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(payout.payout_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>Ad: ${formatCurrency(payout.ad_revenue)}</span>
                        <span>Gifts: ${formatCurrency(payout.gift_earnings)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">${formatCurrency(payout.total_amount)}</p>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          payout.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : payout.status === "scheduled"
                            ? "bg-orange-500/20 text-orange-400"
                            : payout.status === "processing"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {payout.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent gifts received */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Gifts Received</h3>
          {gifts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No gifts received yet.</p>
          ) : (
            <div className="space-y-2">
              {gifts.map((gift) => (
                <div key={gift.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  {gift.sender && <Avatar profile={gift.sender} size={36} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{gift.sender?.display_name}</span>
                      <BadgeIcons verified={gift.sender?.verified} isCelebrity={gift.sender?.is_celebrity} size={11} />
                    </div>
                    <span className="text-xs text-gray-500">{timeAgo(gift.created_at)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-400">${formatCurrency(gift.amount)}</p>
                    <p className="text-[10px] text-gray-500">
                      You get ${formatCurrency(gift.receiver_share)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      gift.status === "holding"
                        ? "bg-orange-500/20 text-orange-400"
                        : gift.status === "released"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {gift.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
