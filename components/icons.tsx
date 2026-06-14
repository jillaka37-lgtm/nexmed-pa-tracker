/**
 * Shared line-style icon set used across marketing pages (trust badges,
 * contact details, pharmacy services). Self-contained inline SVGs — no
 * external assets or dependencies. All icons inherit `currentColor` so the
 * caller controls the color via text classes.
 */

type IconProps = { className?: string };

const base = (children: React.ReactNode) =>
  function Icon({ className }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    );
  };

// Trust badges
export const BadgeCheckIcon = base(
  <>
    <path d="M9 12l2 2 4-4" />
    <path d="M12 3l2.1 1.5 2.6-.2 1 2.4 2.1 1.5-.7 2.5.7 2.5-2.1 1.5-1 2.4-2.6-.2L12 21l-2.1-1.5-2.6.2-1-2.4-2.1-1.5.7-2.5L4.2 8l2.1-1.5 1-2.4 2.6.2L12 3z" />
  </>,
);
export const LockIcon = base(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
    <path d="M12 15v2" />
  </>,
);
export const ShieldIcon = base(
  <>
    <path d="M12 3l8 3v5c0 5-3.4 9-8 10-4.6-1-8-5-8-10V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </>,
);
export const ClipboardCheckIcon = base(
  <>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4h6v3H9z" />
    <path d="M9 13l2 2 4-4" />
  </>,
);

// Pharmacy services
export const HeartPulseIcon = base(
  <>
    <path d="M12 20s-7-4.3-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 .8-.1 1.5-.4 2.2" />
    <path d="M5 13h3l1.5-3 2 5 1.5-2.5h4" />
  </>,
);
export const SyringeIcon = base(
  <>
    <path d="M14 4l6 6" />
    <path d="M17 7l-9 9-3 1 1-3 9-9" />
    <path d="M9.5 11.5l2 2M12 9l2 2" />
  </>,
);
export const ActivityIcon = base(
  <>
    <path d="M3 12h4l2 6 4-12 2 6h6" />
  </>,
);
export const StethoscopeIcon = base(
  <>
    <path d="M6 4v5a4 4 0 008 0V4" />
    <path d="M6 4H4M8 4h2M14 4h2M18 4h-2" />
    <path d="M10 13v2a5 5 0 0010 0v-1" />
    <circle cx="20" cy="13" r="2" />
  </>,
);
export const RefillIcon = base(
  <>
    <path d="M20 11a8 8 0 10-1 4" />
    <path d="M20 5v4h-4" />
    <path d="M12 8v4l3 2" />
  </>,
);
export const PlaneIcon = base(
  <>
    <path d="M10 4.5c0-.8.7-1.5 1.5-1.5S13 3.7 13 4.5V10l8 4.5V17l-8-2.5V19l2 1.5V22l-3.5-1L8 22v-1.5L10 19v-4.5L2 17v-2.5L10 10V4.5z" />
  </>,
);

// Contact
export const MailIcon = base(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M4 7l8 6 8-6" />
  </>,
);
export const PhoneIcon = base(
  <>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
  </>,
);
export const MapPinIcon = base(
  <>
    <path d="M12 21s-7-5.2-7-11a7 7 0 0114 0c0 5.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </>,
);
export const ClockIcon = base(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </>,
);
