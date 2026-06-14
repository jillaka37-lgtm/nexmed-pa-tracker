import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[8px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-teal to-sky text-navy font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_32px_rgba(6,182,212,0.55)] hover:brightness-110 transition-all",
  secondary: "bg-ocean text-white hover:bg-teal hover:text-navy",
  outline:
    "border border-teal/40 text-teal hover:border-teal hover:bg-teal/10 hover:shadow-[0_0_16px_rgba(6,182,212,0.2)]",
  ghost: "text-offwhite hover:text-teal",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
