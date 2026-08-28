import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import ProductCard from "@/components/marea/ProductCard";
import { useMarea } from "@/components/marea/MareaProvider";
import { Loader2, Instagram, MessageCircle } from "lucide-react";
import { BookmarkIcon } from "@/components/marea/icons";
import { useToast } from "@/components/ui/use-toast";

const IG_HANDLE = "mareaaccesoriosmx";
const WA_NUMBER = "526442600650";

export default function Saved() {
  const { savedIds } = useMarea();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await base44.entities.Product.list("-created_date");
        if (mounted) setProducts(list);
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const saved = products.filter((p) => savedIds.includes(p.id));

  // Mantiene la selección válida aunque se quite un producto de guardados.
  const validSelected = selected.filter((id) => savedIds.includes(id));
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedProducts = saved.filter((p) => validSelected.includes(p.id));
  const buildMessage = () => {
    const lines = selectedProducts.map((p) => `• ${p.name}`).join("\n");
    return `Hola! Estoy interesada en estos productos:\n${lines}`;
  };

  const sendWhatsApp = () => {
    if (!selectedProducts.length) return;
    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildMessage())}`,
      "_blank"
    );
  };

  const sendInstagram = async () => {
    if (!selectedProducts.length) return;
    const msg = buildMessage();
    try {
      await navigator.clipboard.writeText(msg);
      toast({
        title: "Mensaje copiado",
        description: "Pégalo en el chat de Instagram para enviarlo a MAREA.",
      });
    } catch {
      /* si el portapapeles falla, igual abrimos Instagram */
    }
    window.open(`https://ig.me/m/${IG_HANDLE}`, "_blank");
  };

  const hasSelection = selectedProducts.length > 0;

  return (
    <div className={`pt-4 ${hasSelection ? "pb-28" : "pb-12"}`}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center gap-2">
          <BookmarkIcon filled className="h-5 w-5 text-obsidian" />
          <h1 className="font-heading text-2xl text-foreground">Guardados</h1>
          <span className="ml-1 text-sm text-slate">{saved.length}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-5 w-5 animate-spin text-slate" />
          </div>
        ) : saved.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-heading text-lg text-foreground">Tu archivo está vacío</p>
            <p className="mt-1 text-sm text-slate">
              Presiona el{" "}
              <BookmarkIcon className="inline-block h-3.5 w-3.5 align-[-2px] text-obsidian/60" />{" "}
              para guardar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            {saved.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                origin="all"
                selectable
                selected={validSelected.includes(p.id)}
                onToggleSelect={() => toggleSelect(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {hasSelection && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-parchment/95 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <span className="text-xs text-slate">
              {selectedProducts.length} seleccionado{selectedProducts.length === 1 ? "" : "s"}
            </span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={sendInstagram}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[11px] uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
              >
                <Instagram className="h-3.5 w-3.5" />
                Instagram
              </button>
              <button
                type="button"
                onClick={sendWhatsApp}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-[11px] uppercase tracking-wider text-parchment shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}