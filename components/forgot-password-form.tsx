"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { Button } from "./ui/button";

const fieldClass =
  "w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hasSupabaseEnv) {
      setError("Supabase isn't configured yet. Add your keys to .env.local.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    // Same code-exchange callback OAuth/email-confirmation already use —
    // it just redirects to /reset-password after establishing the session.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password`,
    });
    setLoading(false);
    // Always show success, whether or not the email exists — don't let this
    // form be used to enumerate registered accounts.
    if (!error || error.message.toLowerCase().includes("rate limit")) {
      setSent(true);
    } else {
      setError(error.message);
    }
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-health">
        If an account exists for that email, a reset link is on its way. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {error && <p className="text-sm text-gold">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
