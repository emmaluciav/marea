import React from "react";

// Availability status rendering for cards and product pages.
export function StatusBadge({ product, className = "" }) {
  const { availability, units_remaining } = product || {};

  if (availability === "out_of_stock") {
    return (
      <span className={`text-[11px] uppercase tracking-[0.15em] text-slate ${className}`}>
        Out of Stock
      </span>
    );
  }
  if (availability === "limited") {
    return (
      <span className={`text-[11px] uppercase tracking-[0.15em] text-gold ${className}`}>
        {units_remaining != null ? `${units_remaining} left` : "Limited"}
      </span>
    );
  }
  return (
    <span className={`text-[11px] uppercase tracking-[0.15em] text-foreground/60 ${className}`}>
      Available
    </span>
  );
}