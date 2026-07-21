"use client";

import { useActionState } from "react";
import { retireLesson, type StudioState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: StudioState = { ok: false };

export function LessonRow({ id, agent, lesson, source }: { id: string; agent: string; lesson: string; source: string }) {
  const [, action, pending] = useActionState(retireLesson, initial);

  return (
    <form action={action} className="flex items-start justify-between gap-4 rounded-xl border border-divider bg-card p-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">{agent} · {source}</p>
        <p className="mt-1 text-sm text-offwhite">{lesson}</p>
      </div>
      <Button type="submit" size="sm" variant="ghost" disabled={pending}>
        Retire
      </Button>
    </form>
  );
}
