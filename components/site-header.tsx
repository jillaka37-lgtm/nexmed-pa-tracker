import Link from "next/link";
import { Logo } from "./logo";
import { CartLink } from "./cart/cart-link";
import { getProfile } from "@/lib/auth";
import { MobileMenu } from "./mobile-menu";
import { LimelightNav } from "./limelight-nav";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/refill", label: "Refill" },
  { href: "/medication-info", label: "Medication info" },
  { href: "/services", label: "Consultations" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-divider/60 bg-navy/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        {/* Desktop nav */}
        <LimelightNav />

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Dashboard already lives in the main nav (LimelightNav) —
              no second copy here. Only show something distinct: sign-in
              for logged-out visitors. */}
          {!profile && (
            <Link href="/login" className="text-sm font-medium text-muted transition-colors hover:text-teal">
              Sign in
            </Link>
          )}
          <CartLink />
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <CartLink />
          <MobileMenu links={navLinks} isLoggedIn={!!profile} />
        </div>
      </div>
    </header>
  );
}
