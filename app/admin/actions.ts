"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMeetingLink } from "@/lib/email";

export type AdminState = { ok: boolean; error?: string; message?: string };

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "Not authorized.";
  return null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function setMeetingLink(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const bookingId = String(formData.get("booking_id") ?? "");
  const meetingLink = String(formData.get("meeting_link") ?? "").trim();
  if (!bookingId || !meetingLink) {
    return { ok: false, error: "Booking and meeting link are required." };
  }
  if (!/^https?:\/\//i.test(meetingLink)) {
    return { ok: false, error: "Meeting link must start with http(s)://." };
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .update({ meeting_link: meetingLink })
    .eq("id", bookingId)
    .select("start_at, user_id, service_id")
    .maybeSingle();

  if (!booking) return { ok: false, error: "Booking not found." };

  const [{ data: profile }, { data: service }] = await Promise.all([
    admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", booking.user_id)
      .single(),
    admin
      .from("services")
      .select("title")
      .eq("id", booking.service_id)
      .maybeSingle(),
  ]);

  if (profile?.email) {
    await sendMeetingLink({
      to: profile.email,
      name: profile.full_name ?? null,
      serviceTitle: service?.title ?? "Consultation",
      startAt: new Date(booking.start_at),
      meetingLink,
    });
  }

  revalidatePath("/admin");
  return { ok: true, message: "Meeting link saved and emailed." };
}

export async function addAvailabilityRule(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const weekday = Number(formData.get("weekday"));
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");
  const slot_minutes = Number(formData.get("slot_minutes")) || 30;

  if (Number.isNaN(weekday) || !start_time || !end_time) {
    return { ok: false, error: "Weekday, start and end time are required." };
  }
  if (end_time <= start_time) {
    return { ok: false, error: "End time must be after start time." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("availability_rules")
    .insert({ weekday, start_time, end_time, slot_minutes, active: true });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true, message: "Availability added." };
}

export async function deleteAvailabilityRule(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing rule id." };

  const admin = createAdminClient();
  await admin.from("availability_rules").delete().eq("id", id);
  revalidatePath("/admin");
  return { ok: true, message: "Availability removed." };
}

export async function saveService(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, error: denied };

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const duration_min = Number(formData.get("duration_min")) || 30;
  const priceDollars = Number(formData.get("price_dollars"));
  const active = formData.get("active") === "on";

  if (!title) return { ok: false, error: "Title is required." };
  if (Number.isNaN(priceDollars) || priceDollars < 0) {
    return { ok: false, error: "Enter a valid price." };
  }
  const price_cents = Math.round(priceDollars * 100);

  const admin = createAdminClient();
  if (id) {
    const { error } = await admin
      .from("services")
      .update({ title, description, duration_min, price_cents, active })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const slug = slugify(title);
    const { error } = await admin.from("services").insert({
      slug,
      title,
      description,
      duration_min,
      price_cents,
      currency: "usd",
      active,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/services");
  return { ok: true, message: "Service saved." };
}
