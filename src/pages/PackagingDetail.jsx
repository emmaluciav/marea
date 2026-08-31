import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SwipeGallery from "@/components/marea/SwipeGallery";
import { Loader2, ArrowLeft } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { StatusBadge } from "@/components/marea/StatusBadge";

// Detalle de un tipo de empaque. Mismo estilo que las páginas de producto, pero
// sin precio, disponibilidad, contacto ni recomendaciones. Solo fotos (swipe),
// nombre y descripción opcional. La flecha superior izquierda regresa a la grilla
// de Tipos de Empaque.
export default function PackagingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = useIsAdmin();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const p = await base44.entities.Packaging.get(id);
        if (mounted) setItem(p);
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

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-parchment px-6 text-center">
        <p className="font-heading text-xl text-foreground">No encontrado</p>
        <Link to="/empaque" className="text-sm text-gold underline">
          Volver a Tipos de Empaque
        </Link>
      </div>
    );
  }

  const images = item.images && item.images.length ? item.images : [];

  return (
    <div className="min-h-screen bg-parchment pb-16">
      <button
        type="button"
        onClick={() => navigate("/empaque")}
        className="fixed left-3 top-3 z-30 flex items-center gap-1.5 rounded-full bg-parchment/85 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-foreground shadow-sm backdrop-blur-md"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Empaque
      </button>

      <SwipeGallery images={images} aspect="4 / 5" className="mx-auto max-w-xl" />

      <div className="mx-auto max-w-md px-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-heading text-2xl leading-tight text-foreground">{item.name}</h1>
          {Number(item.price) > 0 ? (
            <span className="mt-1 whitespace-nowrap font-heading text-2xl text-foreground">
              ${Number(item.price).toFixed(0)}
            </span>
          ) : (
            <span className="mt-2 whitespace-nowrap text-[11px] uppercase tracking-[0.15em] text-gold">
              Gratis
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <StatusBadge product={item} />
          {isAdmin && (
            <span className="inline-flex items-center rounded-full bg-gold px-2 py-0.5 text-[11px] font-medium text-parchment">
              Inventario: {Number(item.inventory) || 0}
            </span>
          )}
        </div>
        {item.description ? (
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-foreground/80">
            {item.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}