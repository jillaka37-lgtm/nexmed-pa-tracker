import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatInTimeZone } from "date-fns-tz";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { formatPrice } from "@/lib/format";
import { BUSINESS_TIMEZONE } from "@/lib/config";
import {
  MeetingLinkForm,
  AvailabilityAddForm,
  DeleteRuleButton,
  ServiceForm,
} from "@/components/admin/forms";

export const metadata: Metadata = { title: "Admin" };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminPage() {
  if (!hasSupabaseEnv) redirect("/login?redirect=/admin");
  if (!(await isAdmin())) redirect("/dashboard");

  const admin = createAdminClient();

  const [
    { data: bookingRows },
    { data: rules },
    { data: services },
    { data: refills },
    { data: orderRows },
    { data: products },
    { count: chatSessionCount },
    { data: chatLeads },
    { data: recentMessages },
    { data: unansweredMessages },
  ] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id, start_at, status, amount_cents, currency, meeting_link, user_id, service_id",
      )
      .order("start_at", { ascending: false })
      .limit(100),
    admin
      .from("availability_rules")
      .select("id, weekday, start_time, end_time, slot_minutes")
      .order("weekday")
      .order("start_time"),
    admin
      .from("services")
      .select("id, slug, title, description, duration_min, price_cents, active")
      .order("sort_order"),
    admin
      .from("prescription_refills")
      .select(
        "id, created_at, full_name, email, phone, medication_name, dosage, fulfilment, status",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("orders")
      .select(
        "id, created_at, email, status, amount_cents, currency, order_items(name, quantity, unit_amount_cents)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("products")
      .select(
        "id, name, category, price_cents, currency, stock, requires_rx, active",
      )
      .order("sort_order", { ascending: true }),
    admin.from("chat_sessions").select("*", { count: "exact", head: true }),
    admin
      .from("chat_leads")
      .select("id, name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("chat_messages")
      .select("id, content, feedback, latency_ms, tokens_used, rag_hit, score_faithfulness, score_relevance, score_tone, score_overall, created_at")
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("chat_messages")
      .select("id, content, created_at")
      .eq("role", "assistant")
      .eq("rag_hit", false)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const bookings = bookingRows ?? [];
  const orders = orderRows ?? [];

  // Resolve client + service labels (no direct FK join between bookings/profiles).
  const userIds = [...new Set(bookings.map((b) => b.user_id))];
  const serviceIds = [
    ...new Set(bookings.map((b) => b.service_id).filter(Boolean)),
  ];
  const [{ data: profiles }, { data: bookingServices }] = await Promise.all([
    userIds.length
      ? admin
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
    serviceIds.length
      ? admin.from("services").select("id, title").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  // Chatbot analytics
  type MsgRow = { feedback: number | null; latency_ms: number | null; tokens_used: number | null; score_faithfulness: number | null; score_relevance: number | null; score_tone: number | null; score_overall: number | null };
  const msgs: MsgRow[] = (recentMessages ?? []) as MsgRow[];
  const ratedMsgs = msgs.filter((m) => m.feedback !== null);
  const thumbsUp = ratedMsgs.filter((m) => m.feedback === 1).length;
  const thumbsDown = ratedMsgs.filter((m) => m.feedback === -1).length;
  const satisfactionRate = ratedMsgs.length > 0 ? Math.round((thumbsUp / ratedMsgs.length) * 100) : null;
  const avgLatency = msgs.filter((m) => m.latency_ms).length > 0
    ? Math.round(msgs.reduce((s, m) => s + (m.latency_ms ?? 0), 0) / msgs.filter((m) => m.latency_ms).length)
    : null;
  const avgTokens = msgs.filter((m) => m.tokens_used).length > 0
    ? Math.round(msgs.reduce((s, m) => s + (m.tokens_used ?? 0), 0) / msgs.filter((m) => m.tokens_used).length)
    : null;
  const scoredMsgs = msgs.filter((m) => m.score_overall !== null);
  const avg = (key: keyof MsgRow) => scoredMsgs.length > 0
    ? (scoredMsgs.reduce((s, m) => s + ((m[key] as number) ?? 0), 0) / scoredMsgs.length).toFixed(1)
    : null;

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const serviceTitleById = new Map(
    (bookingServices ?? []).map((s) => [s.id, s.title]),
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-2 text-muted">
        Manage bookings, availability, and services.
      </p>

      {/* Chatbot Analytics */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Chatbot Analytics</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted uppercase tracking-wide">Total Sessions</p>
            <p className="mt-1 text-2xl font-bold">{chatSessionCount ?? 0}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted uppercase tracking-wide">Satisfaction</p>
            <p className="mt-1 text-2xl font-bold">{satisfactionRate !== null ? `${satisfactionRate}%` : "—"}</p>
            {ratedMsgs.length > 0 && <p className="text-xs text-muted mt-1">{thumbsUp}👍 {thumbsDown}👎</p>}
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted uppercase tracking-wide">Avg Latency</p>
            <p className="mt-1 text-2xl font-bold">{avgLatency !== null ? `${avgLatency}ms` : "—"}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted uppercase tracking-wide">Avg Tokens</p>
            <p className="mt-1 text-2xl font-bold">{avgTokens ?? "—"}</p>
          </div>
        </div>

        {/* LLM-as-judge scores */}
        {scoredMsgs.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold">LLM-as-Judge Scores <span className="text-xs text-muted font-normal">({scoredMsgs.length} responses evaluated, scale 1–5)</span></h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted uppercase tracking-wide">Faithfulness</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{avg("score_faithfulness") ?? "—"}</p>
                <p className="text-xs text-muted mt-1">No hallucination</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted uppercase tracking-wide">Relevance</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{avg("score_relevance") ?? "—"}</p>
                <p className="text-xs text-muted mt-1">Answered the question</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted uppercase tracking-wide">Brand Tone</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{avg("score_tone") ?? "—"}</p>
                <p className="text-xs text-muted mt-1">Warm & professional</p>
              </div>
              <div className="rounded-xl border p-4 bg-blue-50 border-blue-200">
                <p className="text-xs text-muted uppercase tracking-wide">Overall</p>
                <p className="mt-1 text-2xl font-bold text-blue-700">{avg("score_overall") ?? "—"}</p>
                <p className="text-xs text-muted mt-1">Combined score</p>
              </div>
            </div>
          </div>
        )}
        {scoredMsgs.length === 0 && (
          <p className="mt-4 text-sm text-muted">LLM-as-judge scores will appear here after the first conversations.</p>
        )}

        {/* Unanswered questions */}
        {(unansweredMessages ?? []).length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-red-600">Unanswered Questions (no KB match)</h3>
            <div className="mt-2 space-y-2">
              {(unansweredMessages ?? []).map((m: { id: string; content: string; created_at: string }) => (
                <div key={m.id} className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm">
                  <p className="text-red-800">{m.content}</p>
                  <p className="text-xs text-red-400 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat leads */}
        {(chatLeads ?? []).length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold">Chat Leads</h3>
            <table className="mt-2 w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left text-muted">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {(chatLeads ?? []).map((l: { id: string; name: string | null; email: string | null; created_at: string }) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-2 pr-4">{l.name ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {l.email ? <a href={`mailto:${l.email}`} className="text-blue-600 underline">{l.email}</a> : "—"}
                    </td>
                    <td className="py-2 text-muted text-xs">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bookings */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Bookings</h2>
        <div className="mt-4 space-y-4">
          {bookings.length === 0 ? (
            <p className="text-muted">No bookings yet.</p>
          ) : (
            bookings.map((b) => {
              const p = profileById.get(b.user_id);
              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-divider bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-offwhite">
                        {serviceTitleById.get(b.service_id ?? "") ??
                          "Consultation"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatInTimeZone(
                          new Date(b.start_at),
                          BUSINESS_TIMEZONE,
                          "EEE, MMM d · h:mm a",
                        )}{" "}
                        · {p?.full_name ?? "Unknown"} ({p?.email ?? "no email"})
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="block font-mono text-gold">
                        {formatPrice(b.amount_cents, b.currency)}
                      </span>
                      <span className="text-muted">{b.status}</span>
                    </div>
                  </div>
                  {b.status === "confirmed" && (
                    <MeetingLinkForm
                      bookingId={b.id}
                      current={b.meeting_link}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Refill requests */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Refill requests</h2>
        <div className="mt-4 space-y-3">
          {(refills ?? []).length === 0 ? (
            <p className="text-muted">No refill requests yet.</p>
          ) : (
            (refills ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-divider bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-offwhite">
                      {r.medication_name}
                      {r.dosage ? (
                        <span className="text-muted"> · {r.dosage}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {r.full_name} · {r.email} · {r.phone}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="block capitalize text-sky">
                      {r.fulfilment}
                    </span>
                    <span className="text-muted">{r.status}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatInTimeZone(
                    new Date(r.created_at),
                    BUSINESS_TIMEZONE,
                    "EEE, MMM d · h:mm a",
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Shop orders */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Shop orders</h2>
        <div className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <p className="text-muted">No orders yet.</p>
          ) : (
            orders.map((o) => {
              const items =
                (o.order_items as {
                  name: string;
                  quantity: number;
                  unit_amount_cents: number;
                }[]) ?? [];
              return (
                <div
                  key={o.id}
                  className="rounded-2xl border border-divider bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-offwhite">
                        {o.email ?? "Guest order"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatInTimeZone(
                          new Date(o.created_at),
                          BUSINESS_TIMEZONE,
                          "EEE, MMM d · h:mm a",
                        )}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="block font-mono text-gold">
                        {formatPrice(o.amount_cents, o.currency)}
                      </span>
                      <span className="text-muted">{o.status}</span>
                    </div>
                  </div>
                  {items.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-divider pt-3 text-sm text-muted">
                      {items.map((it, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>
                            {it.name} × {it.quantity}
                          </span>
                          <span className="font-mono">
                            {formatPrice(
                              it.unit_amount_cents * it.quantity,
                              o.currency,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Availability */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Weekly availability</h2>
        <div className="mt-4 rounded-2xl border border-divider bg-surface p-5">
          {(rules ?? []).length === 0 ? (
            <p className="text-sm text-muted">
              No rules yet. Bookings fall back to Mon to Fri, 9 to 5.
            </p>
          ) : (
            <ul className="space-y-2">
              {(rules ?? []).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between border-b border-divider pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="text-offwhite">
                    <span className="font-medium">{WEEKDAYS[r.weekday]}</span>{" "}
                    {r.start_time.slice(0, 5)} to {r.end_time.slice(0, 5)}{" "}
                    <span className="text-muted">
                      ({r.slot_minutes} min slots)
                    </span>
                  </span>
                  <DeleteRuleButton id={r.id} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 border-t border-divider pt-5">
            <AvailabilityAddForm />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Services</h2>
        <div className="mt-4 space-y-4">
          {(services ?? []).map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-divider bg-surface p-5"
            >
              <ServiceForm
                service={{
                  id: s.id,
                  title: s.title,
                  description: s.description,
                  duration_min: s.duration_min,
                  price_cents: s.price_cents,
                  active: s.active,
                }}
              />
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-divider bg-surface/50 p-5">
            <p className="mb-3 text-sm font-medium text-muted">
              Add a new service
            </p>
            <ServiceForm />
          </div>
        </div>
      </section>

      {/* Shop products */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Shop products</h2>
        <p className="mt-1 text-sm text-muted">
          Catalog is seeded via the database. Edit products in Supabase to change
          price, stock, or availability.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-divider bg-surface">
          {(products ?? []).length === 0 ? (
            <p className="p-5 text-sm text-muted">
              No products yet. Run the shop migration to seed the catalog.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider text-left text-muted">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-divider last:border-0"
                  >
                    <td className="p-4 text-offwhite">
                      {p.name}
                      {p.requires_rx && (
                        <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                          Rx
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted">{p.category}</td>
                    <td className="p-4 font-mono text-gold">
                      {formatPrice(p.price_cents, p.currency)}
                    </td>
                    <td className="p-4 text-muted">{p.stock}</td>
                    <td className="p-4">
                      <span className={p.active ? "text-health" : "text-muted"}>
                        {p.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
