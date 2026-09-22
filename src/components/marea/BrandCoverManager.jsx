import React, { useRef, useState } from "react";
import { X, Plus, Trash2, ArrowUp, ArrowDown, RefreshCw, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { uploadClient } from "@/lib/uploadClient";
import { writeClient } from "@/lib/writeClient";
import { base44 } from "@/api/base44Client";
import PhotoCropper from "./PhotoCropper";

// Gestor admin de la portada: múltiples filas de carrusel pegadas. Cada fila
// tiene sus imágenes, dimensiones (ancho/alto) y modo (estático/lento/continuo).
export default function BrandCoverManager({ rows = [], onClose, onChange }) {
  const [list, setList] = useState(() =>
    Array.isArray(rows) && rows.length
      ? rows.map((r) => ({
          images: Array.isArray(r.images) ? r.images : [],
          ratio: r.ratio && r.ratio.w && r.ratio.h ? r.ratio : { w: 21, h: 9 },
          mode: r.mode || "slow",
        }))
      : [{ images: [], ratio: { w: 21, h: 9 }, mode: "slow" }]
  );
  const [busy, setBusy] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [cropRow, setCropRow] = useState(null);
  const [cropReplace, setCropReplace] = useState(null);
  const fileRef = useRef(null);

  const MODES = [
    { id: "static", label: "Estático", hint: "El usuario desliza para verlas." },
    { id: "slow", label: "Lento", hint: "Auto-avance con pausas, en bucle." },
    { id: "continuous", label: "Continuo", hint: "Carrusel sin parar." },
  ];

  const persist = async (next) => {
    setBusy(true);
    try {
      const value = JSON.stringify(next);
      const settings = await base44.entities.Setting.list();
      const existing = settings.find((s) => s.key === "brand_cover_rows");
      if (existing) await writeClient.entities.Setting.update(existing.id, { value });
      else await writeClient.entities.Setting.create({ key: "brand_cover_rows", value });
      onChange(next);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const commit = (next) => {
    setList(next);
    persist(next);
  };

  const addRow = () => {
    commit([...list, { images: [], ratio: { w: 21, h: 9 }, mode: "slow" }]);
  };

  const removeRow = (ri) => {
    if (list.length <= 1) return;
    commit(list.filter((_, i) => i !== ri));
  };

  const moveRow = (ri, dir) => {
    const j = ri + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[ri], next[j]] = [next[j], next[ri]];
    commit(next);
  };

  const addPick = (ri) => { setCropRow(ri); setCropReplace(null); fileRef.current?.click(); };
  const replacePick = (ri, i) => { setCropRow(ri); setCropReplace(i); fileRef.current?.click(); };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setCropFile(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onCropSave = async (croppedFile) => {
    setBusy(true);
    try {
      const { file_url } = await uploadClient.integrations.Core.UploadFile({ file: croppedFile });
      const next = list.map((row, ri) => {
        if (ri !== cropRow) return row;
        const images =
          cropReplace != null
            ? row.images.map((u, i) => (i === cropReplace ? file_url : u))
            : [...row.images, file_url];
        return { ...row, images };
      });
      commit(next);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      setCropFile(null);
      setCropRow(null);
      setCropReplace(null);
    }
  };

  const removeImage = (ri, i) => {
    const next = list.map((row, idx) =>
      idx === ri ? { ...row, images: row.images.filter((_, j) => j !== i) } : row
    );
    commit(next);
  };

  const moveImage = (ri, i, dir) => {
    const row = list[ri];
    const j = i + dir;
    if (j < 0 || j >= row.images.length) return;
    const images = [...row.images];
    [images[i], images[j]] = [images[j], images[i]];
    const next = list.map((r, idx) => (idx === ri ? { ...r, images } : r));
    commit(next);
  };

  const setRowRatio = (ri, rw, rh) => {
    const next = list.map((r, idx) => (idx === ri ? { ...r, ratio: { w: rw, h: rh } } : r));
    commit(next);
  };

  const setRowMode = async (ri, m) => {
    const next = list.map((r, idx) => (idx === ri ? { ...r, mode: m } : r));
    commit(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 px-4 py-8 overflow-y-auto">
      <div className="my-auto w-full max-w-lg rounded-sm bg-parchment p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-base text-foreground">Portada</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        <div className="space-y-5">
          {list.map((row, ri) => (
            <div key={ri} className="rounded-sm border border-border p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-foreground">Fila {ri + 1}</p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => moveRow(ri, -1)}
                    disabled={ri === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                    aria-label="Subir fila"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveRow(ri, 1)}
                    disabled={ri === list.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                    aria-label="Bajar fila"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeRow(ri)}
                    disabled={list.length <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-destructive text-destructive disabled:opacity-40"
                    aria-label="Eliminar fila"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {row.images.map((url, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-14 w-32 overflow-hidden rounded-sm bg-secondary">
                      <Image src={url} alt="" fittingType="fill" className="h-full w-full" />
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-1.5">
                      <button
                        onClick={() => moveImage(ri, i, -1)}
                        disabled={i === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                        aria-label="Subir"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveImage(ri, i, 1)}
                        disabled={i === row.images.length - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40"
                        aria-label="Bajar"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => replacePick(ri, i)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground"
                        aria-label="Reemplazar"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeImage(ri, i)}
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
                onClick={() => addPick(ri)}
                disabled={busy}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-wider text-foreground hover:border-gold disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Agregar imagen
              </button>

              {/* Dimensiones de esta fila */}
              <div className="mt-3 rounded-sm border border-border p-2.5">
                <p className="text-[11px] uppercase tracking-wider text-slate">Dimensiones</p>
                <RatioEditor ratio={row.ratio} onSave={(rw, rh) => setRowRatio(ri, rw, rh)} busy={busy} />
              </div>

              {/* Modo del carrusel (solo si hay 2+ imágenes) */}
              {row.images.length > 1 && (
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate">Modo</p>
                  <div className="mt-1.5 flex flex-col gap-1.5">
                    {MODES.map((m) => {
                      const active = (row.mode || "slow") === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setRowMode(ri, m.id)}
                          className={`flex items-center justify-between rounded-sm border px-2.5 py-1.5 text-left transition-colors ${
                            active ? "border-gold bg-gold/10" : "border-border hover:border-gold/60"
                          }`}
                        >
                          <span className="text-[13px] text-foreground">{m.label}</span>
                          <span className="text-[11px] text-slate">{m.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs uppercase tracking-wider text-parchment disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar fila abajo
        </button>

        <p className="mt-3 text-[11px] text-slate">Las filas se muestran pegadas, sin separación. 1 imagen = portada fija · 2 o más = carrusel.</p>
      </div>

      {cropFile && (
        <PhotoCropper
          file={cropFile}
          aspect={(Number(list[cropRow]?.ratio.w) || 21) / (Number(list[cropRow]?.ratio.h) || 9)}
          onSave={onCropSave}
          onCancel={() => { setCropFile(null); setCropRow(null); setCropReplace(null); }}
        />
      )}
    </div>
  );
}

function RatioEditor({ ratio, onSave, busy }) {
  const [w, setW] = useState(String(ratio.w));
  const [h, setH] = useState(String(ratio.h));
  return (
    <div className="mt-2 flex items-end gap-2">
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-slate">Ancho</label>
        <input
          value={w}
          onChange={(e) => setW(e.target.value)}
          type="number"
          min="1"
          className="h-9 w-20 rounded-md border border-input bg-transparent px-2 text-sm"
        />
      </div>
      <span className="pb-2 text-slate">×</span>
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-slate">Alto</label>
        <input
          value={h}
          onChange={(e) => setH(e.target.value)}
          type="number"
          min="1"
          className="h-9 w-20 rounded-md border border-input bg-transparent px-2 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          const rw = Number(w) || 21;
          const rh = Number(h) || 9;
          if (rw <= 0 || rh <= 0) return;
          onSave(rw, rh);
        }}
        disabled={busy}
        className="ml-auto inline-flex items-center rounded-full bg-obsidian px-3 py-1.5 text-[11px] uppercase tracking-wider text-parchment disabled:opacity-50"
      >
        Guardar
      </button>
    </div>
  );
}