import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SwipeGallery from "@/components/marea/SwipeGallery";
import { Image } from "@/components/ui/image";
import { isVideoUrl } from "@/lib/media";
import ProductCard from "@/components/marea/ProductCard";
import { BookmarkIcon } from "@/components/marea/icons";
import { StatusBadge } from "@/components/marea/StatusBadge";
import { useMarea } from "@/components/marea/MareaProvider";
import { ColorSwatch } from "@/components/marea/ColorSwatch";
import { INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/mareaCategories";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useCategories } from "@/hooks/useCategories";
import { discountInfo } from "@/lib/discount";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "all";
  const { isSaved, toggleSave, getSavedColor } = useMarea();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const { categories } = useCategories();

  const [product, setProduct] = useState(null);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState(() => searchParams.get("color"));
  const [selectedSizeId, setSelectedSizeId] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const [p, list] = await Promise.all([
          base44.entities.Product.get(id),
          base44.entities.Product.list("-created_date"),
        ]);
        if (!mounted) return;
        setProduct(p);
        setAll(list);
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Restaura el color guardado o auto-selecciona si el producto tiene uno solo.
  useEffect(() => {
    if (!product) return;
    const urlColor = searchParams.get("color");
    if (urlColor) {
      setSelectedColorId(urlColor);
    } else if ((product.colors || []).length === 1) {
      setSelectedColorId(product.colors[0].id);
    } else if (isSaved(product.id)) {
      const sc = getSavedColor(product.id);
      if (sc) setSelectedColorId(sc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <Loader2 className="h-5 w-5 animate-spin text-slate" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-parchment px-6 text-center">
        <p className="font-heading text-xl text-foreground">Pieza no encontrada</p>
        <Link to="/" className="text-sm text-gold underline">Volver al catálogo</Link>
      </div>
    );
  }

  const saved = isSaved(product.id, selectedColorId);
  // La galería SIEMPRE conserva todas las fotos originales en su orden.
  // Seleccionar un color solo "salta" a la primera foto asignada a ese color.
  const galleryImages = product.images && product.images.length ? product.images : [];
  const colors = product.colors || [];
  const sizes = product.sizes || [];
  const activeColor = selectedColorId ? colors.find((c) => c.id === selectedColorId) : null;
  // Índice de la primera foto asignada al color seleccionado (atajo a esa foto).
  const colorTargetIndex =
    activeColor && activeColor.photo_indices && activeColor.photo_indices.length
      ? activeColor.photo_indices[0]
      : null;
  // Si hay talla + color, saltar a la foto asignada a esa combinación exacta.
  const variantTargetIndex =
    selectedSizeId && activeColor && product.variant_photos && product.variant_photos[selectedSizeId] &&
    product.variant_photos[selectedSizeId][activeColor.id] != null
      ? product.variant_photos[selectedSizeId][activeColor.id]
      : null;
  const targetIndex = variantTargetIndex != null ? variantTargetIndex : colorTargetIndex;
  const outOfStock = product.availability === "out_of_stock";
  const fromSaved = from === "saved";
  const labelMap = { all: "Ver todo" };
  categories.forEach((c) => (labelMap[c.id] = c.label));
  const fromLabel = fromSaved ? "Volver" : labelMap[from] || "Ver todo";

  // Estado mostrado: el del color seleccionado si hay uno; si no, el general.
  const statusProduct = activeColor
    ? { availability: activeColor.availability, units_remaining: activeColor.units_remaining }
    : { availability: product.availability, units_remaining: product.units_remaining };
  // Un color agotado se muestra como "No disponible"; el producto general
  // sigue usando su etiqueta existente ("Agotado") cuando no hay color elegido.
  const activeColorOut = !!(activeColor && activeColor.availability === "out_of_stock");
  const disc = discountInfo(product, selectedColorId);

  // Orden de recomendaciones según la categoría del producto actual.
  const REC_ORDER = {
    small_earrings: ["small_earrings", "large_earrings", "necklaces", "pulseras", "anillos"],
    large_earrings: ["large_earrings", "small_earrings", "necklaces", "pulseras", "anillos"],
    necklaces: ["necklaces", "large_earrings", "small_earrings", "pulseras", "anillos"],
    pulseras: ["pulseras", "anillos", "necklaces", "large_earrings", "small_earrings"],
    anillos: ["anillos", "pulseras", "necklaces", "large_earrings", "small_earrings"],
  };
  const order = REC_ORDER[product.category] || ["small_earrings", "large_earrings", "necklaces"];
  const recommendations = all
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      const ai = order.indexOf(a.category);
      const bi = order.indexOf(b.category);
      if (ai !== bi) return ai - bi;
      // Dentro de la primera categoría, priorizar piezas más similares (por precio).
      if (a.category === product.category) {
        return Math.abs(Number(a.price) - Number(product.price)) - Math.abs(Number(b.price) - Number(product.price));
      }
      return 0;
    });

  const handleSelectColor = (colorId) => {
    setSelectedColorId(colorId);
  };

  const handleSave = () => {
    if (colors.length > 1 && !selectedColorId) {
      toast({ title: "Selecciona un color", description: "Elige un color antes de guardar." });
      return;
    }
    toggleSave(product.id, selectedColorId);
    if (!saved) {
      setPulse(true);
      setTimeout(() => setPulse(false), 450);
    }
  };

  return (
    <div className="min-h-screen bg-parchment pb-28">
      {/* Botón flotante de regreso */}
      <button
        type="button"
        onClick={() => navigate(fromSaved ? "/saved" : from === "all" ? "/" : `/?cat=${from}`)}
        className="fixed left-3 top-3 z-30 flex items-center gap-1.5 rounded-full bg-parchment/85 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-foreground shadow-sm backdrop-blur-md"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {fromLabel}
      </button>

      {/* Corazón de guardar */}
      <button
        type="button"
        onClick={handleSave}
        aria-label={saved ? "Quitar de guardados" : "Guardar producto"}
        className="fixed right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-parchment/85 shadow-sm backdrop-blur-md"
      >
        <BookmarkIcon filled={saved} pulsing={pulse} className={`h-4 w-4 ${saved ? "text-gold" : "text-obsidian/60"}`} />
      </button>

      <section className="split:mx-auto split:max-w-6xl split:px-4 split:pt-16 split:pb-6 lg:max-w-7xl lg:px-8 lg:pt-20 lg:pb-8">
        <div className="split:grid split:grid-cols-2 split:gap-4 lg:gap-6">
          {/* Columna de galería */}
          <div className={`relative ${outOfStock ? "opacity-90" : ""}`}>
            {disc && (
              <div className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-sm bg-gold px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-parchment">
                {disc.percent}% descuento
              </div>
            )}
            {/* Grilla de fotos en 2 columnas — escritorio / tablet horizontal.
                Todas las fotos se conservan; seleccionar un color solo resalta
                la foto asignada como la "principal" de ese color. */}
            <div className="hidden split-grid:grid split-grid:grid-cols-2 split-grid:gap-2">
              {galleryImages.map((src, i) =>
                isVideoUrl(src) ? (
                  <div key={i} className={`relative overflow-hidden ring-offset-2 ${i === targetIndex ? "ring-2 ring-gold" : ""}`} style={{ aspectRatio: "10 / 11" }}>
                    <video src={src} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div key={i} className={`relative overflow-hidden ring-offset-2 ${i === targetIndex ? "ring-2 ring-gold" : ""}`} style={{ aspectRatio: "10 / 11" }}>
                    <Image src={src} alt={product.name} fittingType="fill" className="h-full w-full" />
                  </div>
                )
              )}
            </div>
            {/* Swipe — móvil vertical y teléfono horizontal.
                Seleccionar un color salta a la foto asignada sin filtrar. */}
            <div className="split-grid:hidden">
              <SwipeGallery images={galleryImages} aspect="10 / 11" className="mx-auto max-w-xl" jumpTo={targetIndex} />
            </div>
          </div>

          {/* Columna de información */}
          <div className="mx-auto max-w-md px-5 pt-6 split:mx-0 split:max-w-none split:px-0 split:pt-0 lg:max-w-xl lg:pt-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-heading text-2xl leading-tight text-foreground" translate="no">{product.name}</h1>
          <span className="mt-1 flex items-baseline gap-2 whitespace-nowrap font-heading text-2xl text-foreground">
            {disc ? (
              <>
                <span>${disc.finalPrice}</span>
                <span className="text-base text-slate line-through">${disc.originalPrice}</span>
              </>
            ) : (
              <span>${Number(product.price).toFixed(0)}</span>
            )}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {activeColorOut ? (
            <span className="text-[13px] uppercase tracking-[0.15em] text-slate">No disponible</span>
          ) : (
            <StatusBadge product={statusProduct} className="text-[13px]" />
          )}
          {!activeColorOut && statusProduct.availability === "limited" && statusProduct.units_remaining != null && (
            <span className="text-sm text-slate">{statusProduct.units_remaining} piezas restantes</span>
          )}
          {isAdmin && (
            <span className="inline-flex items-center rounded-full bg-gold px-2 py-0.5 text-[11px] font-medium text-parchment">
              Inventario: {Number(product.inventory) || 0}
            </span>
          )}
        </div>

        {/* Talla */}
        {sizes.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[13px] uppercase tracking-[0.15em] text-foreground/60">Talla</span>
            <div className="flex items-center gap-2">
              {sizes.map((s) => {
                const sel = s === selectedSizeId;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSizeId(sel ? null : s)}
                    className={`min-w-[2rem] rounded-sm border px-2.5 py-1 text-[13px] uppercase tracking-wider transition-colors ${
                      sel ? "border-obsidian bg-obsidian text-parchment" : "border-border text-foreground hover:border-gold"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color */}
        {colors.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[13px] uppercase tracking-[0.15em] text-foreground/60">Color</span>
            <div className="flex items-center gap-2">
              {colors.map((c) => {
                const isOut = c.availability === "out_of_stock";
                const sel = c.id === selectedColorId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectColor(c.id)}
                    aria-label={c.name}
                    className="rounded-sm"
                  >
                    <ColorSwatch color={c} unavailable={isOut} selected={sel} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {product.description ? (
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-foreground/80">
            {product.description}
          </p>
        ) : null}

        {/* Contacto / orden */}
        <div className="mt-8 rounded-sm border border-border/70 bg-secondary/30 px-5 py-6 text-center">
          <p className="font-heading text-base text-foreground">¿Quieres ordenar esta pieza?</p>
          <p className="mt-1 text-xs text-slate">Escríbenos por Instagram para reservar</p>
          <div className="mt-4 flex flex-col items-center gap-2.5">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-full max-w-[14rem] items-center justify-center rounded-sm bg-obsidian text-[11px] uppercase tracking-[0.16em] text-parchment"
            >
              @mareaaccesoriosmx
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-full max-w-[14rem] items-center justify-center rounded-sm border border-border text-[11px] uppercase tracking-[0.16em] text-foreground hover:border-gold hover:text-gold"
            >
              WhatsApp
            </a>
          </div>
        </div>
          </div>
        </div>
      </section>

      {/* Recomendados */}
      {recommendations.length > 0 && (
        <section className="mx-auto mt-12 split:mt-6 lg:mt-6 landscape-sm:mt-4 max-w-7xl px-3 sm:px-4">
          <h2 className="px-2 font-heading text-lg text-foreground">También te puede gustar</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            {recommendations.map((r, i) => (
              <ProductCard key={r.id} product={r} index={i} origin={from} />
            ))}
          </div>
        </section>
      )}

      {/* Barra de contacto fija */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-parchment/95 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="flex items-baseline gap-2 font-heading text-base text-foreground">
              {disc ? (
                <>
                  <span>${disc.finalPrice}</span>
                  <span className="text-xs text-slate line-through">${disc.originalPrice}</span>
                </>
              ) : (
                <span>${Number(product.price).toFixed(0)}</span>
              )}
            </p>
            {activeColorOut ? (
              <span className="text-[11px] uppercase tracking-[0.15em] text-slate">No disponible</span>
            ) : (
              <StatusBadge product={statusProduct} />
            )}
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-sm bg-obsidian px-6 text-[11px] uppercase tracking-[0.16em] text-parchment"
          >
            Ordenar por Instagram
          </a>
        </div>
      </div>
    </div>
  );
}