import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useMarea } from "./MareaProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";

// Full-bleed brand cover ("Cinematic Aperture"). In admin mode a small
// configuration widget lets the admin replace the image.
export default function BrandCover() {
  const { brandCover, setBrandCover } = useMarea();
  const isAdmin = useIsAdmin();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const replace = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      // Persist to the Setting entity (admin-only write).
      const settings = await base44.entities.Setting.list();
      const existing = settings.find((s) => s.key === "brand_cover");
      if (existing) {
        await base44.entities.Setting.update(existing.id, { value: file_url });
      } else {
        await base44.entities.Setting.create({ key: "brand_cover", value: file_url });
      }
      setBrandCover(file_url);
    } catch (err) {
      // ignore — keep current cover
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
      <Image src={brandCover} alt="MAREA" fittingType="fill" className="h-full w-full" />

      {/* Subtle vignette for editorial depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-parchment/30" />

      {isAdmin && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={replace}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full bg-obsidian/80 px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-parchment backdrop-blur-sm transition-opacity disabled:opacity-50"
          >
            {uploading ? "Subiendo…" : "Cambiar portada"}
          </button>
        </div>
      )}
    </div>
  );
}