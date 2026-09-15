import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BrandCover from "@/components/marea/BrandCover";
import CategoryTabs from "@/components/marea/CategoryTabs";
import CatalogFilter from "@/components/marea/CatalogFilter";
import ContactSection from "@/components/marea/ContactSection";
import ProductCard from "@/components/marea/ProductCard";
import { Loader2, SlidersHorizontal, Plus } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useCategories } from "@/hooks/useCategories";
import CategoryManager from "@/components/marea/CategoryManager";

// Shuffle determinista por semilla: produce un orden aleatorio estable
// mientras la semilla no cambie. La semilla se regenera al montar la página
// (entrar/reentrar al catálogo o recargar), pero NO al cambiar de categoría
// (es un cambio de searchParam sin desmontar), así el orden se mantiene
// mientras se navega entre categorías y se reordena solo al reentrar.
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed % 233280;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const cat = searchParams.get("cat") || "all";

  // Semilla de aleatoriedad: nueva en cada montaje del catálogo.
  const [seed] = useState(() => Math.floor(Math.random() * 1000000));

  const isAdmin = useIsAdmin();
  const { categories, reload } = useCategories();
  const [managerOpen, setManagerOpen] = useState(false);
  const visibleCats = categories.filter((c) => c.visible);

  // Filtro global (persiste al navegar entre categorías).
  const [filterOpen, setFilterOpen] = useState(false);
  const priceBounds = useMemo(() => {
    if (!products.length) return [0, 0];
    const prices = products.map((p) => Number(p.price) || 0);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);
  const [priceRange, setPriceRange] = useState(null);
  const [sort, setSort] = useState(null);
  const [selColors, setSelColors] = useState([]);
  const [onlyDiscount, setOnlyDiscount] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await base44.entities.Product.list("-created_date");
        if (mounted) setProducts(list.filter((p) => p.published));
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Inicializa el rango de precio cuando llegan los productos.
  useEffect(() => {
    if (products.length && !priceRange) setPriceRange(priceBounds);
  }, [products, priceBounds, priceRange]);

  // Todos los colores presentes en los productos (incluye personalizados).
  const allColors = useMemo(() => {
    const map = new Map();
    products.forEach((p) =>
      (p.colors || []).forEach((c) => {
        if (!map.has(c.id)) {
          map.set(c.id, {
            id: c.id,
            name: c.name,
            hex: c.hex,
            is_multicolor: !!c.is_multicolor,
          });
        }
      })
    );
    return Array.from(map.values());
  }, [products]);

  const priceActive =
    !!priceRange && (priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1]);
  const activeCount =
    (priceActive ? 1 : 0) + (sort ? 1 : 0) + (selColors.length ? 1 : 0) + (onlyDiscount ? 1 : 0);

  // Aplica categoría + filtro + orden/aleatorio.
  const ordered = useMemo(() => {
    let arr = cat === "all" ? products : products.filter((p) => p.category === cat);
    if (priceRange) {
      arr = arr.filter(
        (p) => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]
      );
    }
    if (selColors.length) {
      arr = arr.filter((p) => (p.colors || []).some((c) => selColors.includes(c.id)));
    }
    if (onlyDiscount) {
      arr = arr.filter((p) => Number(p.discount_percent) > 0);
    }
    if (sort === "asc") return [...arr].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "desc") return [...arr].sort((a, b) => Number(b.price) - Number(a.price));
    return seededShuffle(arr, seed);
  }, [products, cat, priceRange, selColors, sort, seed, onlyDiscount]);

  const handleClear = () => {
    setPriceRange(priceBounds);
    setSort(null);
    setSelColors([]);
    setOnlyDiscount(false);
  };

  // Color forzado por el filtro: el primer color seleccionado que el producto
  // tenga (con foto asignada). Hace que la tarjeta muestre esa foto primero.
  const forcedColorFor = (p) => {
    if (!selColors.length) return null;
    const cols = p.colors || [];
    return (
      selColors.find((id) => {
        const c = cols.find((x) => x.id === id);
        return c && c.photo_indices && c.photo_indices.length;
      }) || null
    );
  };

  return (
    <div>
      <BrandCover />

      <ContactSection variant="top" />

      {/* Botón de filtro global — encima de las categorías */}
      <div className="mx-auto max-w-7xl px-4 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${
              filterOpen || activeCount
                ? "border-gold text-gold"
                : "border-border text-slate hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtro
            {activeCount > 0 && (
              <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] text-parchment">
                {activeCount}
              </span>
            )}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setManagerOpen((o) => !o)}
              aria-label="Secciones"
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold text-parchment transition-transform active:scale-95 ${
                managerOpen ? "ring-2 ring-gold/30" : ""
              }`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isAdmin && managerOpen && (
        <CategoryManager
          categories={categories}
          onClose={() => setManagerOpen(false)}
          onChange={reload}
        />
      )}

      <CategoryTabs active={cat} categories={visibleCats} />

      {filterOpen && (
        <CatalogFilter
          priceBounds={priceBounds}
          priceRange={priceRange || priceBounds}
          onPriceChange={setPriceRange}
          sort={sort}
          onSortChange={setSort}
          colors={allColors}
          selectedColors={selColors}
          onToggleColor={(id) =>
            setSelColors((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onlyDiscount={onlyDiscount}
          onToggleOnlyDiscount={() => setOnlyDiscount((v) => !v)}
          onClear={handleClear}
          activeCount={activeCount}
        />
      )}

      <div className="mx-auto max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-5 w-5 animate-spin text-slate" />
          </div>
        ) : ordered.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <p className="font-heading text-lg text-foreground">Aún no hay piezas</p>
            <p className="mt-1 text-sm text-slate">Pronto llegarán nuevas piezas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2 gap-y-4 px-3 pb-12 sm:grid-cols-3 sm:px-4 lg:grid-cols-4">
            {ordered.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                origin={cat}
                forcedColor={forcedColorFor(p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}