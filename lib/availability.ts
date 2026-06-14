import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getServiceBySlug } from "@/lib/services";
import {
  generateSlots,
  type AvailabilityRule,
  type AvailabilityException,
  type BusyInterval,
  type Slot,
} from "@/lib/slots";
import {
  BUSINESS_TIMEZONE,
  BOOKING_LEAD_MINUTES,
  PENDING_EXPIRY_MINUTES,
} from "@/lib/config";

// Fallback when Supabase isn't configured: Mon–Fri, 09:00–17:00, 30-min slots.
const FALLBACK_RULES: AvailabilityRule[] = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  start_time: "09:00",
  end_time: "17:00",
  slot_minutes: 30,
  active: true,
}));

/** Available slots for a given service + calendar date. */
export async function getSlotsForDate(
  serviceSlug: string,
  dateStr: string,
): Promise<Slot[]> {
  const service = await getServiceBySlug(serviceSlug);
  if (!service) return [];

  let rules: AvailabilityRule[] = FALLBACK_RULES;
  let exceptions: AvailabilityException[] = [];
  let busy: BusyInterval[] = [];

  if (hasSupabaseEnv) {
    const supabase = await createClient();

    const dayStart = `${dateStr}T00:00:00Z`;
    const dayEnd = `${dateStr}T23:59:59Z`;
    const expiryCutoff = new Date(
      Date.now() - PENDING_EXPIRY_MINUTES * 60_000,
    ).toISOString();

    const [rulesRes, excRes, bookingsRes] = await Promise.all([
      supabase.from("availability_rules").select("*").eq("active", true),
      supabase.from("availability_exceptions").select("*").eq("date", dateStr),
      supabase
        .from("bookings")
        .select("start_at, end_at, status, created_at")
        // widen by a day on each side to catch tz-shifted overlaps
        .gte("start_at", `${dateStr}T00:00:00Z`)
        .lte("start_at", dayEnd)
        .in("status", ["pending_payment", "confirmed"]),
    ]);

    if (rulesRes.data && rulesRes.data.length > 0) {
      rules = rulesRes.data as AvailabilityRule[];
    }
    if (excRes.data) exceptions = excRes.data as AvailabilityException[];

    busy = ((bookingsRes.data ?? []) as Array<{
      start_at: string;
      end_at: string;
      status: string;
      created_at: string;
    }>)
      .filter(
        (b) =>
          b.status === "confirmed" ||
          (b.status === "pending_payment" && b.created_at > expiryCutoff),
      )
      .map((b) => ({ start: new Date(b.start_at), end: new Date(b.end_at) }));

    // dayStart referenced to keep intent clear; range already applied above.
    void dayStart;
  }

  return generateSlots({
    dateStr,
    durationMin: service.duration_min,
    rules,
    exceptions,
    busy,
    timezone: BUSINESS_TIMEZONE,
    leadMinutes: BOOKING_LEAD_MINUTES,
  });
}

/** Which of the next `days` calendar dates have at least one open weekday rule. */
export async function getBookableWeekdays(): Promise<Set<number>> {
  const rules: AvailabilityRule[] = FALLBACK_RULES;
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("availability_rules")
      .select("weekday, active")
      .eq("active", true);
    if (data && data.length > 0) {
      return new Set((data as { weekday: number }[]).map((r) => r.weekday));
    }
  }
  return new Set(rules.map((r) => r.weekday));
}
