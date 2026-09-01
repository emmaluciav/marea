import React from "react";
import { swatchBackground } from "@/lib/mareaCategories";

// Rectángulo de color simple. Sin brillos ni degradados suaves.
// El multicolor es un corte duro 50/50 plateado/dorado.
// Si `unavailable` es true, se traza una línea diagonal blanca fina encima.
export function ColorSwatch({ color, size = "h-6 w-6", unavailable = false, selected = false, bare = false, className = "" }) {
  return (
    <span
      className={`relative inline-block overflow-hidden rounded-sm align-middle ${size} ${
        bare ? "" : selected ? "ring-1 ring-obsidian" : "border border-border"
      } ${className}`}
    >
      <span className="absolute inset-0" style={{ background: swatchBackground(color) }} />
      {unavailable && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="block h-px w-[170%] rotate-45 bg-parchment" />
        </span>
      )}
    </span>
  );
}