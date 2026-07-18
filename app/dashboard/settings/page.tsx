import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { PasswordReset } from "./PasswordReset";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div>
      <h1 className="text-3xl font-bold text-offwhite">Settings</h1>
      <p className="mt-2 text-muted">Manage your account security.</p>

      <div className="mt-8 max-w-md space-y-6">
        <div className="rounded-2xl border border-divider bg-surface p-6">
          <p className="text-sm font-semibold text-offwhite">Password</p>
          <p className="mt-1 mb-4 text-sm text-muted">We&rsquo;ll email you a link to set a new password.</p>
          {profile?.email && <PasswordReset email={profile.email} />}
        </div>

        <div className="rounded-2xl border border-divider bg-surface p-6">
          <p className="text-sm font-semibold text-offwhite">Sign out</p>
          <p className="mt-1 mb-4 text-sm text-muted">End your session on this device.</p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-sm text-teal hover:underline">Logout</button>
          </form>
        </div>
      </div>
    </div>
  );
}
