import { runSocialEditor, type SocialChannel } from "./social-editor";
import type { SocialCheck } from "./social-checks";
import type { BrandVoice, SocialBrief, SocialReview } from "./types";
import type { makeStepRunner } from "./run-steps";

/**
 * Shared "write -> deterministic checks -> editor -> revise if needed"
 * loop. Every social pipeline (carousel now, LinkedIn/reels later) follows
 * exactly this flow and only the writer functions differ — written once,
 * reused by all of them. Pulled out only once a second real consumer
 * showed up, not preemptively.
 */
export const MAX_SOCIAL_REVISION_ROUNDS = 1;

export type SocialLoopResult<T> = {
  draft: T;
  review: SocialReview;
  checks: SocialCheck[];
  revisionRounds: number;
};

type StepFn = ReturnType<typeof makeStepRunner>["step"];

export async function writeAndReview<T>(args: {
  step: StepFn;
  writerAgent: string;
  label: string;
  brand: BrandVoice;
  channel: SocialChannel;
  brief: SocialBrief;
  write: () => Promise<T>;
  revise: (draft: T, review: SocialReview, failedChecks: SocialCheck[]) => Promise<T>;
  check: (draft: T) => SocialCheck[];
  describe: (draft: T) => string;
}): Promise<SocialLoopResult<T>> {
  const { step, writerAgent, label, brand, channel, brief } = args;

  let draft = await step(writerAgent, `${label} copywriter — first draft`, async () => {
    const out = await args.write();
    return { output: out, summary: `draft written — ${args.describe(out)}` };
  });

  let checks = args.check(draft);

  const review1 = await step("social-editor", `Social editor — ${label}`, async () => {
    const out = await runSocialEditor({ brand, channel, brief, draft, failedChecks: checks.filter((c) => !c.pass) });
    const passed = checks.filter((c) => c.pass).length;
    return { output: out, summary: `score ${out.score}/100 — checklist ${passed}/${checks.length} passed` };
  });
  let review = review1;

  /**
   * Revision trigger is an OR, not just the editor's verdict: editor
   * judgment OR any failed deterministic check. In the reference build,
   * the editor once scored 74 and approved a post whose hook was 3x the
   * allowed length — the model's verdict silently overrode what code had
   * already measured. A failed check must force revision on its own.
   */
  const needsRevision = (r: SocialReview, cs: SocialCheck[]) => r.verdict === "revise" || cs.some((c) => !c.pass);

  let revisionRounds = 0;
  while (needsRevision(review, checks) && revisionRounds < MAX_SOCIAL_REVISION_ROUNDS) {
    revisionRounds++;
    const failed = checks.filter((c) => !c.pass);
    const previousReview = review;
    const previousDraft = draft;

    draft = await step(writerAgent, `${label} copywriter — revision`, async () => {
      const out = await args.revise(previousDraft, previousReview, failed);
      return { output: out, summary: `revised based on ${previousReview.issues.length} issue(s)` };
    });

    checks = args.check(draft);

    review = await step("social-editor", `Social editor — re-review ${label}`, async () => {
      const out = await runSocialEditor({ brand, channel, brief, draft, failedChecks: checks.filter((c) => !c.pass) });
      const passed = checks.filter((c) => c.pass).length;
      return { output: out, summary: `score ${out.score}/100 — checklist ${passed}/${checks.length} passed` };
    });
  }
  // Still failing after the round cap: keep it as-is, saved as a draft so
  // a human makes the final call — same human-in-the-loop pattern as the
  // LinkedIn pipeline.

  return { draft, review, checks, revisionRounds };
}
