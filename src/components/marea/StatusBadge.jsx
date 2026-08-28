import React from "react";
import { cn } from "@/lib/utils";

// Disponibilidad de cada pieza (tarjetas y página de producto).
// `className` puede sobrescribir el tamaño (p. ej. en la página de producto).
export function StatusBadge({ product, className = "" }) {
  const { availability, units_remaining } = product || {};
  const base = "text-[11px] uppercase tracking-[0.15em]";

  if (availability === "out_of_stock") {
    return <span className={cn(base, "text-slate", className)}>Agotado</span>;
  }
  if (availability === "limited") {
    return (
      <span className={cn(base, "text-gold", className)}>
        {units_remaining != null ? `Quedan ${units_remaining}` : "Limitado"}
      </span>
    );
  }
  return <span className={cn(base, "text-foreground/60", className)}>Disponible</span>;
}