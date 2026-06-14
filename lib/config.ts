/** Business timezone used to interpret availability rules and display slots. */
export const BUSINESS_TIMEZONE =
  process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || "UTC";

/** Minimum lead time before a slot can be booked (minutes). */
export const BOOKING_LEAD_MINUTES = 60;

/** How far ahead clients can book (days). */
export const BOOKING_WINDOW_DAYS = 30;

/** Stale pending_payment bookings expire after this many minutes. */
export const PENDING_EXPIRY_MINUTES = 20;
