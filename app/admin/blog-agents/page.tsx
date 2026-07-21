import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { StartPipelineForm } from "./StartPipelineForm";
import { PostRow } from "./PostRow";
import { LessonRow } from "./LessonRow";

export const metadata: Metadata = { title: "Blog Agents · Staff" };
export const dynamic = "force-dynamic";

export default async function BlogAgentsPage() {
  const admin = createAdminClient();
  const [{ data: posts, error: postsError }, { data: lessons }] = await Promise.all([
    admin.from("blog_posts").select("id, title, status, score, created_at").order("created_at", { ascending: false }).limit(50),
    admin.from("blog_lessons").select("id, agent, lesson, source").eq("active", true).order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Operations</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Blog Agents</h1>
      <p className="mb-8 text-muted">
        8-agent blog pipeline for NexMed (idea-scout → strategist → researcher → writer ⇄ editor → seo → publisher → critic).
        Drafts wait here for your review before going live.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <StartPipelineForm />

        <div>
          <h2 className="mb-3 font-serif text-lg font-bold text-offwhite">Posts</h2>
          {postsError ? (
            <p className="text-sm text-gold">Failed to load posts: {postsError.message}</p>
          ) : !posts || posts.length === 0 ? (
            <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">
              No posts yet. Run the pipeline to generate one.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-divider bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <PostRow key={p.id} id={p.id} title={p.title} status={p.status} score={p.score} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-10 font-serif text-lg font-bold text-offwhite">Active lessons</h2>
      {!lessons || lessons.length === 0 ? (
        <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">
          No lessons yet. They accumulate after runs and from your feedback above.
        </p>
      ) : (
        <div className="space-y-2">
          {lessons.map((l) => (
            <LessonRow key={l.id} id={l.id} agent={l.agent} lesson={l.lesson} source={l.source} />
          ))}
        </div>
      )}
    </div>
  );
}
