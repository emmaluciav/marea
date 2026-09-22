import React from "react";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { isVideoUrl } from "@/lib/media";

// Matriz de asignación de foto por combinación Talla + Color (solo admin).
// Solo se muestra cuando el producto tiene tallas Y colores Y fotos.
// Cada celda selecciona UNA foto existente del producto (single-select) que
// representará esa combinación talla+color en la página pública.
export default function AdminVariantMatrix({ sizes, colors, images, variantPhotos, setVariantPhotos }) {
  if (!sizes.length || !colors.length || !images.length) return null;

  const pick = (size, colorId, idx) => {
    setVariantPhotos((prev) => {
      const next = { ...prev };
      const row = { ...(next[size] || {}) };
      if (row[colorId] === idx) {
        delete row[colorId];
      } else {
        row[colorId] = idx;
      }
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
                          <button
                            key={i}
                            type="button"
                            onClick={() => pick(size, c.id, i)}
                            className={`relative aspect-[10/11] w-11 overflow-hidden rounded-sm transition-opacity ${
                              sel ? "ring-2 ring-gold" : "opacity-50"
                            }`}
                            title={`Foto ${i + 1}`}
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