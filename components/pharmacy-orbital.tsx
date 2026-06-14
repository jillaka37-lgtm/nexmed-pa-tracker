"use client";

import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "./category-icon";

type Status = "in-stock" | "low-stock" | "out-of-stock";

type OrbitalItem = {
  id: number;
  title: string;
  category: string;
  /** Key understood by CategoryIcon. */
  iconKey: string;
  description: string;
  relatedIds: number[];
  status: Status;
  availability: number;
};

const defaultItems: OrbitalItem[] = [
  {
    id: 1,
    title: "Pain & fever",
    category: "Analgesics",
    iconKey: "pain & fever",
    description:
      "Fast-acting relief for headaches, aches, and fever. Always follow the stated dose.",
    relatedIds: [4, 7],
    status: "in-stock",
    availability: 95,
  },
  {
    id: 2,
    title: "Allergy relief",
    category: "Antihistamines",
    iconKey: "allergy",
    description:
      "Ease sneezing, itching, and hay fever. Some types can cause drowsiness.",
    relatedIds: [4, 3],
    status: "in-stock",
    availability: 88,
  },
  {
    id: 3,
    title: "Vitamins",
    category: "Supplements",
    iconKey: "vitamins",
    description:
      "Everyday vitamins and supplements to support wellbeing and fill dietary gaps.",
    relatedIds: [1, 5],
    status: "low-stock",
    availability: 45,
  },
  {
    id: 4,
    title: "Cold & flu",
    category: "Respiratory",
    iconKey: "cold & flu",
    description:
      "Eases congestion, sore throat, and cough. Avoid doubling up on pain relief.",
    relatedIds: [1, 2],
    status: "in-stock",
    availability: 78,
  },
  {
    id: 5,
    title: "Skin & first aid",
    category: "First aid",
    iconKey: "personal care",
    description:
      "For minor cuts, burns, bites, and skin conditions. Keep wounds clean.",
    relatedIds: [3, 6],
    status: "in-stock",
    availability: 92,
  },
  {
    id: 6,
    title: "Health devices",
    category: "Monitoring",
    iconKey: "devices",
    description:
      "Thermometers, blood pressure monitors, and everyday self-care devices.",
    relatedIds: [5, 7],
    status: "low-stock",
    availability: 38,
  },
  {
    id: 7,
    title: "Digestive health",
    category: "Gut & stomach",
    iconKey: "digestive",
    description:
      "For heartburn, indigestion, and upset stomach. See a pharmacist if it persists.",
    relatedIds: [1, 6],
    status: "in-stock",
    availability: 85,
  },
];

function statusLabel(status: Status) {
  return status === "in-stock"
    ? "IN STOCK"
    : status === "low-stock"
      ? "LOW STOCK"
      : "OUT OF STOCK";
}

function statusStyles(status: Status) {
  switch (status) {
    case "in-stock":
      return "bg-health/15 text-health border border-health/40";
    case "low-stock":
      return "bg-gold/15 text-gold border border-gold/40";
    default:
      return "bg-red-500/15 text-red-400 border border-red-500/40";
  }
}

export function PharmacyOrbital({
  items = defaultItems,
}: {
  items?: OrbitalItem[];
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);

  // Avoid SSR/client hydration mismatch: the server and the first client
  // render both use angle 0; rotation only applies after mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setRotationAngle((prev) => Number(((prev + 0.3) % 360).toFixed(3)));
    }, 50);
    return () => clearInterval(timer);
  }, [autoRotate]);

  function clearSelection() {
    setExpandedId(null);
    setAutoRotate(true);
  }

  function toggleItem(id: number) {
    setExpandedId((prev) => {
      const next = prev === id ? null : id;
      setAutoRotate(next === null);
      return next;
    });
  }

  function handleContainerClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      clearSelection();
    }
  }

  function nodePosition(index: number, total: number) {
    const angle = ((index / total) * 360 + (mounted ? rotationAngle : 0)) % 360;
    const radius = 190;
    const radian = (angle * Math.PI) / 180;
    const x = Number((radius * Math.cos(radian)).toFixed(3));
    const y = Number((radius * Math.sin(radian)).toFixed(3));
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Number(
      Math.max(
        0.45,
        Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(radian)) / 2)),
      ).toFixed(3),
    );
    return { x, y, zIndex, opacity };
  }

  function isRelated(itemId: number) {
    if (expandedId === null) return false;
    const active = items.find((i) => i.id === expandedId);
    return active ? active.relatedIds.includes(itemId) : false;
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative flex h-[520px] w-full items-center justify-center overflow-hidden sm:h-[560px]"
    >
      <div
        ref={orbitRef}
        className="absolute flex h-full w-full items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Center hub */}
        <div className="absolute z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal via-sky to-health">
          <div className="absolute h-24 w-24 animate-ping rounded-full border-2 border-teal/30 opacity-70" />
          <div
            className="absolute h-28 w-28 animate-ping rounded-full border-2 border-sky/20 opacity-50"
            style={{ animationDelay: "0.5s" }}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/90 backdrop-blur">
            <CategoryIcon category="pill" className="h-6 w-6 text-teal" />
          </div>
        </div>

        {/* Orbit ring */}
        <div className="absolute h-96 w-96 rounded-full border border-divider/60" />

        {items.map((item, index) => {
          const pos = nodePosition(index, items.length);
          const expanded = expandedId === item.id;
          const related = isRelated(item.id);

          return (
            <div
              key={item.id}
              className="absolute cursor-pointer transition-all duration-700"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                zIndex: expanded ? 200 : pos.zIndex,
                opacity: expanded ? 1 : pos.opacity,
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleItem(item.id);
              }}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  expanded
                    ? "scale-150 border-teal bg-teal text-navy shadow-lg shadow-teal/30"
                    : related
                      ? "border-health bg-health text-navy"
                      : "border-divider bg-surface text-teal"
                }`}
              >
                <CategoryIcon category={item.iconKey} className="h-5 w-5" />
              </div>

              <div
                className={`absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tracking-wider transition-all duration-300 ${
                  expanded ? "scale-110 text-teal" : "text-muted"
                }`}
              >
                {item.title}
              </div>

              {expanded && (
                <div className="absolute left-1/2 top-20 w-72 -translate-x-1/2 rounded-xl border border-divider bg-card/95 p-5 shadow-xl shadow-teal/10 backdrop-blur">
                  <div className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-teal" />
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusStyles(item.status)}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-offwhite">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {item.description}
                  </p>

                  <div className="mt-4 border-t border-divider pt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted">Availability</span>
                      <span className="font-mono text-offwhite">
                        {item.availability}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-divider">
                      <div
                        className={`h-full ${
                          item.availability > 70
                            ? "bg-health"
                            : item.availability > 40
                              ? "bg-gold"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${item.availability}%` }}
                      />
                    </div>
                  </div>

                  {item.relatedIds.length > 0 && (
                    <div className="mt-4 border-t border-divider pt-3">
                      <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted">
                        Related categories
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {item.relatedIds.map((rid) => {
                          const rel = items.find((i) => i.id === rid);
                          if (!rel) return null;
                          return (
                            <button
                              key={rid}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(rid);
                              }}
                              className="rounded-md border border-divider px-2 py-1 text-xs text-muted transition-colors hover:border-teal hover:text-teal"
                            >
                              {rel.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-xs text-muted">
        Click any category to explore. Click empty space to reset.
      </p>
    </div>
  );
}
