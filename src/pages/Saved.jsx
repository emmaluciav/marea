import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import ProductCard from "@/components/marea/ProductCard";
import { useMarea } from "@/components/marea/MareaProvider";
import { Loader2, Instagram, MessageCircle, Send, Copy } from "lucide-react";
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
    const lines = selectedProducts
      .map((p) => `• ${p.name}\n${window.location.origin}/product/${p.id}`)
      .join("\n");
    return `Hola, me interesan estos productos:\n${lines}`;
  };

  // Solo productos + enlaces, sin el saludo — para compartir donde quieran.
  const buildProductsOnly = () =>
    selectedProducts
      .map((p) => `• ${p.name}\n${window.location.origin}/product/${p.id}`)
      .join("\n");

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
        description: "Pégalo en el chat de Instagram para enviarlo a Marea.",
      });
    } catch {
      /* si el portapapeles falla, igual abrimos Instagram */
    }
    window.open(`https://ig.me/m/${IG_HANDLE}`, "_blank");
  };

  const copyProducts = async () => {
    if (!selectedProducts.length) return;
    try {
      await navigator.clipboard.writeText(buildProductsOnly());
      toast({
        title: "Productos copiados",
        description: "Ya puedes pegarlos donde quieras.",
      });
    } catch {
      toast({
        title: "No se pudo copiar",
        description: "Inténtalo de nuevo.",
      });
    }
  };

  const hasSelection = selectedProducts.length > 0;

  return (
    <div className={`pt-4 ${hasSelection ? "pb-48" : "pb-12"}`}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center gap-2">
          <BookmarkIcon filled className="h-5 w-5 text-obsidian" />
          <h1 className="font-heading text-2xl text-foreground">Guardados</h1>
          <span className="ml-1 text-sm text-slate">{saved.length}</span>
        </div>

        {saved.length > 0 && (
          <div className="mb-5 flex items-center gap-2.5 rounded-sm border border-border bg-secondary/40 px-3 py-2.5">
            <Send className="h-4 w-4 shrink-0 text-gold" />
            <p className="text-[12px] leading-snug text-slate">
              Selecciona los productos que te interesan para enviarlos a Marea.
            </p>
          </div>
        )}

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
                origin="saved"
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
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-center text-xs text-slate">
              {selectedProducts.length} producto{selectedProducts.length === 1 ? "" : "s"} seleccionado{selectedProducts.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={sendInstagram}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
              >
                <Instagram className="h-4 w-4" />
                Copiar y pegar en Instagram
              </button>
              <button
                type="button"
                onClick={sendWhatsApp}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-4 py-2.5 text-[11px] uppercase tracking-wider text-parchment shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar productos por WhatsApp
              </button>
              <button
                type="button"
                onClick={copyProducts}
                className="mx-auto mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate transition-colors hover:text-foreground"
              >
                <Copy className="h-3 w-3" />
                Copiar productos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}