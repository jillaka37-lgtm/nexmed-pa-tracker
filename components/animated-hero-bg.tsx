"use client";

export function AnimatedHeroBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base dark navy */}
      <div className="absolute inset-0 bg-navy" />

      {/* Animated blobs */}
      <div
        className="absolute rounded-full opacity-30 blur-[120px]"
        style={{
          width: "70%",
          height: "70%",
          top: "-20%",
          left: "-10%",
          background: "radial-gradient(circle, #06b6d4, #0891b2)",
          animation: "blobMove1 12s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute rounded-full opacity-20 blur-[100px]"
        style={{
          width: "55%",
          height: "55%",
          bottom: "-15%",
          right: "-5%",
          background: "radial-gradient(circle, #7dd3fc, #06b6d4)",
          animation: "blobMove2 15s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute rounded-full opacity-15 blur-[140px]"
        style={{
          width: "45%",
          height: "45%",
          top: "30%",
          right: "20%",
          background: "radial-gradient(circle, #f59e0b, #06b6d4)",
          animation: "blobMove3 18s ease-in-out infinite alternate",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <style>{`
        @keyframes blobMove1 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(8%, 12%) scale(1.15); }
        }
        @keyframes blobMove2 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-10%, -8%) scale(1.2); }
        }
        @keyframes blobMove3 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(6%, -10%) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
