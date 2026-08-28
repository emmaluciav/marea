import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import ProductCard from "@/components/marea/ProductCard";
import { useMarea } from "@/components/marea/MareaProvider";
import { Loader2 } from "lucide-react";
import { BookmarkIcon } from "@/components/marea/icons";

export default function Saved() {
  const { savedIds } = useMarea();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="pb-12 pt-4">
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
              <ProductCard key={p.id} product={p} index={i} origin="all" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}