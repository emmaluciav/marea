import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BrandCover from "@/components/marea/BrandCover";
import CategoryTabs from "@/components/marea/CategoryTabs";
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

      <CategoryTabs active={cat} />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-slate" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-24 text-center">
          <p className="font-heading text-lg text-foreground">Nothing here yet</p>
          <p className="mt-1 text-sm text-slate">New pieces arrive soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-2 gap-y-4 px-3 pb-12">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} origin={cat} />
          ))}
        </div>
      )}
    </div>
  );
}