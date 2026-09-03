import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

const CURRENT_USER_KEY = "tikkil-current-user";

interface UserContextValue {
  user: Profile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => void;
}

interface SignUpData {
  username: string;
  display_name: string;
  identifier: string;
  password: string;
  method: "phone" | "email";
}

const UserContext = createContext<UserContextValue | null>(null);

// Simple hash for demo auth (not production-grade, but avoids exposing plaintext)
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Profile;
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", parsed.id)
          .maybeSingle();
        if (data) {
          setUser(data as Profile);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
        } else {
          setUser(parsed);
        }
        setLoading(false);
        return;
      } catch {
        // fall through
      }
    }
    // No stored user — will show auth screen
    setLoading(false);
  }

  async function refreshUser() {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      setUser(data as Profile);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
    }
  }

  const signIn = useCallback(async (identifier: string, password: string) => {
    const hash = simpleHash(password);
    const isEmail = identifier.includes("@");

    const query = supabase
      .from("profiles")
      .select("*")
      .eq("password_hash", hash)
      .limit(1);

    if (isEmail) {
      query.eq("email", identifier.toLowerCase().trim());
    } else {
      query.eq("phone", identifier.trim());
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return { error: "Invalid credentials. Please check your phone/email and password." };
    }

    setUser(data as Profile);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
    return { error: null };
  }, []);

  const signUp = useCallback(async (signUpData: SignUpData) => {
    const hash = simpleHash(signUpData.password);
    const isEmail = signUpData.method === "email";

    // Check if identifier already exists
    const checkQuery = supabase.from("profiles").select("id").limit(1);
    if (isEmail) {
      checkQuery.eq("email", signUpData.identifier.toLowerCase().trim());
    } else {
      checkQuery.eq("phone", signUpData.identifier.trim());
    }
    const { data: existing } = await checkQuery.maybeSingle();
    if (existing) {
      return { error: `${isEmail ? "Email" : "Phone number"} already registered. Try signing in instead.` };
    }

    // Check username uniqueness
    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", signUpData.username.trim())
      .maybeSingle();
    if (existingUsername) {
      return { error: "Username already taken. Try another one." };
    }

    const insertData: Record<string, unknown> = {
      username: signUpData.username.trim(),
      display_name: signUpData.display_name.trim(),
      password_hash: hash,
      followers_count: 0,
      verified: false,
      is_celebrity: false,
      is_adfree: false,
      is_admin: false,
      preferred_language: "en",
    };

    if (isEmail) {
      insertData.email = signUpData.identifier.toLowerCase().trim();
    } else {
      insertData.phone = signUpData.identifier.trim();
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      return { error: error.message };
    }

    setUser(data as Profile);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
    return { error: null };
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
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
