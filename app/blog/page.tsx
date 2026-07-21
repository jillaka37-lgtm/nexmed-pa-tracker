import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Blog · NexMed" };
export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  // Anon client, not admin — RLS's "public reads published blog_posts"
  // policy is the actual access control here, defense-in-depth instead of
  // relying on this route never developing a bug that leaks drafts.
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">NexMed</p>
      <h1 className="mb-8 mt-2 font-serif text-4xl font-bold text-offwhite">Blog</h1>

      {!posts || posts.length === 0 ? (
        <p className="text-muted">No articles published yet.</p>
      ) : (
        <div className="space-y-8">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="block rounded-2xl border border-divider bg-card p-6 transition-colors hover:border-teal/40">
              <h2 className="font-serif text-xl font-bold text-offwhite">{p.title}</h2>
              {p.excerpt && <p className="mt-2 text-sm text-muted">{p.excerpt}</p>}
              {p.published_at && (
                <p className="mt-3 text-xs text-muted">{new Date(p.published_at).toLocaleDateString()}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
