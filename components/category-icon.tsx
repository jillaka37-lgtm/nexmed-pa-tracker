/**
 * Inline SVG glyphs used as lightweight "product photos" across the shop and
 * services. Self-contained (no external image assets) and on-brand.
 */

type IconProps = { className?: string };

function PillIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="3" y="9" width="18" height="6" rx="3" fill="currentColor" opacity="0.25" />
      <rect x="3" y="9" width="9" height="6" rx="3" fill="currentColor" />
      <path d="M12 9v6" stroke="#0A1628" strokeWidth="1.2" />
    </svg>
  );
}

function FeverIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M10 4a2 2 0 014 0v9a4 4 0 11-4 0V4z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="16.5" r="2" fill="currentColor" />
      <path d="M12 8v6.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function AllergyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M18.4 5.6l-2.5 2.5M8.1 15.9l-2.5 2.5" />
      </g>
    </svg>
  );
}

function VitaminIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 9l3 6 3-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ColdIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5L4.2 16.5" />
        <path d="M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2" />
      </g>
    </svg>
  );
}

function DeviceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="4" y="3" width="11" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 17h11" stroke="currentColor" strokeWidth="1.6" />
      <path d="M18 8l3 2-3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="19" r="0.9" fill="currentColor" />
    </svg>
  );
}

function CareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.3-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.7-7 9-7 9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  "pain & fever": FeverIcon,
  allergy: AllergyIcon,
  vitamins: VitaminIcon,
  "cold & flu": ColdIcon,
  devices: DeviceIcon,
  "personal care": CareIcon,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon = ICONS[category.toLowerCase()] ?? PillIcon;
  return <Icon className={className} />;
}
