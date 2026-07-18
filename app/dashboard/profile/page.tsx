import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div>
      <h1 className="text-3xl font-bold text-offwhite">Profile</h1>
      <p className="mt-2 text-muted">Keep your contact details up to date.</p>

      <div className="mt-8 max-w-md rounded-2xl border border-divider bg-surface p-6">
        <p className="mb-4 text-sm text-muted">Email: <span className="text-offwhite">{profile?.email ?? "—"}</span></p>
        <ProfileForm fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
      </div>
    </div>
  );
}
