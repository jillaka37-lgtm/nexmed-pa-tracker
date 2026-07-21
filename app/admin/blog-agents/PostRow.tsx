"use client";

import { useActionState, useState } from "react";
import { decideBlogPost, submitBlogFeedback, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

export function PostRow({ id, title, status, score }: { id: string; title: string; status: string; score: number | null }) {
  const [, decideAction, decidePending] = useActionState(decideBlogPost, initial);
  const [, feedbackAction, feedbackPending] = useActionState(submitBlogFeedback, initial);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <tr className="border-b border-divider align-top">
      <td className="px-4 py-3 text-offwhite">{title}</td>
      <td className="px-4 py-3 text-muted">{score != null ? Math.round(score) : "—"}</td>
      <td className="px-4 py-3">
        <span className={status === "published" ? "text-health" : "text-muted"}>{status}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <form action={decideAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value={status === "published" ? "draft" : "published"} />
            <Button type="submit" size="sm" variant={status === "published" ? "outline" : "primary"} disabled={decidePending}>
              {status === "published" ? "Unpublish" : "Publish"}
            </Button>
          </form>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowFeedback((v) => !v)}>
            Feedback
          </Button>
        </div>
        {showFeedback && (
          <form action={feedbackAction} className="mt-2 space-y-2">
            <input type="hidden" name="post_id" value={id} />
            <textarea
              name="comment"
              rows={2}
              placeholder="What should the writer do differently?"
              className="w-full rounded-lg border border-divider bg-navy px-3 py-2 text-xs text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
            />
            <div className="flex gap-2">
              <Button type="submit" name="rating" value="1" size="sm" variant="outline" disabled={feedbackPending}>
                👍
              </Button>
              <Button type="submit" name="rating" value="-1" size="sm" variant="outline" disabled={feedbackPending}>
                👎
              </Button>
            </div>
          </form>
        )}
      </td>
    </tr>
  );
}
