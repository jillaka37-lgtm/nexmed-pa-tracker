"use client";

import { useEffect, useRef } from "react";

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

function createBeam(width: number, height: number): Beam {
  const angle = -35 + (Math.random() - 0.5) * 10;
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height,
    width: 20 + Math.random() * 60,
    length: height * 0.6 + Math.random() * height * 0.4,
    angle,
    speed: 0.4 + Math.random() * 0.8,
    opacity: 0.12 + Math.random() * 0.18,
    hue: 180 + Math.random() * 40,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.01 + Math.random() * 0.02,
  };
}

export function BeamsBackground({ intensity = "medium" }: { intensity?: "subtle" | "medium" | "strong" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const intensityMap = { subtle: 0.7, medium: 0.85, strong: 1.0 };
  const intensityValue = intensityMap[intensity];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let beams: Beam[] = [];
    let raf = 0;

    function resize() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.scale(dpr, dpr);
      beams = Array.from({ length: 12 }, () => createBeam(w, h));
    }

    function drawBeam(beam: Beam) {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.save();
      ctx!.translate(beam.x, beam.y);
      ctx!.rotate((beam.angle * Math.PI) / 180);

      const pulse = Math.sin(beam.pulse) * 0.1;
      const opacity = (beam.opacity + pulse) * intensityValue;

      const grad = ctx!.createLinearGradient(0, 0, 0, beam.length);
      grad.addColorStop(0, `hsla(${beam.hue}, 80%, 65%, 0)`);
      grad.addColorStop(0.2, `hsla(${beam.hue}, 80%, 65%, ${opacity})`);
      grad.addColorStop(0.8, `hsla(${beam.hue}, 80%, 65%, ${opacity * 0.6})`);
      grad.addColorStop(1, `hsla(${beam.hue}, 80%, 65%, 0)`);

      ctx!.fillStyle = grad;
      ctx!.filter = "blur(12px)";
      ctx!.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx!.restore();

      beam.y -= beam.speed;
      beam.pulse += beam.pulseSpeed;
      if (beam.y + beam.length < -100) {
        Object.assign(beam, createBeam(w, h));
        beam.y = h + 100;
      }
    }

    function frame() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);
      ctx!.filter = "none";
      beams.forEach(drawBeam);
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [intensityValue]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    />
  );
}
