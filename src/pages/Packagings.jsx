import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PackagingCard from "@/components/marea/PackagingCard";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Loader2, ArrowLeft, Plus } from "lucide-react";

const LOGO = "https://cdn.phototourl.com/free/2026-08-28-aafc3b10-71bd-4dd3-9d1e-eb1a811109ac.png";

// Sección "Tipos de Empaque". Sección completamente independiente del catálogo
// de productos. El visitante llega desde un enlace sutil en la homepage; la
// flecha de regreso lo devuelve ahí. En modo administrador muestra un botón "+"
// para agregar opciones de empaque.
export default function Packagings() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await base44.entities.Packaging.list("-created_date");
        if (mounted) setItems(list);
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

  return (
    <div className="min-h-screen bg-parchment">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/60 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <img
            src={LOGO}
            alt="MAREA"
            className="pointer-events-none absolute left-1/2 h-14 -translate-x-1/2 object-contain"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-opacity active:opacity-60"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin/empaque/add")}
                className="flex h-9 w-9 items-center justify-center rounded-br-lg bg-gold text-parchment shadow-sm transition-transform active:scale-95"
                aria-label="Agregar empaque"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="pt-16">
        <div className="mx-auto max-w-7xl px-4 pt-8">
          <h1 className="mb-6 text-center font-heading text-2xl text-foreground">
            Tipos de Empaque
          </h1>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-5 w-5 animate-spin text-slate" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <p className="font-heading text-lg text-foreground">Próximamente</p>
              <p className="mt-1 text-sm text-slate">Aún no hay tipos de empaque publicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-2 gap-y-4 px-3 pb-12 sm:grid-cols-3 sm:px-4 lg:grid-cols-4">
              {items.map((p, i) => (
                <PackagingCard key={p.id} packaging={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}