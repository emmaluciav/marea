import React, { useState } from "react";
import { X, Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { writeClient } from "@/lib/writeClient";
import { DEFAULT_CONTACT_BLOCK } from "./ContactSection";

// Editor admin del bloque de contacto (Setting "contact_block").
// Permite editar cada renglón: texto, fuente, tamaño, color, contorno,
// esquinas redondeadas, interlineado de contorno (padding), enlaces a
// Instagram/WhatsApp, añadir/eliminar renglones. Los cambios se aplican
// en todas las ubicaciones donde aparece el bloque.
const FONTS = [
  { id: "heading", label: "Heading" },
  { id: "body", label: "Body" },
  { id: "display", label: "Display" },
];
const ALIGNS = [
  { id: "center", label: "Centro" },
  { id: "left", label: "Izquierda" },
  { id: "right", label: "Derecha" },
];
const LINKS = [
  { id: "none", label: "Ninguno" },
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "empaque", label: "Empaques" },
  { id: "custom", label: "Personalizado" },
];

function uid() {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

const blankRow = () => ({
  id: uid(),
  text: "Nuevo renglón",
  font: "body",
  size: 14,
  color: "#6b6965",
  bold: false,
  uppercase: false,
  tracking: 0,
  align: "center",
  isLink: false,
  link: "none",
  url: "",
  isButton: false,
  bg: "",
  hasBorder: false,
  borderColor: "#e7e5e9",
  borderWidth: 1,
  borderRadius: 2,
  paddingX: 20,
  paddingY: 10,
  width: 0,
  underline: false,
  deliveryOnly: false,
});

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-slate">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex h-9 w-full items-center justify-center rounded-md border text-[11px] uppercase tracking-wider transition-colors ${
        value ? "border-gold bg-gold/10 text-foreground" : "border-border text-slate"
      }`}
    >
      {label}
    </button>
  );
}

function RowEditor({ row, index, total, onChange, onRemove, onMove }) {
  const set = (k, v) => onChange({ ...row, [k]: v });
  return (
    <div className="rounded-sm border border-border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate">Renglón {index + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="text-slate hover:text-foreground disabled:opacity-30" aria-label="Subir">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="text-slate hover:text-foreground disabled:opacity-30" aria-label="Bajar">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button type="button" onClick={onRemove} className="text-slate hover:text-destructive" aria-label="Eliminar renglón">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <textarea
        value={row.text}
        onChange={(e) => set("text", e.target.value)}
        rows={2}
        className="mb-3 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-3 gap-2">
        <Field label="Fuente">
          <select value={row.font} onChange={(e) => set("font", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
            {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Tamaño">
          <input type="number" value={row.size} onChange={(e) => set("size", Number(e.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" />
        </Field>
        <Field label="Color">
          <input type="color" value={row.color || "#000000"} onChange={(e) => set("color", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent" />
        </Field>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2">
        <Toggle value={!!row.bold} onChange={(v) => set("bold", v)} label="Bold" />
        <Toggle value={!!row.uppercase} onChange={(v) => set("uppercase", v)} label="Mayús" />
        <Field label="Interletra">
          <input type="number" step="0.05" value={row.tracking || 0} onChange={(e) => set("tracking", Number(e.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" />
        </Field>
        <Field label="Alinear">
          <select value={row.align} onChange={(e) => set("align", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
            {ALIGNS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="grid grid-cols-2 gap-2">
          <Toggle value={!!row.isLink} onChange={(v) => set("isLink", v)} label="Es enlace" />
          <Toggle value={!!row.isButton} onChange={(v) => set("isButton", v)} label="Es botón" />
        </div>

        {row.isLink && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label="Enlace a">
              <select value={row.link} onChange={(e) => set("link", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
                {LINKS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </Field>
            {row.link === "custom" && (
              <Field label="URL">
                <input value={row.url || ""} onChange={(e) => set("url", e.target.value)} placeholder="https://..." className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" />
              </Field>
            )}
            <Toggle value={!!row.underline} onChange={(v) => set("underline", v)} label="Subrayado" />
          </div>
        )}

        {row.isButton && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Field label="Fondo">
              <input type="color" value={row.bg || "#ffffff"} onChange={(e) => set("bg", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent" />
            </Field>
            <Field label="Ancho">
              <input type="number" value={row.width || 0} onChange={(e) => set("width", Number(e.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" />
            </Field>
            <Field label="Esquinas (px)">
              <input type="number" value={row.borderRadius || 0} onChange={(e) => set("borderRadius", Number(e.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" />
            </Field>
            <Toggle value={!!row.hasBorder} onChange={(v) => set("hasBorder", v)} label="Contorno" />
            <Field label="Grosor contorno">
              <input type="number" value={row.borderWidth || 1} onChange={(e) => set("borderWidth", Number(e.target.value))} disabled={!row.hasBorder} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm disabled:opacity-40" />
            </Field>
            <Field label="Color contorno">
              <input type="color" value={row.borderColor || "#e7e5e9"} onChange={(e) => set("borderColor", e.target.value)} disabled={!row.hasBorder} className="h-9 w-full rounded-md border border-input bg-transparent disabled:opacity-40" />
            </Field>
            <Field label="Interlínea V">
              <input type="number" value={row.paddingY || 0} onChange={(e) => set("paddingY", Number(e.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" />
            </Field>
            <Field label="Interlínea H">
              <input type="number" value={row.paddingX || 0} onChange={(e) => set("paddingX", Number(e.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" />
            </Field>
          </div>
        )}

        <div className="mt-2">
          <Toggle value={!!row.deliveryOnly} onChange={(v) => set("deliveryOnly", v)} label="Solo en entregas" />
        </div>
      </div>
    </div>
  );
}

export default function ContactBlockEditor({ current, onSave, onClose }) {
  const base = { ...DEFAULT_CONTACT_BLOCK, ...(current || {}) };
  const [cfg, setCfg] = useState({
    ...base,
    rows: (base.rows || []).map((r) => ({ ...blankRow(), ...r })),
  });
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setCfg((prev) => ({ ...prev, [k]: v }));
  const setRow = (i, row) => setCfg((prev) => ({ ...prev, rows: prev.rows.map((r, idx) => (idx === i ? row : r)) }));
  const removeRow = (i) => setCfg((prev) => ({ ...prev, rows: prev.rows.filter((_, idx) => idx !== i) }));
  const moveRow = (i, dir) => setCfg((prev) => {
    const j = i + dir;
    if (j < 0 || j >= prev.rows.length) return prev;
    const rows = [...prev.rows];
    [rows[i], rows[j]] = [rows[j], rows[i]];
    return { ...prev, rows };
  });
  const addRow = () => setCfg((prev) => ({ ...prev, rows: [...prev.rows, blankRow()] }));

  const save = async () => {
    setBusy(true);
    try {
      const value = JSON.stringify(cfg);
      const settings = await base44.entities.Setting.list();
      const existing = settings.find((s) => s.key === "contact_block");
      if (existing) await writeClient.entities.Setting.update(existing.id, { value });
      else await writeClient.entities.Setting.create({ key: "contact_block", value });
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
      <div className="my-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-sm bg-parchment shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-heading text-base text-foreground">Bloque de contacto</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Field label="URL de Instagram">
              <input value={cfg.instagramUrl || ""} onChange={(e) => set("instagramUrl", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" />
            </Field>
            <Field label="URL de WhatsApp">
              <input value={cfg.whatsappUrl || ""} onChange={(e) => set("whatsappUrl", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" />
            </Field>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <Field label="Espacio entre renglones (px)">
              <input type="number" value={cfg.gap || 0} onChange={(e) => set("gap", Number(e.target.value))} className="h-9 w-24 rounded-md border border-input bg-transparent px-2 text-sm" />
            </Field>
            <button type="button" onClick={addRow} className="inline-flex h-9 items-center gap-1 rounded-full bg-gold px-4 text-[11px] uppercase tracking-wider text-parchment">
              <Plus className="h-3.5 w-3.5" /> Renglón
            </button>
          </div>

          <div className="space-y-3">
            {cfg.rows.map((row, i) => (
              <RowEditor
                key={row.id}
                row={row}
                index={i}
                total={cfg.rows.length}
                onChange={(r) => setRow(i, r)}
                onRemove={() => removeRow(i)}
                onMove={(d) => moveRow(i, d)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-wider text-foreground">
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-xs uppercase tracking-wider text-parchment disabled:opacity-50">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}