import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BrandCover from "@/components/marea/BrandCover";
import CategoryTabs from "@/components/marea/CategoryTabs";
import ContactSection from "@/components/marea/ContactSection";
import ProductCard from "@/components/marea/ProductCard";
import { Loader2 } from "lucide-react";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const cat = searchParams.get("cat") || "all";

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

  const filtered = cat === "all" ? products : products.filter((p) => p.category === cat);

  return (
    <div>
      <BrandCover />

      <ContactSection variant="top" />

      <CategoryTabs active={cat} />

      <div className="mx-auto max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-5 w-5 animate-spin text-slate" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <p className="font-heading text-lg text-foreground">Aún no hay piezas</p>
            <p className="mt-1 text-sm text-slate">Pronto llegarán nuevas piezas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2 gap-y-4 px-3 pb-12 sm:grid-cols-3 sm:px-4 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} origin={cat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}