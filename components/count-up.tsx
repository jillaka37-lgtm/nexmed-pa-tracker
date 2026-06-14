"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({ to, suffix = "", duration = 1800 }: { to: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setValue(Math.floor(ease * to));
          if (progress < 1) requestAnimationFrame(tick);
          else setValue(to);
        }
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{value}{suffix}</span>;
}
