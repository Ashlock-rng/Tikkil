import { useState } from "react";
import { Crown, Shield, Check, X } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useI18n } from "@/lib/i18n";

export default function BadgePurchaseModal({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useUser();
  const { t } = useI18n();
  const [loading, setLoading] = useState<"celebrity" | "adfree" | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function purchaseBadge(badgeType: "celebrity" | "adfree") {
    if (!user) return;
    setLoading(badgeType);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            badgeType,
            profileId: user.id,
            origin: window.location.origin,
          }),
        }
      );
      const data = await res.json();

      if (data.url) {
        // Real Stripe checkout - redirect
        window.location.href = data.url;
      } else if (data.demo) {
        // Demo mode - badge submitted for review
        setResult(data.message);
        await refreshUser();
      } else if (data.error) {
        setResult(data.error);
      }
    } catch {
      setResult("Payment system is not yet configured. Please try again later.");
    }
    setLoading(null);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-sm w-full bg-gradient-to-b from-[#0f1a1a] to-[#0a0a0f] rounded-3xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Get Verified</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {result ? (
          <div className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Check size={20} className="text-[#00d9a3]" />
              <p className="text-sm text-gray-200">{result}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#00d9a3] text-black font-semibold text-sm hover:bg-[#00d9a3]/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Celebrity Badge */}
            <div className="p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <Crown size={20} className="text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{t("celebrity_badge")}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Yellow verification badge. Celebrities earn 40% of ad revenue from their content.
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-yellow-400">$8</span>
                    <button
                      onClick={() => purchaseBadge("celebrity")}
                      disabled={loading !== null}
                      className="px-4 py-1.5 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-40 transition-colors"
                    >
                      {loading === "celebrity" ? "Processing..." : "Purchase"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ad-Free Badge */}
            <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{t("adfree_badge")}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Blue badge. Removes all advertisements across the entire app.
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-blue-400">$5</span>
                    <button
                      onClick={() => purchaseBadge("adfree")}
                      disabled={loading !== null}
                      className="px-4 py-1.5 rounded-full bg-blue-500 text-white font-semibold text-sm hover:bg-blue-400 disabled:opacity-40 transition-colors"
                    >
                      {loading === "adfree" ? "Processing..." : "Purchase"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
