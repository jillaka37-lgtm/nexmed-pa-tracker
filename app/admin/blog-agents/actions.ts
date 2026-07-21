"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runBlogPipeline } from "@/lib/blog-agents/orchestrator";
import { distillFeedback } from "@/lib/blog-agents/agents/critic";
import { blogPostFromRow } from "@/lib/blog-agents/types";

export type StudioState = { ok: boolean; error?: string };

export async function startBlogRun(_prev: StudioState, formData: FormData): Promise<StudioState> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };

  const topicHint = String(formData.get("topic_hint") ?? "").trim() || null;
  const admin = createAdminClient();

  const { data: run, error } = await admin
    .from("blog_pipeline_runs")
    .insert({ status: "running", topic_hint: topicHint })
    .select("id")
    .single();
  if (error || !run) return { ok: false, error: error?.message ?? "Failed to start run." };

  after(async () => {
    try {
      await runBlogPipeline({ runId: run.id, topicHint });
    } catch (err) {
      await admin
        .from("blog_pipeline_runs")
        .update({ status: "error", error: err instanceof Error ? err.message : String(err) })
        .eq("id", run.id);
    }
  });

  redirect(`/admin/blog-agents/runs/${run.id}`);
}

export async function decideBlogPost(_prev: StudioState, formData: FormData): Promise<StudioState> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || (decision !== "published" && decision !== "draft")) return { ok: false, error: "Invalid decision." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("blog_posts")
    .update({ status: decision, published_at: decision === "published" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/blog-agents");
  revalidatePath("/blog");
  return { ok: true };
}

/** Turns human feedback into a lesson via the critic agent's own judgment —
 * not a hardcoded "always target the writer" — matching the real
 * arkan-blog-agents distillFeedback behavior. */
export async function submitBlogFeedback(_prev: StudioState, formData: FormData): Promise<StudioState> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };

  const postId = String(formData.get("post_id") ?? "");
  const ratingRaw = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();
  if (!postId || (ratingRaw !== 1 && ratingRaw !== -1)) return { ok: false, error: "Invalid feedback." };
  const rating = ratingRaw as 1 | -1;

  const admin = createAdminClient();
  await admin.from("blog_feedback").insert({ post_id: postId, rating, comment: comment || null });

  const { data: postRow, error: postError } = await admin.from("blog_posts").select("*").eq("id", postId).single();
  if (postError || !postRow) return { ok: false, error: postError?.message ?? "Post not found." };

  try {
    await distillFeedback({ post: blogPostFromRow(postRow), rating, comment });
  } catch {
    // Lesson extraction failing must not lose the feedback itself, which is
    // already saved above.
  }

  revalidatePath("/admin/blog-agents");
  return { ok: true };
}

export async function retireLesson(_prev: StudioState, formData: FormData): Promise<StudioState> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing id." };

  const admin = createAdminClient();
  await admin.from("blog_lessons").update({ active: false }).eq("id", id);
  revalidatePath("/admin/blog-agents");
  return { ok: true };
}
