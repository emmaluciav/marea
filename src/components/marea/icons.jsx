import React from "react";

// Custom-drawn heart (not an emoji) with a "Haptic Fill" pulse handled by the
// caller via the `pulsing` prop.
export function HeartIcon({ filled = false, className = "", pulsing = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} ${pulsing ? "heart-pulse" : ""}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 20.5s-7.2-4.6-9.1-9C1.6 8.4 3.2 5 6.3 5c1.9 0 3.2 1.1 4 2.3C11.1 6.1 12.4 5 14.3 5c3.1 0 4.7 3.4 3.4 6.5-1.9 4.4-9.1 9-9.1 9z" />
    </svg>
  );
}