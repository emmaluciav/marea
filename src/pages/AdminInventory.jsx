import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Loader2, ArrowLeft, Minus, Plus, Search, Check, X } from "lucide-react";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { isVideoUrl } from "@/lib/media";
import { CATEGORIES } from "@/lib/mareaCategories";

// Panel de administración (solo admin). Dos pestañas:
//  - Inventario interno: stock privado de productos y empaques (sin tocar el
//    estado público de disponibilidad).
//  - Vendidos: historial de ventas (privado, solo registro histórico). No
//    modifica inventario ni disponibilidad pública.
const FILTERS = [...CATEGORIES, { id: "empaque", label: "Empaque" }];

const dateKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const formatDate = (iso) => {
  try {
    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" })
      .format(new Date(iso))
      .toUpperCase();
  } catch {
    return "";
  }
};

export default function AdminInventory() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  const [tab, setTab] = useState("inventario");

  // Inventario
  const [products, setProducts] = useState([]);
  const [packaging, setPackaging] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");

  // Vendidos
  const [sales, setSales] = useState([]);
  const [adding, setAdding] = useState(false);
  const [saleCat, setSaleCat] = useState("all");
  const [saleQuery, setSaleQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [saleQty, setSaleQty] = useState("1");
  const [savingSale, setSavingSale] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const [list, pack, salesList] = await Promise.all([
          base44.entities.Product.list("-created_date"),
          base44.entities.Packaging.list("-created_date"),
          base44.entities.Sale.list("-created_date"),
        ]);
        if (!mounted) return;
        setProducts(list);
        setPackaging(pack);
        setSales(salesList);
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

  // ---- Inventario ----
  const applyLocal = (setter, id, next) =>
    setter((prev) => prev.map((x) => (x.id === id ? { ...x, inventory: next } : x)));

  const changeInventory = async (item, delta, isPackaging) => {
    const current = Number(item.inventory) || 0;
    const next = Math.max(0, current + delta);
    const setter = isPackaging ? setPackaging : setProducts;
    applyLocal(setter, item.id, next);
    setBusy(item.id);
    try {
      const entity = isPackaging ? base44.entities.Packaging : base44.entities.Product;
      await entity.update(item.id, { inventory: next });
    } catch {
      applyLocal(setter, item.id, current);
    } finally {
      setBusy(null);
    }
  };

  const showEmpaque = cat === "empaque";
  const invRows = (showEmpaque ? packaging : products).filter((p) => {
    if (!showEmpaque && cat !== "all" && p.category !== cat) return false;
    return !query.trim() || (p.name || "").toLowerCase().includes(query.trim().toLowerCase());
  });

  // ---- Vendidos ----
  const saleProducts = products.filter((p) => {
    if (saleCat !== "all" && p.category !== saleCat) return false;
    return !saleQuery.trim() || (p.name || "").toLowerCase().includes(saleQuery.trim().toLowerCase());
  });

  const saveSale = async () => {
    if (!selected) return;
    const qty = Math.max(1, Number(saleQty) || 1);
    setSavingSale(true);
    try {
      const created = await base44.entities.Sale.create({
        product_id: selected.id,
        product_name: selected.name,
        quantity: qty,
      });
      setSales((prev) => [created, ...prev]);
      setAdding(false);
      setSelected(null);
      setSaleQty("1");
      setSaleQuery("");
      setSaleCat("all");
    } catch {
      /* ignore */
    } finally {
      setSavingSale(false);
    }
  };

  // Agrupar ventas por fecha, de la más reciente a la más antigua.
  const groupsMap = {};
  sales.forEach((s) => {
    const k = dateKey(s.created_date);
    (groupsMap[k] = groupsMap[k] || []).push(s);
  });
  const groupKeys = Object.keys(groupsMap).sort((a, b) => b.localeCompare(a));

  if (!isAdmin) return null;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <Loader2 className="h-6 w-6 animate-spin text-slate" />
      </div>
    );
  }

  const Thumb = ({ src }) => (
    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-secondary">
      {src ? (
        isVideoUrl(src) ? (
          <video src={src} muted playsInline className="h-full w-full object-cover" />
        ) : (
          <Image src={src} alt="" fittingType="fill" className="h-full w-full" />
        )
      ) : (
        <div className="h-full w-full" />
      )}
    </div>
  );

  const renderInvRow = (item) => {
    const count = Number(item.inventory) || 0;
    return (
      <li key={item.id} className="flex items-center gap-3 py-3">
        <Thumb src={item.images && item.images[0]} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
          <p className="text-[11px] text-slate">
            {showEmpaque
              ? "Empaque"
              : `$${Number(item.price).toFixed(0)} · ${item.published ? "Publicado" : "Borrador"}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeInventory(item, -1, showEmpaque)}
            disabled={busy === item.id}
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
            onClick={() => changeInventory(item, 1, showEmpaque)}
            disabled={busy === item.id}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary active:scale-95 disabled:opacity-50"
            aria-label="Sumar uno"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </li>
    );
  };

  const tabs = [
    { id: "inventario", label: "Inventario interno" },
    { id: "vendidos", label: "Vendidos" },
  ];

  return (
    <div className="min-h-screen bg-parchment">
      <header className="sticky top-0 z-20 bg-parchment/90 backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center text-foreground transition-opacity active:opacity-60"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-base text-foreground">Panel de administración</h1>
        </div>
        {/* Pestañas */}
        <div className="flex gap-8 border-b border-border/60 px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative py-3 text-[12px] uppercase tracking-[0.12em] transition-colors ${
                tab === t.id ? "text-foreground" : "text-slate"
              }`}
            >
              {t.label}
              {tab === t.id && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-gold" />}
            </button>
          ))}
        </div>
      </header>

      {tab === "inventario" ? (
        <div className="mx-auto max-w-3xl px-4 py-6 pb-20">
          <p className="mb-3 text-xs uppercase tracking-wider text-slate">
            Inventario interno · {invRows.length} {showEmpaque ? "empaques" : "productos"}
          </p>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre"
              className="h-10 pl-9"
            />
          </div>

          <div className="no-scrollbar mb-4 flex gap-3 overflow-x-auto pb-1">
            {FILTERS.map((c) => (
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

          {invRows.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate">No hay elementos que coincidan.</p>
          ) : (
            <ul className="divide-y divide-border">{invRows.map(renderInvRow)}</ul>
          )}
        </div>
      ) : adding ? (
        <div className="mx-auto max-w-3xl px-4 py-6 pb-32">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-sm text-foreground">Registrar venta</h2>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setSelected(null);
              }}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-opacity active:opacity-60"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              value={saleQuery}
              onChange={(e) => setSaleQuery(e.target.value)}
              placeholder="Buscar producto"
              className="h-10 pl-9"
            />
          </div>

          <div className="no-scrollbar mb-3 flex gap-3 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSaleCat(c.id)}
                className={`whitespace-nowrap text-[10px] uppercase tracking-[0.1em] transition-colors ${
                  saleCat === c.id ? "text-foreground" : "text-slate"
                }`}
              >
                {c.label}
                {saleCat === c.id && <span className="mt-1 block h-px w-full bg-gold" />}
              </button>
            ))}
          </div>

          {saleProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate">Sin resultados.</p>
          ) : (
            <ul className="divide-y divide-border">
              {saleProducts.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`flex w-full items-center gap-3 py-3 text-left transition-colors ${
                      selected?.id === p.id ? "bg-secondary/50" : "hover:bg-secondary/30"
                    }`}
                  >
                    <Thumb src={p.images && p.images[0]} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-[11px] text-slate">${Number(p.price).toFixed(0)}</p>
                    </div>
                    {selected?.id === p.id && <Check className="h-5 w-5 text-gold" />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-parchment/95 px-4 py-3 backdrop-blur-md">
              <div className="mx-auto flex max-w-3xl items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{selected.name}</p>
                  <p className="text-[11px] text-slate">Cantidad vendida</p>
                </div>
                <Input
                  type="number"
                  min="1"
                  value={saleQty}
                  onChange={(e) => setSaleQty(e.target.value)}
                  className="h-10 w-20 text-center"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={saveSale}
                  disabled={savingSale}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-parchment shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                  aria-label="Guardar venta"
                >
                  {savingSale ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-sm text-foreground">Historial de ventas</h2>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-parchment shadow-sm transition-transform active:scale-95"
              aria-label="Registrar venta"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {groupKeys.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate">Aún no has registrado ventas.</p>
          ) : (
            <div className="space-y-6">
              {groupKeys.map((k) => (
                <div key={k}>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate">
                    {formatDate(groupsMap[k][0].created_date)}
                  </p>
                  <ul className="divide-y divide-border rounded-sm border border-border/60">
                    {groupsMap[k].map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="truncate text-sm text-foreground">{s.product_name}</span>
                        <span className="whitespace-nowrap text-[12px] font-medium text-gold">
                          {s.quantity} vendido{s.quantity === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}