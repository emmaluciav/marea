import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SwipeGallery from "./SwipeGallery";
import { BookmarkIcon } from "./icons";
import { StatusBadge } from "./StatusBadge";
import { useMarea } from "./MareaProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function ProductCard({ product, index = 0, origin = "all" }) {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useMarea();
  const isAdmin = useIsAdmin();
  const [pulse, setPulse] = useState(false);

  const saved = isSaved(product.id);
  const outOfStock = product.availability === "out_of_stock";
  const images = product.images && product.images.length ? product.images : [];

  const open = () => navigate(`/product/${product.id}?from=${origin}`);

  const handleSave = (e) => {
    e.stopPropagation();
    toggleSave(product.id);
    if (!saved) {
      setPulse(true);
      setTimeout(() => setPulse(false), 450);
    }
  };

  const edit = (e) => {
    e.stopPropagation();
    navigate(`/admin/edit/${product.id}`);
  };

  return (
    <div
      className={`group reveal ${index % 2 === 0 ? "mt-5 md:mt-0" : ""}`}
      onClick={open}
    >
      <div className="relative overflow-hidden rounded-sm bg-secondary">
        <SwipeGallery
          images={images}
          aspect="3 / 4"
          onImageClick={() => open()}
          className={outOfStock ? "opacity-80" : ""}
          imageClassName={outOfStock ? "opacity-70 [&_img]:grayscale" : ""}
        />

        {/* Out of stock diagonal banner */}
        {outOfStock && (
          <div className="pointer-events-none absolute bottom-0 right-0">
            <div className="bg-obsidian px-2 py-1 text-[8px] font-medium uppercase tracking-[0.2em] text-parchment">
              Agotado
            </div>
          </div>
        )}

        {/* Save heart */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={saved ? "Quitar de guardados" : "Guardar producto"}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-parchment/70 backdrop-blur-sm transition-colors hover:bg-parchment/90"
        >
          <BookmarkIcon
            filled={saved}
            pulsing={pulse}
            className={`h-4 w-4 ${saved ? "text-gold" : "text-obsidian/50"}`}
          />
        </button>

        {/* Admin edit control (only visible to admin) */}
        {isAdmin && (
          <button
            type="button"
            onClick={edit}
            aria-label="Editar producto"
            className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gold/90 text-parchment shadow-sm transition-transform hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}

        {/* Draft badge for admin (unpublished) */}
        {isAdmin && product.published === false && (
          <div className="absolute bottom-2 left-2 z-10 rounded-sm bg-obsidian/80 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.2em] text-parchment">
            Borrador
          </div>
        )}
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="truncate font-body text-[13px] font-medium leading-tight text-foreground">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-heading text-[13px] text-foreground">
            ${Number(product.price).toFixed(0)}
          </span>
          <StatusBadge product={product} />
        </div>
      </div>
    </div>
  );
}