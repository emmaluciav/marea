import React from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

// "Blueprint Overlay" — a subtle golden border around the viewport that
// reminds the editor they are in Master Control mode. Invisible to visitors.
export default function AdminBorder() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 border-2 border-gold/60" aria-hidden="true" />
  );
}