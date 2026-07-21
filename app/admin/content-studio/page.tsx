import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BriefForm } from "./BriefForm";
import { CarouselForm } from "./CarouselForm";
import { StandaloneLinkedinForm } from "./StandaloneLinkedinForm";
import { ReelsForm } from "./ReelsForm";
import { RepurposeForm } from "./RepurposeForm";
import { CampaignForm } from "./CampaignForm";
import { BrandVoiceForm } from "./BrandVoiceForm";
import { ApprovalCard } from "./ApprovalCard";
import { CarouselApprovalCard } from "./CarouselApprovalCard";

export const metadata: Metadata = { title: "Content Studio · Staff" };
export const dynamic = "force-dynamic";

export default async function ContentStudioPage() {
  const admin = createAdminClient();

  const [{ data: brand }, { data: pieces, error: piecesError }, { data: posts }, { data: campaigns }] = await Promise.all([
    admin.from("brand_voice").select("*").limit(1).single(),
    admin
      .from("content_pieces")
      .select("id, platform, hook, body, slides, hashtags, score, status, reject_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("blog_posts").select("id, title").eq("status", "published").order("created_at", { ascending: false }).limit(50),
    admin.from("content_campaigns").select("id, theme, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  if (piecesError) {
    return (
      <div>
        <h1 className="font-serif text-3xl font-bold text-offwhite">Content Studio</h1>
        <p className="mt-4 text-sm text-gold">Failed to load content pieces: {piecesError.message}</p>
      </div>
    );
  }

  const rows = pieces ?? [];
  const drafts = rows.filter((p) => p.status === "draft");
  const decided = rows.filter((p) => p.status !== "draft");

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal">Operations</p>
      <h1 className="mb-2 mt-2 font-serif text-3xl font-bold text-offwhite">Content Studio</h1>
      <p className="mb-8 text-muted">
        LinkedIn, Instagram, reels, repurposed articles, and multi-channel campaigns. Nothing is final until you approve it here.
      </p>

      {campaigns && campaigns.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-serif text-lg font-bold text-offwhite">Recent campaigns</h2>
          <div className="flex flex-wrap gap-2">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/admin/content-studio/campaigns/${c.id}`}
                className="rounded-full border border-divider px-3 py-1.5 text-xs text-offwhite hover:border-teal hover:text-teal"
              >
                {c.theme}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <BriefForm />
          <CarouselForm />
          <StandaloneLinkedinForm />
          <ReelsForm />
          <RepurposeForm posts={posts ?? []} />
          <CampaignForm />
          {brand && (
            <BrandVoiceForm
              id={brand.id}
              tone={brand.tone}
              audience={brand.audience}
              bannedWords={brand.banned_words ?? []}
            />
          )}
        </div>

        <div>
          <h2 className="mb-3 font-serif text-lg font-bold text-offwhite">Approval queue</h2>
          {drafts.length === 0 ? (
            <p className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">
              No drafts waiting. Submit a brief to generate one.
            </p>
          ) : (
            <div className="space-y-4">
              {drafts.map((p) =>
                p.platform === "carousel" ? (
                  <CarouselApprovalCard
                    key={p.id}
                    id={p.id}
                    hook={p.hook}
                    body={p.body}
                    slides={p.slides ?? []}
                    hashtags={p.hashtags ?? []}
                    score={p.score}
                  />
                ) : (
                  <ApprovalCard key={p.id} id={p.id} hook={p.hook} body={p.body} />
                ),
              )}
            </div>
          )}

          {decided.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 font-serif text-lg font-bold text-offwhite">Archive</h2>
              <div className="overflow-hidden rounded-2xl border border-divider bg-card">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-3 font-medium">Platform</th>
                      <th className="px-4 py-3 font-medium">Hook</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Decided</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decided.map((p) => (
                      <tr key={p.id} className="border-b border-divider">
                        <td className="px-4 py-3 text-muted capitalize">{p.platform}</td>
                        <td className="px-4 py-3 text-offwhite">{p.hook ?? "(no hook)"}</td>
                        <td className="px-4 py-3">
                          <span className={p.status === "approved" ? "text-health" : "text-muted"}>
                            {p.status}
                            {p.status === "rejected" && p.reject_reason ? ` — ${p.reject_reason}` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
