import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/mareaCategories";

// Shared add/edit product screen for administrators. Guards itself: if the
// visitor is not an admin, they are redirected to the catalog.
export default function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const isAdmin = useIsAdmin();

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("large_earrings");
  const [availability, setAvailability] = useState("available");
  const [units, setUnits] = useState("");
  const [published, setPublished] = useState(false);
  const [images, setImages] = useState([]);
  const [replaceIdx, setReplaceIdx] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    if (!editing) return;
    let mounted = true;
    (async () => {
      try {
        const p = await base44.entities.Product.get(id);
        if (!mounted) return;
        setName(p.name || "");
        setDescription(p.description || "");
        setPrice(p.price != null ? String(p.price) : "");
        setCategory(p.category || "large_earrings");
        setAvailability(p.availability || "available");
        setUnits(p.units_remaining != null ? String(p.units_remaining) : "");
        setPublished(p.published ?? false);
        setImages(p.images || []);
      } catch (e) {
        setError("Could not load product.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, editing, isAdmin, navigate]);

  const addFiles = async (files) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setImages((prev) => [...prev, ...urls]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const replaceImage = async (idx, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImages((prev) => prev.map((u, i) => (i === idx ? file_url : u)));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter a product name.");
    if (price === "" || isNaN(Number(price))) return setError("Please enter a valid price.");
    if (!images.length) return setError("Please add at least one photo.");

    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      images,
      category,
      availability,
      units_remaining: availability === "limited" ? Number(units) || 0 : undefined,
      published,
    };
    try {
      if (editing) await base44.entities.Product.update(id, payload);
      else await base44.entities.Product.create(payload);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!window.confirm("Delete this product? It will be removed from the public catalog.")) return;
    setSaving(true);
    try {
      await base44.entities.Product.delete(id);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Could not delete product.");
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
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-heading text-base text-foreground">
          {editing ? "Edit product" : "New product"}
        </h1>
        <div className="w-12" />
      </header>

      <form onSubmit={submit} className="mx-auto max-w-md px-4 py-6">
        {error && (
          <div className="mb-4 rounded-sm bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Photos */}
        <section className="mb-7">
          <Label className="mb-2 block text-xs uppercase tracking-wider text-slate">Photos</Label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-obsidian/0 opacity-0 transition-opacity group-hover:bg-obsidian/50 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => { setReplaceIdx(i); fileRef.current?.click(); }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-parchment/90 text-obsidian"
                    title="Replace"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-parchment/90 text-destructive"
                    title="Delete"
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
              <span className="text-[10px] uppercase tracking-wider">Add</span>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (replaceIdx !== null && files[0]) {
                replaceImage(replaceIdx, files[0]);
              } else {
                addFiles(files);
              }
              setReplaceIdx(null);
            }}
          />
          <p className="mt-2 text-[11px] text-slate">Unlimited photos. Swipe between them on the card.</p>
        </section>

        {/* Name */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" placeholder="Aurelia Gold Hoops" />
        </div>

        {/* Price */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Price</Label>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11"
            inputMode="decimal"
            placeholder="0"
          />
        </div>

        {/* Category */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Category</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-sm border px-3 py-2 text-xs transition-colors ${
                  category === c.id
                    ? "border-obsidian bg-obsidian text-parchment"
                    : "border-border text-slate hover:border-gold"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Availability</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "available", label: "Available" },
              { id: "limited", label: "X left" },
              { id: "out_of_stock", label: "Out of Stock" },
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
              placeholder="Number of units remaining"
            />
          )}
        </div>

        {/* Description */}
        <div className="mb-5 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-slate">Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Leave empty to hide the description section"
          />
        </div>

        {/* Publish toggle */}
        <div className="mb-8 flex items-center justify-between rounded-sm border border-border px-4 py-3">
          <div>
            <p className="text-sm text-foreground">Published</p>
            <p className="text-[11px] text-slate">Visible to visitors when on</p>
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save changes" : "Save product"}
          </Button>
          {editing && (
            <Button type="button" variant="outline" onClick={remove} disabled={saving} className="h-11 border-destructive text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}