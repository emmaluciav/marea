import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { writeClient } from "@/lib/writeClient";
import { Image } from "@/components/ui/image";
import { useMarea, applyAccentColor } from "./MareaProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import BrandCoverCarousel from "./BrandCoverCarousel";
import BrandCoverManager from "./BrandCoverManager";
import AccentColorEditor from "./AccentColorEditor";
import { Plus, Pencil } from "lucide-react";

// Full-bleed brand cover. 1 imagen = portada fija; 2 o más = carrusel.
// En modo administrador: + gestiona las imágenes (agregar/quitar/reordenar/
// reemplazar) y el lápiz cambia el color de acento rosa de MAREA globalmente.
export default function BrandCover() {
  const { brandCovers, setBrandCovers, accentColor, setAccentColor, brandCoverRatio, setBrandCoverRatio } = useMarea();
  const isAdmin = useIsAdmin();
  const [managerOpen, setManagerOpen] = useState(false);
  const [accentOpen, setAccentOpen] = useState(false);

  const covers = brandCovers && brandCovers.length ? brandCovers : [];
  const isCarousel = covers.length > 1;
  const ratio = brandCoverRatio || { w: 21, h: 9 };
  const aspectStr = `${ratio.w} / ${ratio.h}`;

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
    <div className="relative mx-auto w-full max-w-7xl" style={{ aspectRatio: aspectStr }}>
      {isCarousel ? (
        <BrandCoverCarousel images={covers} aspect={aspectStr} className="h-full w-full" />
      ) : (
        <Image src={covers[0]} alt="MAREA" fittingType="fill" className="h-full w-full" />
      )}

      {/* Subtle vignette for editorial depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-parchment/30" />

      {isAdmin && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-obsidian/80 px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-parchment backdrop-blur-sm transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Portada
          </button>
          <button
            type="button"
            onClick={() => setAccentOpen(true)}
            aria-label="Color de acento"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-obsidian/80 text-parchment backdrop-blur-sm transition-opacity"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}

      {managerOpen && (
        <BrandCoverManager
          covers={covers}
          onClose={() => setManagerOpen(false)}
          onChange={setBrandCovers}
          ratio={ratio}
          onRatioChange={setBrandCoverRatio}
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