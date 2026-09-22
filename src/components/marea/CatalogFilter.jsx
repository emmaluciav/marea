import React from "react";
import { RangeSlider } from "@/components/marea/RangeSlider";
import { ColorSwatch } from "@/components/marea/ColorSwatch";
import { ArrowUp, ArrowDown, X, Tag } from "lucide-react";

// Panel de filtro global del catálogo. El estado lo controla el catálogo;
// `visible` (desde el editor admin) decide qué filtros se muestran.
const DEFAULT_VISIBLE = { discount: true, price: true, sort: true, color: true };

export default function CatalogFilter({
  visible = DEFAULT_VISIBLE,
  priceBounds,
  priceRange,
  onPriceChange,
  sort,
  onSortChange,
  colors,
  selectedColors,
  onToggleColor,
  onClear,
  activeCount,
  onlyDiscount,
  onToggleOnlyDiscount,
}) {
  const [bMin, bMax] = priceBounds;
  const [min, max] = priceRange;
  const maxSlider = bMax > bMin ? bMax : bMin + 1;
  const vis = { ...DEFAULT_VISIBLE, ...(visible || {}) };

  return (
    <div className="mx-auto max-w-7xl border-b border-border/60 bg-parchment px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate">Filtro</span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-gold transition-opacity active:opacity-60"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      {vis.discount && (
        <button
          type="button"
          onClick={onToggleOnlyDiscount}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors ${
            onlyDiscount ? "border-gold bg-gold/10 text-gold" : "border-border text-slate hover:border-gold"
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          Con descuento
        </button>
      )}

      {vis.price && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-foreground">Precio</span>
            <span className="text-[12px] text-slate">
              ${Math.round(min)} – ${Math.round(max)}
            </span>
          </div>
          <RangeSlider
            value={[min, max]}
            min={bMin}
            max={maxSlider}
            step={1}
            onValueChange={(v) =>
              onPriceChange([Math.min(v[0], v[1]), Math.max(v[0], v[1])])
            }
            className="mt-3"
          />
        </div>
      )}

      {vis.sort && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.12em] text-slate">Orden</span>
          <button
            type="button"
            onClick={() => onSortChange(sort === "asc" ? null : "asc")}
            aria-label="Menor a mayor"
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              sort === "asc"
                ? "border-gold bg-gold text-parchment"
                : "border-border text-slate hover:border-gold"
            }`}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSortChange(sort === "desc" ? null : "desc")}
            aria-label="Mayor a menor"
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              sort === "desc"
                ? "border-gold bg-gold text-parchment"
                : "border-border text-slate hover:border-gold"
            }`}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {vis.color && colors.length > 0 && (
        <div className="mt-4">
          <span className="text-[12px] text-foreground">Color</span>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {colors.map((c) => {
              const sel = selectedColors.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onToggleColor(c)}
                  aria-label={c.name}
                  className="rounded-sm"
                >
                  <ColorSwatch color={c} size="h-6 w-6" selected={sel} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}