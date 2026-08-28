import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SwipeGallery from "@/components/marea/SwipeGallery";
import { HeartIcon } from "@/components/marea/icons";
import { StatusBadge } from "@/components/marea/StatusBadge";
import { useMarea } from "@/components/marea/MareaProvider";
import { CATEGORY_LABELS, INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/mareaCategories";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "all";
  const { isSaved, toggleSave } = useMarea();

  const [product, setProduct] = useState(null);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

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

  const saved = isSaved(product.id);
  const images = product.images && product.images.length ? product.images : [];
  const outOfStock = product.availability === "out_of_stock";
  const fromLabel = CATEGORY_LABELS[from] || "Ver todo";

  // Recomendaciones: primero la misma categoría (excluyendo la actual),
  // luego gradualmente las demás.
  const recommendations = all
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      const aSame = a.category === product.category ? 0 : 1;
      const bSame = b.category === product.category ? 0 : 1;
      return aSame - bSame;
    });

  const handleSave = () => {
    toggleSave(product.id);
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
        onClick={() => navigate(from === "all" ? "/" : `/?cat=${from}`)}
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
        <HeartIcon filled={saved} pulsing={pulse} className={`h-4 w-4 ${saved ? "text-obsidian" : "text-obsidian/60"}`} />
      </button>

      <SwipeGallery images={images} aspect="4 / 5" className={outOfStock ? "opacity-90" : ""} />

      <div className="mx-auto max-w-md px-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-heading text-2xl leading-tight text-foreground">{product.name}</h1>
          <span className="mt-1 whitespace-nowrap font-heading text-xl text-foreground">
            ${Number(product.price).toFixed(0)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <StatusBadge product={product} />
          {product.availability === "limited" && product.units_remaining != null && (
            <span className="text-xs text-slate">{product.units_remaining} piezas restantes</span>
          )}
        </div>

        {product.description ? (
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
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
              @Marea.accesories
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

      {/* Recomendados */}
      {recommendations.length > 0 && (
        <section className="mt-12">
          <h2 className="px-5 font-heading text-lg text-foreground">También te puede gustar</h2>
          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto px-5 pb-6">
            {recommendations.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/product/${r.id}?from=${from}`)}
                className="w-36 flex-shrink-0 text-left"
              >
                <div className="relative overflow-hidden rounded-sm bg-secondary">
                  <img
                    src={r.images && r.images[0]}
                    alt={r.name}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  {r.availability === "out_of_stock" && (
                    <div className="absolute inset-0 bg-parchment/30" />
                  )}
                </div>
                <p className="mt-1.5 truncate text-xs text-foreground">{r.name}</p>
                <p className="text-xs text-slate">${Number(r.price).toFixed(0)}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Barra de contacto fija */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-parchment/95 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="font-heading text-base text-foreground">${Number(product.price).toFixed(0)}</p>
            <StatusBadge product={product} />
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