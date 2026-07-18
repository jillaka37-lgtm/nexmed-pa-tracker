import type { CrmState } from "@/app/crm/actions";

export const inputClass =
  "w-full rounded-[8px] border border-divider bg-navy px-3 py-2 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none";

export function Feedback({ state }: { state: CrmState }) {
  if (state.error) return <p className="text-sm text-gold">{state.error}</p>;
  if (state.ok && state.message) return <p className="text-sm text-health">{state.message}</p>;
  return null;
}

export const STATUS_STYLES: Record<string, string> = {
  new: "bg-divider text-muted",
  contacted: "bg-sky/15 text-sky",
  qualified: "bg-gold/15 text-gold",
  converted: "bg-health/15 text-health",
  lost: "bg-red-500/15 text-red-400",
  won: "bg-health/15 text-health",
  open: "bg-sky/15 text-sky",
};

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}
