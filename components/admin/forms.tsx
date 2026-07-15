"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  type AdminState,
  setMeetingLink,
  addAvailabilityRule,
  deleteAvailabilityRule,
  saveService,
} from "@/app/admin/actions";

const initial: AdminState = { ok: false };

const inputClass =
  "w-full rounded-[8px] border border-divider bg-navy px-3 py-2 text-sm text-offwhite placeholder:text-muted focus:border-teal focus:outline-none";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function Feedback({ state }: { state: AdminState }) {
  if (state.error) return <p className="text-sm text-gold">{state.error}</p>;
  if (state.ok && state.message)
    return <p className="text-sm text-health">{state.message}</p>;
  return null;
}

export function MeetingLinkForm({
  bookingId,
  current,
}: {
  bookingId: string;
  current: string | null;
}) {
  const [state, action, pending] = useActionState(setMeetingLink, initial);
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input
        name="meeting_link"
        type="url"
        defaultValue={current ?? ""}
        placeholder="https://meet.google.com/…"
        className={`${inputClass} flex-1 min-w-[220px]`}
      />
      <Button type="submit" size="sm" disabled={pending}>
        {current ? "Update & email" : "Send link"}
      </Button>
      <div className="w-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function AvailabilityAddForm() {
  const [state, action, pending] = useActionState(addAvailabilityRule, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-muted">
        Day
        <select name="weekday" className={`${inputClass} mt-1`} defaultValue="1">
          {WEEKDAYS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted">
        From
        <input
          name="start_time"
          type="time"
          defaultValue="09:00"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-muted">
        To
        <input
          name="end_time"
          type="time"
          defaultValue="17:00"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-muted">
        Slot (min)
        <input
          name="slot_minutes"
          type="number"
          min={10}
          step={5}
          defaultValue={30}
          className={`${inputClass} mt-1 w-24`}
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        Add hours
      </Button>
      <div className="w-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function DeleteRuleButton({ id }: { id: string }) {
  const [, action, pending] = useActionState(deleteAvailabilityRule, initial);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-muted transition-colors hover:text-gold disabled:opacity-50"
      >
        Remove
      </button>
    </form>
  );
}

type ServiceFields = {
  id: string;
  title: string;
  description: string;
  duration_min: number;
  price_cents: number;
  active: boolean;
};

export function ServiceForm({ service }: { service?: ServiceFields }) {
  const [state, action, pending] = useActionState(saveService, initial);
  return (
    <form action={action} className="space-y-3">
      {service && <input type="hidden" name="id" value={service.id} />}
      <input
        name="title"
        defaultValue={service?.title ?? ""}
        placeholder="Service title"
        className={inputClass}
      />
      <textarea
        name="description"
        defaultValue={service?.description ?? ""}
        placeholder="Short description"
        rows={2}
        className={inputClass}
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted">
          Duration (min)
          <input
            name="duration_min"
            type="number"
            min={10}
            step={5}
            defaultValue={service?.duration_min ?? 30}
            className={`${inputClass} mt-1 w-28`}
          />
        </label>
        <label className="text-xs text-muted">
          Price (USD)
          <input
            name="price_dollars"
            type="number"
            min={0}
            step="0.01"
            defaultValue={
              service ? (service.price_cents / 100).toFixed(2) : "65.00"
            }
            className={`${inputClass} mt-1 w-28`}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            name="active"
            type="checkbox"
            defaultChecked={service?.active ?? true}
            className="h-4 w-4 accent-teal"
          />
          Active
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {service ? "Save" : "Add service"}
        </Button>
      </div>
      <Feedback state={state} />
    </form>
  );
}
