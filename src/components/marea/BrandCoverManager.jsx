import React, { useRef, useState } from "react";
import { X, Plus, Trash2, ArrowUp, ArrowDown, RefreshCw, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { uploadClient } from "@/lib/uploadClient";
import { writeClient } from "@/lib/writeClient";
import { base44 } from "@/api/base44Client";
import PhotoCropper from "./PhotoCropper";

// Gestor admin de la portada: varias imágenes => carrusel. Permite agregar,
// reemplazar, reordenar y eliminar. 1 imagen = portada fija (sin carrusel).
export default function BrandCoverManager({ covers, onClose, onChange }) {
  const [list, setList] = useState(covers && covers.length ? covers : []);
  const [busy, setBusy] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const fileRef = useRef(null);

  const persist = async (next) => {
    setBusy(true);
    try {
      const value = JSON.stringify(next);
      const settings = await base44.entities.Setting.list();
      const existing = settings.find((s) => s.key === "brand_covers");
      if (existing) await writeClient.entities.Setting.update(existing.id, { value });
      else await writeClient.entities.Setting.create({ key: "brand_covers", value });
      onChange(next);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const addPick = () => { setReplaceIndex(null); fileRef.current?.click(); };
  const replacePick = (i) => { setReplaceIndex(i); fileRef.current?.click(); };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setCropFile(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onCropSave = async (croppedFile) => {
    setBusy(true);
    try {
      const { file_url } = await uploadClient.integrations.Core.UploadFile({ file: croppedFile });
      let next;
      if (replaceIndex != null) {
        next = list.map((u, i) => (i === replaceIndex ? file_url : u));
      } else {
        next = [...list, file_url];
      }
      setList(next);
      await persist(next);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      setCropFile(null);
      setReplaceIndex(null);
    }
  };

  const remove = async (i) => {
    const next = list.filter((_, idx) => idx !== i);
    setList(next);
    await persist(next);
  };
  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    await persist(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 px-4 py-8">
      <div className="my-auto w-full max-w-lg rounded-sm bg-parchment p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-base text-foreground">Portada</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        <div className="space-y-3">
          {list.map((url, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-14 w-32 overflow-hidden rounded-sm bg-secondary">
                <Image src={url} alt="" fittingType="fill" className="h-full w-full" />
              </div>
              <div className="flex flex-1 items-center justify-end gap-1.5">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                  aria-label="Subir"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === list.length - 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                  aria-label="Bajar"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => replacePick(i)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground"
                  aria-label="Reemplazar"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(i)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-destructive text-destructive"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addPick}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs uppercase tracking-wider text-parchment disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar imagen
        </button>

        <p className="mt-3 text-[11px] text-slate">1 imagen = portada fija · 2 o más = carrusel.</p>
      </div>

      {cropFile && (
        <PhotoCropper
          file={cropFile}
          aspect={21 / 9}
          onSave={onCropSave}
          onCancel={() => { setCropFile(null); setReplaceIndex(null); }}
        />
      )}
    </div>
  );
}