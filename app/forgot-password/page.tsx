import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      </div>
      <div className="mt-8 rounded-2xl border border-divider bg-surface p-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
