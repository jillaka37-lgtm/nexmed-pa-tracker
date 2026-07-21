"use client";

import { useActionState, useState } from "react";
import { decideContentPiece, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

type Slide = { kicker: string; heading: string; text: string };

/** HTML/CSS layout, not AI image generation — deterministic brand-consistent
 * rendering beats asking a model to be visually creative for a carousel. */
function SlidePreview({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  return (
    <div className="flex aspect-square w-40 shrink-0 flex-col justify-between rounded-lg border border-divider bg-navy p-3">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-teal">{slide.kicker}</span>
      <div>
        <p className="text-sm font-bold text-offwhite">{slide.heading}</p>
        <p className="mt-1 text-xs text-muted">{slide.text}</p>
      </div>
      <span className="text-right text-[10px] text-muted">{index + 1}/{total}</span>
    </div>
  );
}

export function CarouselApprovalCard({
  id,
  hook,
  body,
  slides,
  hashtags,
  score,
}: {
  id: string;
  hook: string | null;
  body: string;
  slides: Slide[];
  hashtags: string[];
  score: number | null;
}) {
  const [state, formAction, pending] = useActionState(decideContentPiece, initial);
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="rounded-2xl border border-divider bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">Instagram carousel</p>
        {score != null && <span className="text-xs text-muted">editor score {Math.round(score)}/100</span>}
      </div>
      {hook && <p className="mt-2 font-semibold text-offwhite">{hook}</p>}

      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {slides.map((s, i) => (
          <SlidePreview key={i} slide={s} index={i} total={slides.length} />
        ))}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{body}</p>
      <p className="mt-2 text-xs text-teal">{hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}</p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="body" value={body} />

        {rejecting && (
          <textarea
            name="reject_reason"
            required
            rows={2}
            placeholder="Why is this being rejected?"
            className="w-full rounded-lg border border-divider bg-navy px-4 py-3 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none"
          />
        )}

        {state.error && <p className="text-sm text-gold">{state.error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="decision" value="approved" size="sm" disabled={pending}>
            {pending ? "…" : "Approve"}
          </Button>
          {rejecting ? (
            <Button type="submit" name="decision" value="rejected" variant="ghost" size="sm" disabled={pending}>
              Confirm reject
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setRejecting(true)}>
              Reject
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
