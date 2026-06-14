"use client";

import { useEffect, useRef } from "react";

export function HeroVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
