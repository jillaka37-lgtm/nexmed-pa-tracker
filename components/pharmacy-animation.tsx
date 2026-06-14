"use client";

const pills = [
  { color1: "#0891b2", color2: "#0f1e35", size: 56, x: 60,  y: 20,  rotate: 30,  delay: 0,    duration: 6 },
  { color1: "#c9a227", color2: "#0891b2", size: 40, x: 20,  y: 45,  rotate: -20, delay: 1.2,  duration: 7 },
  { color1: "#0891b2", color2: "#38bdf8", size: 48, x: 75,  y: 60,  rotate: 50,  delay: 0.6,  duration: 5.5 },
  { color1: "#0f1e35", color2: "#c9a227", size: 36, x: 40,  y: 80,  rotate: -40, delay: 2,    duration: 8 },
  { color1: "#38bdf8", color2: "#0369a1", size: 44, x: 85,  y: 30,  rotate: 15,  delay: 0.3,  duration: 6.5 },
  { color1: "#c9a227", color2: "#0f1e35", size: 32, x: 10,  y: 70,  rotate: -60, delay: 1.8,  duration: 7.5 },
  { color1: "#0891b2", color2: "#c9a227", size: 52, x: 50,  y: 50,  rotate: 70,  delay: 0.9,  duration: 5 },
  { color1: "#38bdf8", color2: "#0f1e35", size: 38, x: 30,  y: 15,  rotate: -30, delay: 2.4,  duration: 9 },
];

export function PharmacyAnimation() {
  return (
    <div className="relative w-full h-80 md:h-full min-h-[320px]">
      {pills.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `floatPill ${p.duration}s ease-in-out ${p.delay}s infinite`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        >
          <svg
            width={p.size}
            height={p.size / 2}
            viewBox="0 0 100 50"
            style={{ filter: "drop-shadow(0 4px 12px rgba(8,145,178,0.4))" }}
          >
            {/* Left half */}
            <path d="M25 0 A25 25 0 0 0 25 50 L50 50 L50 0 Z" fill={p.color1} opacity="0.9" />
            {/* Right half */}
            <path d="M75 0 A25 25 0 0 1 75 50 L50 50 L50 0 Z" fill={p.color2} opacity="0.9" />
            {/* Center line */}
            <line x1="50" y1="2" x2="50" y2="48" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            {/* Shine */}
            <ellipse cx="32" cy="14" rx="8" ry="4" fill="rgba(255,255,255,0.2)" />
          </svg>
        </div>
      ))}

      {/* Floating cross symbols */}
      {[
        { x: 88, y: 55, size: 20, delay: 1 },
        { x: 5,  y: 35, size: 16, delay: 3 },
        { x: 55, y: 88, size: 14, delay: 2 },
      ].map((c, i) => (
        <div
          key={`cross-${i}`}
          className="absolute text-teal/40 font-bold select-none"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            fontSize: c.size,
            animation: `floatPill 8s ease-in-out ${c.delay}s infinite`,
          }}
        >
          ✚
        </div>
      ))}
    </div>
  );
}
