import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { NewCaseForm } from "./NewCaseForm";

export const metadata: Metadata = { title: "Prior Authorization Drafts" };

export default async function PriorAuthPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/prior-auth");
  if (!(await isAdmin())) redirect("/login?redirect=/prior-auth");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            Staff tool
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-offwhite sm:text-4xl">
            Draft a prior authorization letter
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Enter the case details below and get a first draft of the medical
            necessity letter in seconds. Always review before sending — this
            drafts the letter, it doesn&rsquo;t submit it.
          </p>
        </div>
        <Link href="/prior-auth/dashboard" className="shrink-0 text-sm text-teal hover:underline">
          View all drafts →
        </Link>
      </div>

      <div className="rounded-2xl border border-divider bg-card p-6 sm:p-8">
        <NewCaseForm />
      </div>

      <p className="mt-6 text-sm text-muted">
        Want to see what a finished draft looks like first?{" "}
        <Link href="/prior-auth/sample" className="text-teal hover:underline">
          View a sample draft
        </Link>
        .
      </p>
    </div>
  );
}
