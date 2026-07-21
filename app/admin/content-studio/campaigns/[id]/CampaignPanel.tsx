"use client";

import { useEffect, useState } from "react";

type Channel = {
  status: "running" | "done" | "error" | "pending";
  error: string | null;
  steps: { agent: string; label: string; status: string; summary?: string }[];
  output: Record<string, unknown> | null;
};

type CampaignData = {
  id: string;
  theme: string;
  narrative: Record<string, unknown> | null;
  channels: { blog: Channel; instagram: Channel; linkedin: Channel; reels: Channel };
};

const statusColor: Record<string, string> = { running: "text-teal", done: "text-health", error: "text-red-400", pending: "text-muted" };
const CHANNEL_LABEL = { blog: "Blog", instagram: "Instagram", linkedin: "LinkedIn", reels: "Reels" } as const;

function BlogOutput({ output }: { output: Record<string, unknown> }) {
  return (
    <div>
      <p className="font-semibold text-offwhite">{String(output.title)}</p>
      <p className="mt-1 text-sm text-muted">{String(output.excerpt ?? "")}</p>
      <p className="mt-2 text-xs text-teal">
        {output.status === "published" ? (
          <a href={`/blog/${output.slug}`} target="_blank" rel="noreferrer" className="underline">
            View published post →
          </a>
        ) : (
          "Saved as draft"
        )}
      </p>
    </div>
  );
}

function CarouselOutput({ output }: { output: Record<string, unknown> }) {
  const slides = (output.slides as { heading: string; text: string }[]) ?? [];
  return (
    <div>
      <p className="font-semibold text-offwhite">{String(output.hook ?? "")}</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {slides.map((s, i) => (
          <div key={i} className="w-28 shrink-0 rounded-lg border border-divider bg-navy p-2">
            <p className="text-xs font-bold text-offwhite">{s.heading}</p>
            <p className="mt-1 text-[10px] text-muted">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextOutput({ output }: { output: Record<string, unknown> }) {
  return (
    <div>
      {output.hook != null && <p className="font-semibold text-offwhite">{String(output.hook)}</p>}
      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{String(output.body ?? "")}</p>
    </div>
  );
}

function ChannelCard({ label, channel }: { label: string; channel: Channel }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl border border-divider bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg font-bold text-offwhite">{label}</p>
        <span className={`text-xs font-semibold ${statusColor[channel.status]}`}>{channel.status}</span>
      </div>

      {channel.error && <p className="mt-2 text-xs text-red-400">{channel.error}</p>}

      {channel.output ? (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-3 block w-full text-left">
          <div className="rounded-xl border border-divider bg-navy p-3">
            {"slides" in channel.output ? <CarouselOutput output={channel.output} /> : "slug" in channel.output ? <BlogOutput output={channel.output} /> : <TextOutput output={channel.output} />}
          </div>
          <p className="mt-2 text-xs text-teal">{expanded ? "Hide steps" : "Show pipeline steps"}</p>
        </button>
      ) : (
        <p className="mt-3 text-xs text-muted">{channel.status === "pending" ? "Not started yet" : "Working…"}</p>
      )}

      {expanded && (
        <ol className="mt-2 space-y-1">
          {channel.steps.map((s, i) => (
            <li key={i} className="text-xs text-muted">
              <span className={statusColor[s.status] ?? "text-muted"}>{s.status === "done" ? "✓" : s.status === "error" ? "✗" : "…"}</span> {s.label}
              {s.summary ? ` — ${s.summary}` : ""}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function CampaignPanel({ campaignId, initial }: { campaignId: string; initial: CampaignData }) {
  const [data, setData] = useState<CampaignData>(initial);

  const anyRunning = Object.values(data.channels).some((c) => c.status === "running" || c.status === "pending");

  useEffect(() => {
    if (!anyRunning) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/content-studio/campaigns/${campaignId}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    }, 2000);
    return () => clearInterval(timer);
  }, [campaignId, anyRunning]);

  const narrative = data.narrative as { bigIdea?: string; tension?: string; resolution?: string; error?: string } | null;

  return (
    <div>
      {narrative?.error && (
        <p className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
          Campaign strategist failed: {narrative.error}
        </p>
      )}
      {narrative?.bigIdea && (
        <div className="mb-8 rounded-2xl border border-divider bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">Mother narrative</p>
          <p className="mt-2 font-serif text-xl font-bold text-offwhite">{narrative.bigIdea}</p>
          <p className="mt-2 text-sm text-muted">
            <span className="text-offwhite">Tension:</span> {narrative.tension}
          </p>
          <p className="mt-1 text-sm text-muted">
            <span className="text-offwhite">Resolution:</span> {narrative.resolution}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(CHANNEL_LABEL) as (keyof typeof CHANNEL_LABEL)[]).map((key) => (
          <ChannelCard key={key} label={CHANNEL_LABEL[key]} channel={data.channels[key]} />
        ))}
      </div>
    </div>
  );
}
