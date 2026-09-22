import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { writeClient } from "@/lib/writeClient";
import { useMarea, applyAccentColor } from "./MareaProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import BrandCoverCarousel from "./BrandCoverCarousel";
import BrandCoverManager from "./BrandCoverManager";
import AccentColorEditor from "./AccentColorEditor";
import { Plus, Pencil } from "lucide-react";

// Portada: una o varias filas de carrusel pegadas (sin separación).
// Cada fila tiene sus propias imágenes, dimensiones y modo.
// En modo administrador: + gestiona las filas (agregar/editar/eliminar) y
// el lápiz cambia el color de acento rosa de MAREA globalmente.
export default function BrandCover() {
  const { brandCoverRows, setBrandCoverRows, accentColor, setAccentColor } = useMarea();
  const isAdmin = useIsAdmin();
  const [managerOpen, setManagerOpen] = useState(false);
  const [accentOpen, setAccentOpen] = useState(false);

  const rows = (brandCoverRows || []).filter((r) => r.images && r.images.length);

  const saveAccent = async (hex) => {
    try {
      const settings = await base44.entities.Setting.list();
      const existing = settings.find((s) => s.key === "marea_accent_color");
      if (existing) await writeClient.entities.Setting.update(existing.id, { value: hex });
      else await writeClient.entities.Setting.create({ key: "marea_accent_color", value: hex });
      applyAccentColor(hex);
      setAccentColor(hex);
    } catch {
      /* ignore */
    }
    setAccentOpen(false);
  };

  return (
    <div className="relative mx-auto w-full max-w-7xl">
      {/* Filas pegadas, sin gap */}
      <div className="flex flex-col">
        {rows.map((r, i) => {
          const ratio = r.ratio && r.ratio.w && r.ratio.h ? r.ratio : { w: 21, h: 9 };
          const aspectStr = `${ratio.w} / ${ratio.h}`;
          return (
            <BrandCoverCarousel
              key={i}
              images={r.images}
              aspect={aspectStr}
              mode={r.mode || "slow"}
              className="w-full"
            />
          );
        })}
      </div>

      {isAdmin && rows.length > 0 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-obsidian/80 px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-parchment backdrop-blur-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Portada
          </button>
          <button
            type="button"
            onClick={() => setAccentOpen(true)}
            aria-label="Color de acento"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-obsidian/80 text-parchment backdrop-blur-sm"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}

      {managerOpen && (
        <BrandCoverManager
          rows={brandCoverRows}
          onClose={() => setManagerOpen(false)}
          onChange={setBrandCoverRows}
        />
      )}
      {accentOpen && (
        <AccentColorEditor
          currentHex={accentColor}
          onSave={saveAccent}
          onClose={() => setAccentOpen(false)}
        />
      )}
    </div>
  );
}