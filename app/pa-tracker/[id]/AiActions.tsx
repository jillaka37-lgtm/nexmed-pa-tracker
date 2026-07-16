"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ActionKey = "explain-rejection" | "suggest-action" | "draft-prescriber-message" | "draft-patient-update" | "summarize";

const ACTIONS: { key: ActionKey; label: string; needsInput?: boolean }[] = [
  { key: "explain-rejection", label: "Explain rejection code", needsInput: true },
  { key: "suggest-action", label: "Suggest next action" },
  { key: "draft-prescriber-message", label: "Draft prescriber message" },
  { key: "draft-patient-update", label: "Draft patient update" },
  { key: "summarize", label: "Summarize case history" },
];

export function AiActions({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [active, setActive] = useState<ActionKey | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [rejectionCodeText, setRejectionCodeText] = useState("");
  const [saved, setSaved] = useState(false);

  async function run(key: ActionKey) {
    setActive(key);
    setPending(true);
    setError(null);
    setResult(null);
    setSaved(false);

    const body = key === "explain-rejection" ? { rejectionCodeText } : {};

    try {
      const res = await fetch(`/api/pa-tracker/cases/${caseId}/ai/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "AI generation failed.");
        return;
      }
      setResult(data.result);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setPending(false);
    }
  }

  async function saveToTimeline() {
    if (!active || result === null) return;
    setPending(true);
    try {
      const res = await fetch(`/api/pa-tracker/cases/${caseId}/ai/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: active, output: result }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button
            key={a.key}
            size="sm"
            variant={active === a.key ? "primary" : "outline"}
            disabled={pending}
            onClick={() => run(a.key)}
          >
            {pending && active === a.key ? "Thinking…" : a.label}
          </Button>
        ))}
      </div>

      {active === "explain-rejection" && (
        <input
          value={rejectionCodeText}
          onChange={(e) => setRejectionCodeText(e.target.value)}
          placeholder="Paste the insurer's rejection code/text here, then click the button above"
          className="mt-3 w-full rounded-lg border border-divider bg-navy px-3 py-2 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
      )}

      {error && <p className="mt-3 text-sm text-gold">{error}</p>}

      {result !== null && !error && (
        <div className="mt-3 rounded-lg border border-divider bg-navy p-4 text-sm text-offwhite/90">
          <pre className="whitespace-pre-wrap font-sans">
            {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
          </pre>
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={saveToTimeline} disabled={pending || saved}>
              {saved ? "Saved to timeline" : "Save to timeline"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
