"use client";

import { useEffect, useRef } from "react";

type SparklesProps = {
  className?: string;
  /** CSS color for the particles. */
  particleColor?: string;
  /** Particles per ~10,000px². Higher = denser. */
  density?: number;
  minSize?: number;
  maxSize?: number;
  /** Twinkle speed multiplier. */
  speed?: number;
};

type Particle = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  twinkle: number;
};

/**
 * Twinkling particle field rendered with the raw 2D canvas API (no deps).
 * Recreates the "sparkles" look: tiny dots that softly fade in and out.
 * Sizes to its parent, respects prefers-reduced-motion, and cleans up on
 * unmount. Transparent background so it layers over any section.
 */
export function Sparkles({
  className,
  particleColor = "#48CAE4",
  density = 1.1,
  minSize = 0.6,
  maxSize = 1.8,
  speed = 1.2,
}: SparklesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];

    function build() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = Math.max(1, Math.floor(w * dpr));
      canvas!.height = Math.max(1, Math.floor(h * dpr));
      const count = Math.floor(((w * h) / 10000) * density);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: minSize + Math.random() * (maxSize - minSize),
        baseAlpha: 0.2 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.5 + Math.random() * speed,
      }));
    }
    build();

    const observer = new ResizeObserver(build);
    observer.observe(canvas);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let frameId = 0;
    const start = performance.now();

    function draw(now: number) {
      const t = (now - start) / 1000;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, canvas!.clientWidth, canvas!.clientHeight);
      ctx!.fillStyle = particleColor;
      for (const p of particles) {
        const a = reduceMotion
          ? p.baseAlpha
          : p.baseAlpha * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * p.twinkle + p.phase)));
        ctx!.globalAlpha = a;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (!reduceMotion) frameId = requestAnimationFrame(draw);
    }

    if (reduceMotion) {
      draw(performance.now());
    } else {
      frameId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [particleColor, density, minSize, maxSize, speed]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
