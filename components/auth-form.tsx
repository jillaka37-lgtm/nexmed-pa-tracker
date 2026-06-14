"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { Button } from "./ui/button";

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<"" | "email" | "google">("");

  const configured = hasSupabaseEnv;

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!configured) {
      setError("Supabase isn't configured yet. Add your keys to .env.local.");
      return;
    }
    setLoading("email");
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading("");
        return;
      }
      if (!data.session) {
        setNotice("Check your email to confirm your account, then sign in.");
        setLoading("");
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading("");
        return;
      }
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleGoogle() {
    setError(null);
    if (!configured) {
      setError("Supabase isn't configured yet. Add your keys to .env.local.");
      return;
    }
    setLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading("");
    }
  }

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        disabled={loading !== ""}
      >
        <GoogleIcon />
        {loading === "google" ? "Redirecting…" : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-divider" />
        or with email
        <span className="h-px flex-1 bg-divider" />
      </div>

      <form onSubmit={handleEmail} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-offwhite">
              Full name
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={fieldClass}
              placeholder="Your name"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-offwhite">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-offwhite">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-gold">{error}</p>}
        {notice && <p className="text-sm text-health">{notice}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading !== ""}>
          {loading === "email"
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-teal hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to NexMed?{" "}
            <Link href="/signup" className="text-teal hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 5 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 7 29.4 5 24 5 16 5 9.1 9.5 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.1 40.5 16 45 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C40.9 36.4 45 30.9 45 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
