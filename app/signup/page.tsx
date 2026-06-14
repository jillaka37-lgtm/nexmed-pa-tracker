import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-sm text-muted">
          Join NexMed to book and manage your consultations.
        </p>
      </div>
      <div className="mt-8 rounded-2xl border border-divider bg-surface p-8">
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
