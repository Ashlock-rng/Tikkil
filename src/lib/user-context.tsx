import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

interface UserContextValue {
  user: Profile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await loadProfile(session.user.id);
    }
    setLoading(false);

    supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session) {
          await loadProfile(session.user.id);
        } else {
          setUser(null);
        }
      })();
    });
  }

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // Profile might not exist yet if trigger hasn't fired
      // Wait a moment and retry once
      await new Promise((r) => setTimeout(r, 500));
      const { data: retry } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (retry) setUser(retry as Profile);
      return;
    }

    if (data) {
      setUser(data as Profile);
    } else {
      // Manually create profile if trigger didn't fire
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || "";
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          username: email.split("@")[0] || "user_" + userId.slice(0, 8),
          display_name: email.split("@")[0] || "New User",
          email,
        })
        .select("*")
        .maybeSingle();
      if (newProfile) setUser(newProfile as Profile);
    }
  }

  async function refreshUser() {
    if (!user) return;
    await loadProfile(user.id);
  }

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      // Update the auto-created profile with the user's chosen username/display_name
      await supabase
        .from("profiles")
        .update({ username, display_name: displayName })
        .eq("id", data.user.id);
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, signIn, signUp, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
