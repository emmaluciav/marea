import React from "react";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { isVideoUrl } from "@/lib/media";

// Asignación de foto por variante (solo admin).
// - Con tallas y colores: matriz talla × color (una foto por combinación).
// - Con tallas y SIN colores: una foto por talla.
// Solo se muestra cuando hay tallas Y fotos.
function Thumb({ url, sel, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-[10/11] w-11 overflow-hidden rounded-sm transition-opacity ${
        sel ? "ring-2 ring-gold" : "opacity-50"
      }`}
      title={title}
    >
      {isVideoUrl(url) ? (
        <video src={url} muted playsInline className="h-full w-full object-cover" />
      ) : (
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}
      {sel && (
        <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-parchment">
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  );
}

export default function AdminVariantMatrix({
  sizes,
  colors,
  images,
  variantPhotos,
  setVariantPhotos,
  sizePhotos,
  setSizePhotos,
}) {
  if (!sizes.length || !images.length) return null;

  // Sin colores: una foto por talla.
  if (!colors.length) {
    const pickSize = (size, idx) => {
      setSizePhotos((prev) => {
        const next = { ...prev };
        if (next[size] === idx) delete next[size];
        else next[size] = idx;
        return next;
      });
    };
    return (
      <div className="mb-5 space-y-2">
        <Label className="text-xs uppercase tracking-wider text-slate">Foto por Talla</Label>
        <p className="text-[11px] text-slate">
          Asigna la foto que verá el cliente al elegir cada talla.
        </p>
        <div className="space-y-3">
          {sizes.map((size) => (
            <div key={size} className="rounded-sm border border-border p-3">
              <div className="mb-2 text-sm font-medium uppercase tracking-wider text-foreground">{size}</div>
              <div className="flex flex-wrap gap-1.5">
                {images.map((url, i) => {
                  const sel = sizePhotos[size] === i;
                  return (
                    <Thumb key={i} url={url} sel={sel} onClick={() => pickSize(size, i)} title={`Foto ${i + 1}`} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Con colores: matriz talla × color.
  const pick = (size, colorId, idx) => {
    setVariantPhotos((prev) => {
      const next = { ...prev };
      const row = { ...(next[size] || {}) };
      if (row[colorId] === idx) delete row[colorId];
      else row[colorId] = idx;
      next[size] = row;
      return next;
    });
  };

  return (
    <div className="mb-5 space-y-2">
      <Label className="text-xs uppercase tracking-wider text-slate">Foto por Talla + Color</Label>
      <p className="text-[11px] text-slate">
        Asigna la foto existente que representa cada combinación. El cliente verá esa foto al elegir talla y color.
      </p>
      <div className="space-y-3">
        {sizes.map((size) => (
          <div key={size} className="rounded-sm border border-border p-3">
            <div className="mb-2 text-sm font-medium uppercase tracking-wider text-foreground">{size}</div>
            <div className="space-y-2.5">
              {colors.map((c) => {
                const selected = variantPhotos[size]?.[c.id];
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 truncate text-xs text-slate">{c.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {images.map((url, i) => {
                        const sel = selected === i;
                        return (
                          <Thumb key={i} url={url} sel={sel} onClick={() => pick(size, c.id, i)} title={`Foto ${i + 1}`} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}