import { useEffect, useState, useRef } from "react";
import { Send, UserPlus, Check, X, Flag, ArrowLeft, Search, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Profile, FriendRequest, DirectMessage } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user-context";
import Avatar from "@/components/Avatar";
import BadgeIcons from "@/components/BadgeIcons";

export default function DMPage() {
  const { t } = useI18n();
  const { user } = useUser();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [selectedChat, setSelectedChat] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [view, setView] = useState<"chats" | "requests">("chats");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadRequests();
      loadAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) loadMessages();
  }, [selectedChat]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function loadFriends() {
    if (!user) return;
    const { data: accepted } = await supabase
      .from("friend_requests")
      .select("*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)")
      .eq("status", "accepted");
    if (accepted) {
      const friendProfiles = (accepted as FriendRequest[])
        .map((r) => (r.sender_id === user.id ? r.receiver : r.sender))
        .filter((p): p is Profile => p !== null);
      setFriends(friendProfiles);
    }
  }

  async function loadRequests() {
    if (!user) return;
    const { data } = await supabase
      .from("friend_requests")
      .select("*, sender:profiles!sender_id(*)")
      .eq("receiver_id", user.id)
      .eq("status", "pending");
    if (data) setRequests(data as FriendRequest[]);
  }

  async function loadAllUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user?.id || "");
    if (data) setAllUsers(data as Profile[]);
  }

  async function loadMessages() {
    if (!user || !selectedChat) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as DirectMessage[]);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user || !selectedChat) return;
    const msg: DirectMessage = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: selectedChat.id,
      content: newMessage.trim(),
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
    await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: selectedChat.id,
      content: msg.content,
    });
  }

  async function sendFriendRequest(receiverId: string) {
    if (!user) return;
    await supabase.from("friend_requests").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: "pending",
    });
    setShowSearch(false);
    setSearchQuery("");
  }

  async function respondToRequest(requestId: string, status: "accepted" | "rejected" | "reported") {
    await supabase
      .from("friend_requests")
      .update({ status })
      .eq("id", requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (status === "accepted") loadFriends();
  }

  if (!user) return null;

  // Chat view
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white pb-20 flex flex-col">
        {/* Chat header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="p-1">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <Avatar profile={selectedChat} size={36} />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{selectedChat.display_name}</span>
                <BadgeIcons
                  verified={selectedChat.verified}
                  isCelebrity={selectedChat.is_celebrity}
                  isAdfree={selectedChat.is_adfree}
                  size={12}
                />
              </div>
              <span className="text-xs text-gray-500">@{selectedChat.username}</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-4 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender_id === user.id
                    ? "bg-[#00d9a3] text-black rounded-tr-sm"
                    : "bg-white/10 text-gray-100 rounded-tl-sm"
                }`}
              >
                {msg.content}
                <span className="block text-[10px] opacity-50 mt-1">{timeAgo(msg.created_at)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="sticky bottom-16 bg-[#0a0a0f]/90 backdrop-blur-lg border-t border-white/10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={t("type_message")}
              className="flex-1 px-4 py-2.5 rounded-full bg-white/10 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-[#00d9a3]/50 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="w-10 h-10 rounded-full bg-[#00d9a3] flex items-center justify-center disabled:opacity-40 hover:bg-[#00d9a3]/90 transition-colors shrink-0"
            >
              <Send size={17} className="text-black" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[#00d9a3]">{t("dm")}</span>
          </h1>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-9 h-9 rounded-full bg-[#00d9a3]/10 flex items-center justify-center hover:bg-[#00d9a3]/20 transition-colors"
          >
            <Search size={18} className="text-[#00d9a3]" />
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 flex gap-4 pb-2">
          <button
            onClick={() => setView("chats")}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
              view === "chats" ? "text-[#00d9a3] border-[#00d9a3]" : "text-gray-500 border-transparent"
            }`}
          >
            {t("dm")} ({friends.length})
          </button>
          <button
            onClick={() => setView("requests")}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
              view === "requests" ? "text-[#00d9a3] border-[#00d9a3]" : "text-gray-500 border-transparent"
            }`}
          >
            Requests ({requests.length})
          </button>
        </div>
      </header>

      {/* Search */}
      {showSearch && (
        <div className="max-w-lg mx-auto px-4 py-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search")}
            className="w-full px-4 py-2.5 rounded-full bg-white/10 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-[#00d9a3]/50 transition-colors"
          />
          <div className="mt-2 space-y-1">
            {allUsers
              .filter((u) =>
                searchQuery
                  ? u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.username.toLowerCase().includes(searchQuery.toLowerCase())
                  : true
              )
              .slice(0, 5)
              .map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Avatar profile={u} size={36} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{u.display_name}</span>
                      <BadgeIcons verified={u.verified} isCelebrity={u.is_celebrity} size={11} />
                    </div>
                    <span className="text-xs text-gray-500">@{u.username}</span>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(u.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#00d9a3]/20 text-[#00d9a3] text-xs font-semibold hover:bg-[#00d9a3]/30 transition-colors"
                  >
                    <UserPlus size={13} />
                    {t("add_friend")}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Chats list */}
      {view === "chats" && (
        <div className="max-w-lg mx-auto px-4 py-2">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MessageCircle size={40} className="text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">No conversations yet. Add friends to start chatting!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setSelectedChat(friend)}
                className="flex items-center gap-3 w-full py-3 px-2 hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <Avatar profile={friend} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm">{friend.display_name}</span>
                    <BadgeIcons verified={friend.verified} isCelebrity={friend.is_celebrity} size={12} />
                  </div>
                  <span className="text-xs text-gray-500">Tap to chat</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Friend requests */}
      {view === "requests" && (
        <div className="max-w-lg mx-auto px-4 py-2">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <UserPlus size={40} className="text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">No pending friend requests.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-white/5 transition-colors">
                {req.sender && <Avatar profile={req.sender} size={48} />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm">{req.sender?.display_name}</span>
                    <BadgeIcons verified={req.sender?.verified} isCelebrity={req.sender?.is_celebrity} size={12} />
                  </div>
                  <span className="text-xs text-gray-500">Wants to connect with you</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => respondToRequest(req.id, "accepted")}
                    className="w-9 h-9 rounded-full bg-[#00d9a3]/20 flex items-center justify-center hover:bg-[#00d9a3]/40 transition-colors"
                  >
                    <Check size={16} className="text-[#00d9a3]" />
                  </button>
                  <button
                    onClick={() => respondToRequest(req.id, "rejected")}
                    className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors"
                  >
                    <X size={16} className="text-red-400" />
                  </button>
                  <button
                    onClick={() => respondToRequest(req.id, "reported")}
                    className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center hover:bg-orange-500/40 transition-colors"
                  >
                    <Flag size={14} className="text-orange-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
