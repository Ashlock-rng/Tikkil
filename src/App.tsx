import { useState } from "react";
import { I18nProvider } from "@/lib/i18n";
import { UserProvider, useUser } from "@/lib/user-context";
import type { TabKey } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import WatchPage from "@/pages/WatchPage";
import ReelsPage from "@/pages/ReelsPage";
import StatusPage from "@/pages/StatusPage";
import AIChatPage from "@/pages/AIChatPage";
import DMPage from "@/pages/DMPage";
import LivePage from "@/pages/LivePage";
import WalletPage from "@/pages/WalletPage";
import AdminPage from "@/pages/AdminPage";

function AppContent() {
  const { user, loading } = useUser();
  const [tab, setTab] = useState<TabKey>("home");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00d9a3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {tab === "home" && <HomePage />}
      {tab === "watch" && <WatchPage />}
      {tab === "reels" && <ReelsPage />}
      {tab === "status" && <StatusPage />}
      {tab === "ai" && <AIChatPage />}
      {tab === "dm" && <DMPage />}
      {tab === "live" && <LivePage />}
      {tab === "wallet" && <WalletPage />}
      {tab === "admin" && <AdminPage />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </I18nProvider>
  );
}
