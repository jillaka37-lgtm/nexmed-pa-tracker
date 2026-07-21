import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Set a new password</h1>
        <p className="mt-2 text-sm text-muted">Choose a new password for your account.</p>
      </div>
      <div className="mt-8 rounded-2xl border border-divider bg-surface p-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
