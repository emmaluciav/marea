import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Check } from "lucide-react";
import { ColorSwatch } from "@/components/marea/ColorSwatch";
import { DEFAULT_COLOR_SWATCHES } from "@/lib/mareaCategories";
import { isVideoUrl } from "@/lib/media";

// Editor de colores para un producto (solo admin).
// - Incluye los 3 swatches por defecto (Dorado, Plateado, Multicolor).
// - Un botón "+" agrega colores personalizados por HEX; estos viven SOLO en
//   el arreglo `colors` de este producto, no se vuelven globales.
// - Permite asignar las fotos YA subidas del producto a cada color.
// - Permite gestionar la disponibilidad de forma independiente por color.
export default function AdminColorEditor({ colors, setColors, images, onError }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customHex, setCustomHex] = useState("");
  const [customName, setCustomName] = useState("");

  const toggleDefaultColor = (sw) =>
    setColors((prev) =>
      prev.some((c) => c.id === sw.id)
        ? prev.filter((c) => c.id !== sw.id)
        : [
            ...prev,
            { id: sw.id, name: sw.name, hex: sw.hex || null, is_multicolor: !!sw.is_multicolor, photo_indices: [], availability: "available", units_remaining: "" },
          ]
    );

  const removeColor = (colorId) => setColors((prev) => prev.filter((c) => c.id !== colorId));

  const toggleColorPhoto = (colorId, idx) =>
    setColors((prev) =>
      prev.map((c) =>
        c.id === colorId
          ? { ...c, photo_indices: c.photo_indices.includes(idx) ? c.photo_indices.filter((i) => i !== idx) : [...c.photo_indices, idx] }
          : c
      )
    );

  const updateColor = (colorId, patch) =>
    setColors((prev) => prev.map((c) => (c.id === colorId ? { ...c, ...patch } : c)));

  const addCustomColor = () => {
    const hex = customHex.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onError?.("Ingresa un HEX válido, p. ej. #A1B2C3");
      return;
    }
    const name = customName.trim() || hex.toUpperCase();
    setColors((prev) => [
      ...prev,
      { id: `custom_${Date.now()}`, name, hex, is_multicolor: false, photo_indices: [], availability: "available", units_remaining: "" },
    ]);
    setCustomHex("");
    setCustomName("");
    setShowCustom(false);
    onError?.("");
  };

  const AVAIL = [
    { id: "available", label: "Disponible" },
    { id: "limited", label: "Quedan X" },
    { id: "out_of_stock", label: "No disponible" },
  ];

  return (
    <div className="mb-5 space-y-2.5">
      <Label className="text-xs uppercase tracking-wider text-slate">Color</Label>

      <div className="flex flex-wrap items-center gap-2">
        {DEFAULT_COLOR_SWATCHES.map((sw) => {
          const on = colors.some((c) => c.id === sw.id);
          return (
            <button
              key={sw.id}
              type="button"
              onClick={() => toggleDefaultColor(sw)}
              className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-2 text-xs transition-colors ${
                on ? "border-obsidian bg-obsidian text-parchment" : "border-border text-slate hover:border-gold"
              }`}
            >
              <ColorSwatch color={sw} size="h-4 w-4" bare />
              {sw.name}
            </button>
          );
        })}

        {colors
          .filter((c) => c.id.startsWith("custom_"))
          .map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 rounded-sm border border-obsidian bg-obsidian px-2.5 py-2 text-xs text-parchment">
              <ColorSwatch color={c} size="h-4 w-4" bare />
              {c.name}
              <button type="button" onClick={() => removeColor(c.id)} className="ml-0.5 text-parchment/70 hover:text-parchment" title="Quitar color">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

        {!showCustom && (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-dashed border-border text-slate hover:border-gold hover:text-gold"
            title="Agregar color personalizado"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-secondary/30 p-2.5">
          <ColorSwatch color={{ hex: customHex || "#000000" }} size="h-7 w-7" bare />
          <Input value={customHex} onChange={(e) => setCustomHex(e.target.value)} className="h-9 w-32" placeholder="#A1B2C3" />
          <Input value={customName} onChange={(e) => setCustomName(e.target.value)} className="h-9 flex-1" placeholder="Nombre (opcional)" />
          <button type="button" onClick={addCustomColor} className="rounded-sm bg-obsidian px-3 py-2 text-xs text-parchment">
            Agregar
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustom(false);
              setCustomHex("");
              setCustomName("");
              onError?.("");
            }}
            className="rounded-sm border border-border px-3 py-2 text-xs text-slate"
          >
            Cancelar
          </button>
        </div>
      )}

      {colors.map((c) => (
        <div key={c.id} className="space-y-2.5 rounded-sm border border-border p-3">
          <div className="flex items-center gap-2">
            <ColorSwatch color={c} size="h-5 w-5" bare />
            <span className="text-sm text-foreground">{c.name}</span>
            <span className="text-[11px] uppercase tracking-wider text-slate">· Asignar fotos</span>
          </div>
          <p className="text-[11px] text-slate">Selecciona las fotos para este color</p>
          {images.length === 0 ? (
            <p className="text-[11px] text-slate">Sube fotos arriba primero para asignarlas a este color.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {images.map((url, i) => {
                const sel = c.photo_indices.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleColorPhoto(c.id, i)}
                    className={`relative aspect-[10/11] overflow-hidden rounded-sm ${sel ? "ring-2 ring-gold" : "opacity-50"}`}
                  >
                    {isVideoUrl(url) ? (
                      <video src={url} muted playsInline className="h-full w-full object-cover" />
                    ) : (
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    )}
                    {sel && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-parchment">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {AVAIL.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => updateColor(c.id, { availability: a.id })}
                className={`rounded-sm border px-2.5 py-1.5 text-[11px] transition-colors ${
                  c.availability === a.id ? "border-obsidian bg-obsidian text-parchment" : "border-border text-slate hover:border-gold"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          {c.availability === "limited" && (
            <Input
              value={c.units_remaining}
              onChange={(e) => updateColor(c.id, { units_remaining: e.target.value })}
              className="h-10"
              inputMode="numeric"
              placeholder="Número de piezas restantes"
            />
          )}
        </div>
      ))}
    </div>
  );
}