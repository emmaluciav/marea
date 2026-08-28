import React from "react";

// Icono de marcador (bookmark) para guardar productos. Relleno/negro cuando
// está guardado, contorno cuando no. La animación de pulso la aplica el
// llamador con la prop `pulsing`.
export function BookmarkIcon({ filled = false, className = "", pulsing = false }) {
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
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}