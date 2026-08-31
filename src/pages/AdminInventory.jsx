import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Loader2, ArrowLeft, Minus, Plus, Search } from "lucide-react";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { isVideoUrl } from "@/lib/media";
import { CATEGORIES } from "@/lib/mareaCategories";

// Panel de administración (solo admin): inventario interno de cada producto.
// El número de inventario es privado y NO cambia el estado público de
// disponibilidad; ese lo controla el admin manualmente al editar el producto.
export default function AdminInventory() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const list = await base44.entities.Product.list("-created_date");
        if (mounted) setProducts(list);
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAdmin, navigate]);

  const changeInventory = async (p, delta) => {
    const current = Number(p.inventory) || 0;
    const next = Math.max(0, current + delta);
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, inventory: next } : x))
    );
    setBusy(p.id);
    try {
      await base44.entities.Product.update(p.id, { inventory: next });
    } catch {
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, inventory: current } : x))
      );
    } finally {
      setBusy(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = cat === "all" || p.category === cat;
    const matchQuery =
      !query.trim() || (p.name || "").toLowerCase().includes(query.trim().toLowerCase());
    return matchCat && matchQuery;
  });

  if (!isAdmin) return null;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <Loader2 className="h-6 w-6 animate-spin text-slate" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-parchment/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center text-foreground transition-opacity active:opacity-60"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-heading text-base text-foreground">Panel de administración</h1>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <p className="mb-3 text-xs uppercase tracking-wider text-slate">
          Inventario interno · {filtered.length} producto{filtered.length === 1 ? "" : "s"}
        </p>

        {/* Buscador */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre"
            className="h-10 pl-9"
          />
        </div>

        {/* Filtro por categoría */}
        <div className="no-scrollbar mb-4 flex gap-3 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`whitespace-nowrap text-[10px] uppercase tracking-[0.1em] transition-colors ${
                cat === c.id ? "text-foreground" : "text-slate"
              }`}
            >
              {c.label}
              {cat === c.id && <span className="mt-1 block h-px w-full bg-gold" />}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate">No hay productos que coincidan.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((p) => {
              const count = Number(p.inventory) || 0;
              const img = p.images && p.images[0];
              return (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-secondary">
                    {img ? (
                      isVideoUrl(img) ? (
                        <video src={img} muted playsInline className="h-full w-full object-cover" />
                      ) : (
                        <Image src={img} alt="" fittingType="fill" className="h-full w-full" />
                      )
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] text-slate">
                      ${Number(p.price).toFixed(0)} · {p.published ? "Publicado" : "Borrador"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => changeInventory(p, -1)}
                      disabled={busy === p.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary active:scale-95 disabled:opacity-50"
                      aria-label="Restar uno"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center font-heading text-base tabular-nums text-foreground">
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeInventory(p, 1)}
                      disabled={busy === p.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary active:scale-95 disabled:opacity-50"
                      aria-label="Sumar uno"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}