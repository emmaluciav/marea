import React, { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { writeClient } from "@/lib/writeClient";

// Editor admin del widget "Ver Tipos de Empaque": texto, color de fondo, color
// de texto, posición y esquinas. La configuración se persiste en Setting
// "packaging_widget" y se aplica en vivo vía el contexto de Marea.
const DEFAULT = {
  text: "Ver Tipos de Empaque",
  textColor: "#FFFFFF",
  bgColor: "#DB949B",
  position: "left",
  corners: "rounded",
};

export default function PackagingWidgetEditor({ current, onSave, onClose }) {
  const [cfg, setCfg] = useState({ ...DEFAULT, ...(current || {}) });
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setCfg((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const value = JSON.stringify(cfg);
      const settings = await base44.entities.Setting.list();
      const existing = settings.find((s) => s.key === "packaging_widget");
      if (existing) await writeClient.entities.Setting.update(existing.id, { value });
      else await writeClient.entities.Setting.create({ key: "packaging_widget", value });
      onSave(cfg);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
    onClose();
  };

  const radius = cfg.corners === "square" ? "rounded-none" : "rounded-md";
  const justify =
    cfg.position === "center" ? "center" : cfg.position === "right" ? "flex-end" : "flex-start";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 px-6">
      <div className="w-full max-w-sm rounded-sm bg-parchment p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-base text-foreground">Widget de empaques</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="text-[11px] uppercase tracking-wider text-slate">Texto</label>
        <input
          value={cfg.text}
          onChange={(e) => set("text", e.target.value)}
          className="mt-1 mb-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate">Color de fondo</label>
            <input
              type="color"
              value={cfg.bgColor}
              onChange={(e) => set("bgColor", e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate">Color de texto</label>
            <input
              type="color"
              value={cfg.textColor}
              onChange={(e) => set("textColor", e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate">Posición</label>
            <select
              value={cfg.position}
              onChange={(e) => set("position", e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate">Esquinas</label>
            <select
              value={cfg.corners}
              onChange={(e) => set("corners", e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="rounded">Redondeadas</option>
              <option value="square">Cuadradas</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-[11px] uppercase tracking-wider text-slate">Vista previa</p>
        <div
          className="mt-2 flex rounded-sm border border-border bg-secondary/40 p-4"
          style={{ justifyContent: justify }}
        >
          <span
            className={`inline-flex items-center px-5 py-2.5 text-[12px] uppercase tracking-[0.18em] shadow-sm ${radius}`}
            style={{ background: cfg.bgColor, color: cfg.textColor }}
          >
            {cfg.text || "Ver Tipos de Empaque"}
          </span>
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
            className="rounded-full bg-gold px-5 py-2 text-xs uppercase tracking-wider text-parchment disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}