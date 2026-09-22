import React, { useState } from "react";
import { X, Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { writeClient } from "@/lib/writeClient";

// Editor admin de los filtros del catálogo: activar/desactivar cada filtro y,
// para Color y Talla, curar las opciones (con orden). La config se persiste en
// Setting "catalog_filters" y se aplica en vivo en el catálogo público.
const FILTER_META = [
  { key: "discount", label: "Descuentos" },
  { key: "price", label: "Precio" },
  { key: "sort", label: "Orden" },
  { key: "color", label: "Color" },
  { key: "size", label: "Talla" },
];

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];

const uid = () => Math.random().toString(36).slice(2, 9);

function normalize(current, autoColors = [], autoSizes = []) {
  const base = current && typeof current === "object" ? current : {};
  const colorOpts = Array.isArray(base?.color?.options)
    ? base.color.options.map((o) => ({
        id: o.id || uid(),
        name: o.name || "",
        hex: o.hex || "#DB949B",
        is_multicolor: !!o.is_multicolor,
      }))
    : (autoColors || []).map((c) => ({
        id: c.id || uid(),
        name: c.name || "",
        hex: c.hex || "#DB949B",
        is_multicolor: !!c.is_multicolor,
      }));
  const sizeOpts = Array.isArray(base?.size?.options)
    ? [...base.size.options]
    : (autoSizes && autoSizes.length ? [...autoSizes] : [...DEFAULT_SIZES]);
  return {
    discount: { visible: base?.discount?.visible !== false },
    price: { visible: base?.price?.visible !== false },
    sort: { visible: base?.sort?.visible !== false },
    color: { visible: base?.color?.visible !== false, options: colorOpts },
    size: { visible: base?.size?.visible !== false, options: sizeOpts },
  };
}

export default function FilterEditor({ current, onSave, onClose, autoColors = [], autoSizes = [] }) {
  const [cfg, setCfg] = useState(() => normalize(current, autoColors, autoSizes));
  const [busy, setBusy] = useState(false);

  const toggleVis = (key) =>
    setCfg((prev) => ({ ...prev, [key]: { ...prev[key], visible: !prev[key].visible } }));

  // --- Color options ---
  const addColor = () =>
    setCfg((prev) => ({
      ...prev,
      color: {
        ...prev.color,
        options: [...prev.color.options, { id: uid(), name: "", hex: "#DB949B", is_multicolor: false }],
      },
    }));
  const removeColor = (id) =>
    setCfg((prev) => ({
      ...prev,
      color: { ...prev.color, options: prev.color.options.filter((o) => o.id !== id) },
    }));
  const moveColor = (i, dir) =>
    setCfg((prev) => {
      const opts = [...prev.color.options];
      const j = i + dir;
      if (j < 0 || j >= opts.length) return prev;
      [opts[i], opts[j]] = [opts[j], opts[i]];
      return { ...prev, color: { ...prev.color, options: opts } };
    });
  const updateColor = (id, field, value) =>
    setCfg((prev) => ({
      ...prev,
      color: {
        ...prev.color,
        options: prev.color.options.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
      },
    }));

  // --- Size options ---
  const addSize = () =>
    setCfg((prev) => ({ ...prev, size: { ...prev.size, options: [...prev.size.options, ""] } }));
  const removeSize = (i) =>
    setCfg((prev) => ({
      ...prev,
      size: { ...prev.size, options: prev.size.options.filter((_, k) => k !== i) },
    }));
  const moveSize = (i, dir) =>
    setCfg((prev) => {
      const opts = [...prev.size.options];
      const j = i + dir;
      if (j < 0 || j >= opts.length) return prev;
      [opts[i], opts[j]] = [opts[j], opts[i]];
      return { ...prev, size: { ...prev.size, options: opts } };
    });
  const updateSize = (i, value) =>
    setCfg((prev) => ({
      ...prev,
      size: { ...prev.size, options: prev.size.options.map((o, k) => (k === i ? value : o)) },
    }));

  const save = async () => {
    setBusy(true);
    try {
      const value = JSON.stringify(cfg);
      const settings = await base44.entities.Setting.list();
      const existing = settings.find((s) => s.key === "catalog_filters");
      if (existing) await writeClient.entities.Setting.update(existing.id, { value });
      else await writeClient.entities.Setting.create({ key: "catalog_filters", value });
      onSave(cfg);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 px-4 py-8">
      <div className="my-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm bg-parchment p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-base text-foreground">Editor de filtros</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs text-slate">
          Activa o desactiva cada filtro. Para Color y Talla, gestiona las opciones que verá el cliente.
        </p>

        <div className="space-y-3">
          {FILTER_META.map((f) => (
            <div key={f.key} className="rounded-sm border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{f.label}</span>
                <Switch checked={cfg[f.key].visible} onCheckedChange={() => toggleVis(f.key)} />
              </div>

              {f.key === "color" && cfg.color.visible && (
                <div className="mt-3 space-y-2">
                  {cfg.color.options.map((o, i) => (
                    <div key={o.id} className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={o.hex}
                        onChange={(e) => updateColor(o.id, "hex", e.target.value)}
                        className="h-8 w-8 shrink-0 rounded-md border border-input bg-transparent"
                      />
                      <input
                        value={o.name}
                        onChange={(e) => updateColor(o.id, "name", e.target.value)}
                        placeholder="Nombre"
                        className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm"
                      />
                      <label className="flex shrink-0 items-center gap-1 text-[10px] uppercase text-slate">
                        <input
                          type="checkbox"
                          checked={o.is_multicolor}
                          onChange={(e) => updateColor(o.id, "is_multicolor", e.target.checked)}
                        />
                        Multi
                      </label>
                      <button
                        type="button"
                        onClick={() => moveColor(i, -1)}
                        disabled={i === 0}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                        aria-label="Subir"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColor(i, 1)}
                        disabled={i === cfg.color.options.length - 1}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                        aria-label="Bajar"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeColor(o.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-destructive text-destructive"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addColor}
                    className="mt-1 inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1.5 text-[11px] uppercase tracking-wider text-parchment"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar color
                  </button>
                </div>
              )}

              {f.key === "size" && cfg.size.visible && (
                <div className="mt-3 space-y-2">
                  {cfg.size.options.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        value={s}
                        onChange={(e) => updateSize(i, e.target.value)}
                        placeholder="Ej. M"
                        className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => moveSize(i, -1)}
                        disabled={i === 0}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                        aria-label="Subir"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSize(i, 1)}
                        disabled={i === cfg.size.options.length - 1}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                        aria-label="Bajar"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSize(i)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-destructive text-destructive"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSize}
                    className="mt-1 inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1.5 text-[11px] uppercase tracking-wider text-parchment"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar talla
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-wider text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-xs uppercase tracking-wider text-parchment disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}