import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SwipeGallery from "./SwipeGallery";
import { BookmarkIcon } from "./icons";
import { StatusBadge } from "./StatusBadge";
import { Check } from "lucide-react";
import { useMarea } from "./MareaProvider";
import { ColorSwatch } from "./ColorSwatch";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { discountInfo } from "@/lib/discount";

export default function ProductCard({ product, index = 0, origin = "all", savedColor = null, selectable = false, selected = false, onToggleSelect, forcedColor = null }) {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useMarea();
  const isAdmin = useIsAdmin();
  const [pulse, setPulse] = useState(false);

  const outOfStock = product.availability === "out_of_stock";
  const images = product.images && product.images.length ? product.images : [];
  const colors = product.colors || [];

  // Color en contexto: el forzado por el filtro, o el color guardado, o el
  // único color del producto. Sirve para saltar a la foto asignada y para el
  // estado de guardado por variante.
  const displayColor = forcedColor || savedColor || null;
  const displayColorObj = displayColor ? colors.find((c) => c.id === displayColor) : null;
  const displayIndex =
    displayColorObj && displayColorObj.photo_indices && displayColorObj.photo_indices.length
      ? displayColorObj.photo_indices[0]
      : null;

  const saved = isSaved(product.id, displayColor);
  const contextColor = displayColor || (colors.length === 1 ? colors[0].id : null);
  const disc = discountInfo(product, contextColor);

  const open = () => {
    const params = new URLSearchParams();
    params.set("from", origin);
    const color = forcedColor || savedColor;
    if (color) params.set("color", color);
    navigate(`/product/${product.id}?${params.toString()}`);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    toggleSave(product.id, displayColor);
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
          aspect="10 / 11"
          onImageClick={() => open()}
          className={outOfStock ? "opacity-80" : ""}
          imageClassName={outOfStock ? "opacity-70 [&_img]:grayscale" : ""}
          jumpTo={displayIndex}
        />

        {/* Descuento */}
        {disc && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-sm bg-gold px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-parchment">
            {disc.percent}% descuento
          </div>
        )}

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

        {/* Selection checkbox (Saved page only) */}
        {selectable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect && onToggleSelect();
            }}
            aria-label={selected ? "Quitar selección" : "Seleccionar producto"}
            className={`absolute left-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-colors ${
              selected ? "border-gold bg-gold text-parchment" : "border-gold bg-parchment/70 text-transparent"
            }`}
          >
            <Check className="h-4 w-4" />
          </button>
        )}

        {/* Admin edit control (only visible to admin) */}
        {isAdmin && (
          <button
            type="button"
            onClick={edit}
            aria-label="Editar producto"
            className={`absolute ${selectable ? "left-12" : "left-2"} top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gold/90 text-parchment shadow-sm transition-transform hover:scale-105`}
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
        <h3 className="truncate font-body text-[13px] font-medium leading-tight text-foreground" translate="no">
          {product.name}
        </h3>
        {colors.length > 0 && (
          <div className="mt-1 flex items-center gap-1">
            {colors.map((c) => (
              <ColorSwatch
                key={c.id}
                color={c}
                size="h-3 w-3"
                unavailable={c.availability === "out_of_stock"}
              />
            ))}
          </div>
        )}
        <div className="mt-1 flex items-center justify-between">
          {disc ? (
            <span className="flex items-baseline gap-1.5">
              <span className="font-heading text-[13px] text-foreground">${disc.finalPrice}</span>
              <span className="font-heading text-[11px] text-slate line-through">${disc.originalPrice}</span>
            </span>
          ) : (
            <span className="font-heading text-[13px] text-foreground">
              ${Number(product.price).toFixed(0)}
            </span>
          )}
          <StatusBadge product={product} />
        </div>
      </div>
    </div>
  );
}