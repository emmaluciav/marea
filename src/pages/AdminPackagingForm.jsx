import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { uploadClient } from "@/lib/uploadClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash2, Pencil } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import PhotoCropper from "@/components/marea/PhotoCropper";
import { isVideoFile, isVideoUrl } from "@/lib/media";

// Pantalla de administración para agregar/editar opciones de empaque
// (Tipos de Empaque). Solo administradores. Fotos ilimitadas con el mismo
// posicionador sin deformación que los productos.
export default function AdminPackagingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const isAdmin = useIsAdmin();

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState("available");
  const [units, setUnits] = useState("");
  const [inventory, setInventory] = useState("0");
  const [published, setPublished] = useState(false);
  const [images, setImages] = useState([]);
  const [replaceIdx, setReplaceIdx] = useState(null);
  const [cropQueue, setCropQueue] = useState([]);
  const [cropIndex, setCropIndex] = useState(-1);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/empaque", { replace: true });
      return;
    }
    if (!editing) return;
    let mounted = true;
    (async () => {
      try {
        const p = await base44.entities.Packaging.get(id);
        if (!mounted) return;
        setName(p.name || "");
        setPrice(p.price != null ? String(p.price) : "0");
        setDescription(p.description || "");
        setPublished(p.published ?? false);
        setAvailability(p.availability || "available");
        setUnits(p.units_remaining != null ? String(p.units_remaining) : "");
        setInventory(p.inventory != null ? String(p.inventory) : "0");
        setImages(p.images || []);
      } catch {
        setError("No se pudo cargar el empaque.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, editing, isAdmin, navigate]);

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const startCropping = (files, idx) => {
    const queue = files.map((f) => ({ file: f, replaceIdx: idx }));
    setCropQueue(queue);
    setCropIndex(0);
  };

  const onCropSave = async (croppedFile) => {
    const item = cropQueue[cropIndex];
    if (!item) return;
    setUploading(true);
    try {
      const { file_url } = await uploadClient.integrations.Core.UploadFile({ file: croppedFile });
      if (item.replaceIdx !== null) {
        setImages((prev) => prev.map((u, i) => (i === item.replaceIdx ? file_url : u)));
      } else {
        setImages((prev) => [...prev, file_url]);
      }
    } catch (e) {
      console.error("Error al subir imagen:", e);
      setError(`No se pudo subir la imagen: ${e?.message || e}`);
    } finally {
      setUploading(false);
      if (cropIndex + 1 < cropQueue.length) setCropIndex(cropIndex + 1);
      else {
        setCropIndex(-1);
        setCropQueue([]);
      }
    }
  };

  const onCropCancel = () => {
    if (cropIndex + 1 < cropQueue.length) setCropIndex(cropIndex + 1);
    else {
      setCropIndex(-1);
      setCropQueue([]);
    }
  };

  // Sube videos directamente (sin recortador). Las imágenes pasan por el cropper.
  const uploadVideos = async (vids, replaceIdx) => {
    setUploading(true);
    for (let k = 0; k < vids.length; k++) {
      try {
        const { file_url } = await uploadClient.integrations.Core.UploadFile({ file: vids[k] });
        setImages((prev) => {
          if (replaceIdx !== null && k === 0) {
            return prev.map((u, i) => (i === replaceIdx ? file_url : u));
          }
          return [...prev, file_url];
        });
      } catch (e) {
        console.error("Error al subir video:", e);
        setError(`No se pudo subir el video: ${e?.message || e}`);
      }
    }
    setUploading(false);
  };

  const handleFiles = (files, replaceIdx) => {
    const vids = files.filter(isVideoFile);
    const imgs = files.filter((f) => !isVideoFile(f));
    if (vids.length) uploadVideos(vids, replaceIdx);
    if (imgs.length) startCropping(imgs, replaceIdx);
  };

  const move = (from, dir) => {
    const to = from + dir;
    if (to < 0 || to >= images.length) return;
    setImages((prev) => {
      const arr = [...prev];
      [arr[from], arr[to]] = [arr[to], arr[from]];
      return arr;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Por favor ingresa el nombre.");
    if (!images.length) return setError("Por favor agrega al menos una foto.");

    setSaving(true);
    const payload = {
      name: name.trim(),
      price: Number(price) || 0,
      description: description.trim(),
      images,
      availability,
      units_remaining: availability === "limited" ? Number(units) || 0 : undefined,
      inventory: Number(inventory) || 0,
      published,
    };
    try {
      if (editing) await base44.entities.Packaging.update(id, payload);
      else await base44.entities.Packaging.create(payload);
      navigate("/empaque", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo guardar el empaque.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!window.confirm("¿Eliminar este tipo de empaque?")) return;
    setSaving(true);
    try {
      await base44.entities.Packaging.delete(id);
      navigate("/empaque", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo eliminar el empaque.");
      setSaving(false);
    }
  };

  if (!isAdmin) return null;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <Loader2 className="h-6 w-6 animate-spin text-slate" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment pb-28">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-parchment/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate("/empaque")}
          className="flex items-center gap-1 text-sm text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Atrás
        </button>
        <h1 className="font-heading text-base text-foreground">
          {editing ? "Editar empaque" : "Nuevo empaque"}
        </h1>
        <div className="w-12" />
      </header>

      <form onSubmit={submit} className="mx-auto max-w-md px-4 py-6">
        {error && (
          <div className="mb-4 rounded-sm bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Fotos */}
        <section className="mb-7">
          <Label className="mb-2 block text-xs uppercase tracking-wider text-slate">Fotos</Label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
                {isVideoUrl(url) ? (
                  <video src={url} muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <img src={url} alt="" className="h-full w-full object-cover" />
                )}
                {isVideoUrl(url) && (
                  <span className="absolute left-1 top-1 z-10 rounded-sm bg-obsidian/80 px-1 py-0.5 text-[8px] uppercase tracking-wider text-parchment">
                    Video
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="absolute bottom-1 left-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-parchment/80 text-obsidian disabled:opacity-20"
                  title="Mover izquierda"
                >
                  <ArrowLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  className="absolute bottom-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-parchment/80 text-obsidian disabled:opacity-20"
                  title="Mover derecha"
                >
                  <ArrowRight className="h-3 w-3" />
                </button>
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-obsidian/0 opacity-0 transition-opacity group-hover:bg-obsidian/50 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => { setReplaceIdx(i); fileRef.current?.click(); }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-parchment/90 text-obsidian"
                    title="Reemplazar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-parchment/90 text-destructive"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-border text-slate hover:border-gold hover:text-gold"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="text-[10px] uppercase tracking-wider">Agregar</span>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) handleFiles(files, replaceIdx);
              setReplaceIdx(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <p className="mt-2 text-[11px] text-slate">Fotos ilimitadas. Desliza entre ellas en la tarjeta.</p>
        </section>

        {/* Nombre */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" placeholder="Caja regalo" />
        </div>

        {/* Precio */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Precio</Label>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11"
            inputMode="numeric"
            placeholder="0"
          />
          <p className="text-[11px] text-slate">Escribe 0 para mostrar "Gratis" en el catálogo.</p>
        </div>

        {/* Disponibilidad */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Disponibilidad</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "available", label: "Disponible" },
              { id: "limited", label: "Quedan X" },
              { id: "out_of_stock", label: "Agotado" },
            ].map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAvailability(a.id)}
                className={`rounded-sm border px-3 py-2 text-xs transition-colors ${
                  availability === a.id
                    ? "border-obsidian bg-obsidian text-parchment"
                    : "border-border text-slate hover:border-gold"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          {availability === "limited" && (
            <Input
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="mt-2 h-11"
              inputMode="numeric"
              placeholder="Número de piezas restantes"
            />
          )}
        </div>

        {/* Cantidad en inventario (privado) */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Cantidad en inventario</Label>
          <Input
            value={inventory}
            onChange={(e) => setInventory(e.target.value)}
            className="h-11"
            inputMode="numeric"
            placeholder="0"
          />
          <p className="text-[11px] text-slate">Privado · solo visible para ti en el Panel de administración.</p>
        </div>

        {/* Descripción */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Descripción (opcional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Deja vacío para ocultar la descripción"
          />
        </div>

        {/* Publicar */}
        <div className="mb-8 flex items-center justify-between rounded-sm border border-border px-4 py-3">
          <div>
            <p className="text-sm text-foreground">Publicado</p>
            <p className="text-[11px] text-slate">Visible para los visitantes cuando está activo</p>
          </div>
          <button
            type="button"
            onClick={() => setPublished((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${published ? "bg-gold" : "bg-border"}`}
            aria-pressed={published}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-parchment transition-transform ${published ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || uploading} className="h-11 flex-1 bg-obsidian text-parchment">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Guardar cambios" : "Guardar empaque"}
          </Button>
          {editing && (
            <Button type="button" variant="outline" onClick={remove} disabled={saving} className="h-11 border-destructive text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {cropIndex >= 0 && cropQueue[cropIndex] && (
        <PhotoCropper
          key={cropIndex}
          file={cropQueue[cropIndex].file}
          aspect={4 / 5}
          onSave={onCropSave}
          onCancel={onCropCancel}
        />
      )}
    </div>
  );
}