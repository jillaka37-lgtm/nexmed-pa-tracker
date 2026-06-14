"use client";

import { useEffect, useRef } from "react";

const ITEMS = [
  "Licensed Pharmacists",
  "Same-Day Pickup",
  "Home Delivery",
  "Secure Payments",
  "AI-Assisted Consultations",
  "Prescription Refills",
  "Expert Health Guidance",
  "Trusted Since 2024",
];

export function InfiniteSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const halfWidth = track.scrollWidth / 2;

    function tick() {
      if (!pausedRef.current) {
        posRef.current += 1.2;
        if (posRef.current >= halfWidth) posRef.current = 0;
        track!.style.transform = `translateX(-${posRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const allItems = [...ITEMS, ...ITEMS];

  return (
    <div
      className="relative overflow-hidden py-2"
      style={{ maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)" }}
    >
      <div
        ref={trackRef}
        className="flex w-max gap-3"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        {allItems.map((item, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-divider bg-surface/60 px-3 py-1"
          >
            <span className="h-1 w-1 rounded-full bg-teal" />
            <span className="text-[10px] font-medium text-offwhite whitespace-nowrap">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
