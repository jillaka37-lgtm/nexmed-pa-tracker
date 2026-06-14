"use client";

import { useState, useRef } from "react";

type Testimonial = {
  name: string;
  role: string;
  rating: number;
  content: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex justify-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${i < rating ? "fill-gold" : "fill-divider"}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.73.99-5.79L1.58 7.62l5.82-.85L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TestimonialDeck({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [order, setOrder] = useState(testimonials);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  function shuffle() {
    setOrder((prev) => {
      const next = [...prev];
      const first = next.shift();
      if (first) next.push(first);
      return next;
    });
    setDragX(0);
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    setDragX(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (startX.current === null) return;
    if (dragX < -120) {
      shuffle();
    } else {
      setDragX(0);
    }
    startX.current = null;
    setDragging(false);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[440px] w-full max-w-[340px]">
        {order.map((t, i) => {
          const position =
            i === 0 ? "front" : i === 1 ? "middle" : "back";
          const isFront = position === "front";
          const rotate =
            position === "front" ? -6 : position === "middle" ? 0 : 6;
          const x =
            position === "front" ? 0 : position === "middle" ? 14 : 28;
          const z = order.length - i;
          const isDragging = isFront && dragging;

          return (
            <div
              key={t.name}
              onPointerDown={isFront ? onPointerDown : undefined}
              onPointerMove={isFront ? onPointerMove : undefined}
              onPointerUp={isFront ? onPointerUp : undefined}
              style={{
                zIndex: z,
                transform: `translateX(calc(${x}% + ${isFront ? dragX : 0}px)) rotate(${rotate}deg)`,
                opacity: i > 2 ? 0 : 1,
                transition: isDragging
                  ? "none"
                  : "transform 0.35s ease, opacity 0.35s ease",
                touchAction: "none",
              }}
              className={`absolute left-0 top-0 flex h-[420px] w-[320px] flex-col items-center justify-center gap-5 rounded-2xl border border-divider bg-surface/80 p-8 text-center shadow-xl backdrop-blur ${
                isFront ? "cursor-grab active:cursor-grabbing" : ""
              }`}
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-teal/40 bg-teal/10 text-xl font-bold text-teal">
                {initials(t.name)}
              </span>
              <Stars rating={t.rating} />
              <blockquote className="font-serif text-base italic leading-relaxed text-offwhite/90">
                &ldquo;{t.content}&rdquo;
              </blockquote>
              <div>
                <p className="text-sm font-semibold text-offwhite">{t.name}</p>
                <p className="text-xs text-muted">{t.role}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={shuffle}
          className="rounded-full border border-divider px-5 py-2 text-sm font-medium text-muted transition-colors hover:border-teal hover:text-teal"
        >
          Next review &rarr;
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">Drag a card aside, or tap Next.</p>
    </div>
  );
}
