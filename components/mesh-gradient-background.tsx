"use client";

import { MeshGradient } from "@paper-design/shaders-react";

export function MeshGradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 h-full w-full">
      {/* Base mesh — original colors */}
      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={["#000000", "#06b6d4", "#0891b2", "#164e63", "#f97316"]}
        speed={0.3}
        distortion={1.2}
        swirl={1.5}
        grainMixer={0.3}
        grainOverlay={0.1}
      />
      {/* Subtle bottom fade so text stays readable */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy/80 to-transparent" />
    </div>
  );
}
