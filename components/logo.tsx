import Link from "next/link";

/**
 * NexMed wordmark — Nex (white) + Med (teal), teal pharmacy cross + gold dot.
 * Rebuilt as inline SVG per the brand guide; swap for the real asset when available.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="NexMed home"
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <svg viewBox="0 0 36 36" className="h-9 w-9" aria-hidden="true">
          <rect width="36" height="36" rx="8" fill="#0F1E35" />
          {/* pharmacy cross */}
          <rect x="15.5" y="8" width="5" height="20" rx="1.5" fill="#00A8CC" />
          <rect x="8" y="15.5" width="20" height="5" rx="1.5" fill="#00A8CC" />
          {/* gold dot */}
          <circle cx="27" cy="9" r="3" fill="#D4AF37" />
        </svg>
      </span>
      <span className="text-2xl font-bold tracking-tight leading-none">
        <span className="text-white">Nex</span>
        <span className="text-teal">Med</span>
      </span>
    </Link>
  );
}
