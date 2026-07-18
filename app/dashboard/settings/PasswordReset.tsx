"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function PasswordReset({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setPending(false);
    if (error) {
      setError("Couldn't send the reset email. Please try again.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <p className="text-sm text-health">Check your inbox at {email} for a password reset link.</p>;
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
        {pending ? "Sending…" : "Send password reset email"}
      </Button>
      {error && <p className="mt-2 text-sm text-gold">{error}</p>}
    </div>
  );
}
