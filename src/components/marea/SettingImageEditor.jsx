import React, { useRef, useState } from "react";
import { X, Loader2, Upload, Trash2 } from "lucide-react";
import { uploadClient } from "@/lib/uploadClient";
import { writeClient } from "@/lib/writeClient";
import { base44 } from "@/api/base44Client";

// Editor genérico de una imagen guardada en Setting (subir/reemplazar/eliminar).
// Usado para la imagen mini de acceso administrador, etc.
export default function SettingImageEditor({ settingKey, title, current, onSave, onClose }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(current || "");
  const fileRef = useRef(null);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const { file_url } = await uploadClient.integrations.Core.UploadFile({ file: f });
      setPreview(file_url);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const settings = await base44.entities.Setting.list();
      const existing = settings.find((s) => s.key === settingKey);
      if (existing) await writeClient.entities.Setting.update(existing.id, { value: preview });
      else await writeClient.entities.Setting.create({ key: settingKey, value: preview });
      onSave(preview);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const settings = await base44.entities.Setting.list();
      const existing = settings.find((s) => s.key === settingKey);
      if (existing) await writeClient.entities.Setting.delete(existing.id);
      onSave(null);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 px-4 py-8">
      <div className="my-auto w-full max-w-md rounded-sm bg-parchment p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-base text-foreground">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex h-24 items-center justify-center rounded-sm border border-border bg-white p-3">
          {preview ? (
            <img src={preview} alt="" className="h-full max-w-full object-contain" />
          ) : (
            <span className="text-[11px] text-slate">Sin imagen · se usará el placeholder por defecto</span>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Subir nueva imagen
        </button>

        <div className="mt-5 flex justify-end gap-2">
          {current && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="mr-auto inline-flex items-center gap-2 rounded-full border border-destructive px-4 py-2 text-xs uppercase tracking-wider text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Quitar
            </button>
          )}
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