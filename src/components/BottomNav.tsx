import { Home, Play, Film, Circle, Sparkles, MessageCircle, Radio, Shield, Wallet } from "lucide-react";
import type { TabKey } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user-context";

const tabs: { key: TabKey; labelKey: string; icon: typeof Home }[] = [
  { key: "home", labelKey: "home", icon: Home },
  { key: "watch", labelKey: "watch", icon: Play },
  { key: "reels", labelKey: "reels", icon: Film },
  { key: "live", labelKey: "live", icon: Radio },
  { key: "dm", labelKey: "dm", icon: MessageCircle },
  { key: "status", labelKey: "status", icon: Circle },
  { key: "ai", labelKey: "ai", icon: Sparkles },
  { key: "wallet", labelKey: "wallet", icon: Wallet },
  { key: "admin", labelKey: "admin", icon: Shield },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const { t } = useI18n();
  const { user } = useUser();

  const visibleTabs = tabs.filter((tab) => {
    if (tab.key === "admin" && !user?.is_admin) return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-2 pb-[env(safe-area-inset-bottom)] overflow-x-auto scrollbar-hide">
        {visibleTabs.map(({ key, labelKey, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex flex-col items-center gap-1 px-2 py-1.5 transition-all duration-200 group shrink-0"
            >
              <div
                className={`relative transition-all duration-300 ${
                  isActive ? "scale-110" : "scale-100 group-hover:scale-105"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-[#00d9a3] drop-shadow-[0_0_8px_rgba(0,217,163,0.5)]"
                      : "text-gray-500 group-hover:text-gray-300"
                  }`}
                  fill={isActive && key === "status" ? "currentColor" : "none"}
                />
              </div>
              <span
                className={`text-[9px] font-medium tracking-wide transition-colors duration-200 whitespace-nowrap ${
                  isActive ? "text-[#00d9a3]" : "text-gray-500 group-hover:text-gray-300"
                }`}
              >
                {key === "wallet" ? "Wallet" : t(labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
