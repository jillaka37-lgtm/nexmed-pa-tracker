import { addMinutes } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export type AvailabilityRule = {
  weekday: number; // 0 = Sunday
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  slot_minutes: number;
  active: boolean;
};

export type AvailabilityException = {
  date: string; // "YYYY-MM-DD"
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
};

export type BusyInterval = { start: Date; end: Date };

export type Slot = {
  startISO: string;
  endISO: string;
  label: string; // e.g. "9:30 AM"
};

function hhmm(t: string): { h: number; m: number } {
  const [h, m] = t.split(":");
  return { h: Number(h), m: Number(m) };
}

/** Weekday (0=Sun..6=Sat) of a calendar date — tz-independent. */
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

/** Build a UTC instant for a "YYYY-MM-DD" + "HH:MM" wall-clock time in `tz`. */
function instant(dateStr: string, h: number, m: number, tz: string): Date {
  const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return fromZonedTime(`${dateStr}T${time}:00`, tz);
}

/**
 * Generate bookable slots for a single date.
 *
 * Slots come from the active rules for that weekday (or a special-hours
 * exception), stepped by slot_minutes, sized to the service duration. Slots in
 * the past (within the lead buffer) or overlapping a busy interval are removed.
 */
export function generateSlots(params: {
  dateStr: string;
  durationMin: number;
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  busy: BusyInterval[];
  timezone: string;
  now?: Date;
  leadMinutes?: number;
}): Slot[] {
  const {
    dateStr,
    durationMin,
    rules,
    exceptions,
    busy,
    timezone,
    now = new Date(),
    leadMinutes = 0,
  } = params;

  const exception = exceptions.find((e) => e.date === dateStr);
  if (exception?.is_closed) return [];

  // Determine the open windows for this date.
  let windows: { start: string; end: string; step: number }[];
  if (exception && !exception.is_closed && exception.start_time && exception.end_time) {
    windows = [
      { start: exception.start_time, end: exception.end_time, step: 30 },
    ];
  } else {
    const weekday = weekdayOf(dateStr);
    windows = rules
      .filter((r) => r.active && r.weekday === weekday)
      .map((r) => ({
        start: r.start_time,
        end: r.end_time,
        step: r.slot_minutes,
      }));
  }
  if (windows.length === 0) return [];

  const earliest = addMinutes(now, leadMinutes);
  const slots: Slot[] = [];
  const seen = new Set<string>();

  for (const w of windows) {
    const { h: sh, m: sm } = hhmm(w.start);
    const { h: eh, m: em } = hhmm(w.end);
    const windowEnd = instant(dateStr, eh, em, timezone);

    let cursor = instant(dateStr, sh, sm, timezone);
    while (true) {
      const slotEnd = addMinutes(cursor, durationMin);
      if (slotEnd.getTime() > windowEnd.getTime()) break;

      const key = cursor.toISOString();
      const inPast = cursor.getTime() < earliest.getTime();
      const overlaps = busy.some(
        (b) => cursor.getTime() < b.end.getTime() && slotEnd.getTime() > b.start.getTime(),
      );

      if (!inPast && !overlaps && !seen.has(key)) {
        seen.add(key);
        slots.push({
          startISO: key,
          endISO: slotEnd.toISOString(),
          label: formatInTimeZone(cursor, timezone, "h:mm a"),
        });
      }
      cursor = addMinutes(cursor, w.step);
    }
  }

  slots.sort((a, b) => a.startISO.localeCompare(b.startISO));
  return slots;
}
