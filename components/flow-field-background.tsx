"use client";

import { useEffect, useRef } from "react";

type FlowFieldProps = {
  className?: string;
  /** Particle color. */
  color?: string;
  /** RGB of the trail/fade color (matches the section background). */
  trailRgb?: string;
  /** Trail fade strength. Lower = longer trails. */
  trailOpacity?: number;
  particleCount?: number;
  speed?: number;
};

/**
 * Flow-field particle background, rendered on a 2D canvas (no deps).
 * Particles drift along a trig-based flow field and repel from the cursor,
 * leaving fading trails. Sizes to its parent, honors prefers-reduced-motion,
 * and cleans up on unmount. Brand-tinted for NexMed (sky particles on navy).
 */
export function FlowFieldBackground({
  className,
  color = "#48CAE4",
  trailRgb = "10, 22, 40",
  trailOpacity = 0.12,
  particleCount = 500,
  speed = 1,
}: FlowFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let animationFrameId = 0;
    const mouse = { x: -1000, y: -1000 };

    class Particle {
      x = Math.random() * width;
      y = Math.random() * height;
      vx = 0;
      vy = 0;
      age = 0;
      life = Math.random() * 200 + 100;

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = 0;
        this.vy = 0;
        this.age = 0;
        this.life = Math.random() * 200 + 100;
      }

      update() {
        const angle =
          (Math.cos(this.x * 0.005) + Math.sin(this.y * 0.005)) * Math.PI;
        this.vx += Math.cos(angle) * 0.2 * speed;
        this.vy += Math.sin(angle) * 0.2 * speed;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = 150;
        if (distance < radius) {
          const force = (radius - distance) / radius;
          this.vx -= dx * force * 0.05;
          this.vy -= dy * force * 0.05;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;

        this.age++;
        if (this.age > this.life) this.reset();

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(context: CanvasRenderingContext2D) {
        context.fillStyle = color;
        context.globalAlpha = 1 - Math.abs(this.age / this.life - 0.5) * 2;
        context.fillRect(this.x, this.y, 1.5, 1.5);
      }
    }

    let particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function init() {
      width = container!.clientWidth;
      height = container!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Paint the starting background so trails fade toward navy, not black.
      ctx!.fillStyle = `rgb(${trailRgb})`;
      ctx!.fillRect(0, 0, width, height);
      particles = Array.from({ length: particleCount }, () => new Particle());
    }

    function animate() {
      ctx!.globalAlpha = 1;
      ctx!.fillStyle = `rgba(${trailRgb}, ${trailOpacity})`;
      ctx!.fillRect(0, 0, width, height);
      for (const p of particles) {
        p.update();
        p.draw(ctx!);
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    function handleResize() {
      init();
    }
    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function handleMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    init();
    if (reduceMotion) {
      // Single settled frame.
      for (let i = 0; i < 60; i++) {
        for (const p of particles) p.update();
      }
      for (const p of particles) p.draw(ctx);
    } else {
      animate();
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [color, trailRgb, trailOpacity, particleCount, speed]);

  return (
    <div ref={containerRef} aria-hidden className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
