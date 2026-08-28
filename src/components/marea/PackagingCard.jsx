import React from "react";
import { useNavigate } from "react-router-dom";
import SwipeGallery from "./SwipeGallery";
import { useIsAdmin } from "@/hooks/useIsAdmin";

// Tarjeta de empaque para la grilla de "Tipos de Empaque". Misma estética que
// ProductCard pero sin precio, disponibilidad ni guardado. Incluye el control
// discreto de edición (visible solo para administradores).
export default function PackagingCard({ packaging, index = 0 }) {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const images = packaging.images && packaging.images.length ? packaging.images : [];

  const open = () => navigate(`/empaque/${packaging.id}`);

  const edit = (e) => {
    e.stopPropagation();
    navigate(`/admin/empaque/edit/${packaging.id}`);
  };

  return (
    <div
      className={`group reveal ${index % 2 === 0 ? "mt-5 md:mt-0" : ""}`}
      onClick={open}
    >
      <div className="relative overflow-hidden rounded-sm bg-secondary">
        <SwipeGallery images={images} aspect="3 / 4" onImageClick={() => open()} />

        {/* Admin edit control (only visible to admin) */}
        {isAdmin && (
          <button
            type="button"
            onClick={edit}
            aria-label="Editar empaque"
            className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gold/90 text-parchment shadow-sm transition-transform hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}

        {/* Draft badge for admin (unpublished) */}
        {isAdmin && packaging.published === false && (
          <div className="absolute bottom-2 left-2 z-10 rounded-sm bg-obsidian/80 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.2em] text-parchment">
            Borrador
          </div>
        )}
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="truncate font-body text-[13px] font-medium leading-tight text-foreground">
          {packaging.name}
        </h3>
      </div>
    </div>
  );
}