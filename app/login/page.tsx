import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.pexels.com/photos/15114245/pexels-photo-15114245.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/88 to-teal/20" />
    <div className="relative mx-auto flex max-w-md w-full flex-col">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to manage your consultations.
        </p>
      </div>
      <div className="mt-8 rounded-2xl border border-divider bg-surface p-8">
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
    </div>
  );
}
