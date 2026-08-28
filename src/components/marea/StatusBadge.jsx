import React from "react";

// Disponibilidad de cada pieza (tarjetas y página de producto).
export function StatusBadge({ product, className = "" }) {
  const { availability, units_remaining } = product || {};

  if (availability === "out_of_stock") {
    return (
      <span className={`text-[11px] uppercase tracking-[0.15em] text-slate ${className}`}>
        Agotado
      </span>
    );
  }
  if (availability === "limited") {
    return (
      <span className={`text-[11px] uppercase tracking-[0.15em] text-gold ${className}`}>
        {units_remaining != null ? `Quedan ${units_remaining}` : "Limitado"}
      </span>
    );
  }
  return (
    <span className={`text-[11px] uppercase tracking-[0.15em] text-foreground/60 ${className}`}>
      Disponible
    </span>
  );
}