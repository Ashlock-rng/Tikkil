import { useState } from "react";
import { Mail, User, Lock, Sparkles, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { useUser } from "@/lib/user-context";

export default function AuthPage() {
  const { signIn, signUp } = useUser();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      if (!email.trim() || !password) {
        setError("Please enter your email and password.");
        setLoading(false);
        return;
      }
      const { error: err } = await signIn(email.trim().toLowerCase(), password);
      if (err) setError(err);
    } else {
      if (!username.trim() || !displayName.trim() || !email.trim() || !password) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email.trim().toLowerCase(), password, username.trim(), displayName.trim());
      if (err) setError(err);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00d9a3] to-[#0099ff] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#00d9a3]/20">
          <Sparkles size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-[#00d9a3]">Tikkil</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </p>
      </div>

      <div className="max-w-sm w-full bg-white/5 rounded-3xl border border-white/10 p-6">
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 mb-5">
          <button
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === "signup" ? "bg-[#00d9a3] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setMode("login"); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === "login" ? "bg-[#00d9a3] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-[#00d9a3]/50 transition-colors"
                />
              </div>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-[#00d9a3]/50 transition-colors"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-[#00d9a3]/50 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 text-white text-sm placeholder-gray-500 outline-none border border-white/10 focus:border-[#00d9a3]/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <X size={15} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#00d9a3] text-black font-semibold text-sm disabled:opacity-40 hover:bg-[#00d9a3]/90 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          {mode === "signup" ? "Already have an account? " : "New to Tikkil? "}
          <button
            onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); }}
            className="text-[#00d9a3] font-medium"
          >
            {mode === "signup" ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>

      <p className="text-xs text-gray-600 mt-4 text-center max-w-xs">
        By continuing, you agree to Tikkil's Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
