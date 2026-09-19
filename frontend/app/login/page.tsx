"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { homeRouteForRole } from "@/lib/routing";

const DEMO_USERS = [
  { role: "Citizen", email: "citizen.demo@example.test" },
  { role: "Field Officer", email: "field.demo@example.test" },
  { role: "Department Officer", email: "department.demo@example.test" },
  { role: "Admin", email: "admin.demo@example.test" },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace(homeRouteForRole(user.role));
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      router.replace(homeRouteForRole(loggedInUser.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-950">
        <Radar className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4">
      <div className="scanline relative w-full max-w-md overflow-hidden rounded-2xl border border-base-700 bg-base-900/90 p-8 shadow-glow">
        <div className="mb-8 flex flex-col items-center text-center">
          <Radar className="mb-3 h-10 w-10 text-accent" />
          <h1 className="text-2xl font-extrabold tracking-widest text-white">JanSamadhan</h1>
          <p className="mono mt-1 text-xs tracking-wider text-base-500">JAN SAMADHAN COMMAND CENTER</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-base-500">Email</label>
            <div className="flex items-center gap-2 rounded-lg border border-base-600 bg-base-800 px-3 py-2.5 focus-within:border-accent">
              <Mail size={16} className="text-base-500" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.test"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-base-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-base-500">Password</label>
            <div className="flex items-center gap-2 rounded-lg border border-base-600 bg-base-800 px-3 py-2.5 focus-within:border-accent">
              <Lock size={16} className="text-base-500" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-base-500"
              />
            </div>
          </div>

          {error && <div className="rounded-lg border border-crit/30 bg-crit/10 px-3 py-2 text-sm text-crit">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-base-950 shadow-glow transition hover:bg-accent-glow disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? "Authenticating…" : "Sign in"}
          </button>
        </form>

        <div className="mt-7 border-t border-base-700 pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-500">Demo access · password demo123</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword("demo123");
                }}
                className="rounded-lg border border-base-600 bg-base-800 px-2.5 py-2 text-left text-xs text-base-100 transition hover:border-accent/40 hover:bg-base-700"
              >
                <p className="font-semibold">{d.role}</p>
                <p className="mono truncate text-[10px] text-base-500">{d.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
