import React from "react";
import { useSearchParams } from "react-router-dom";
import { CATEGORIES } from "@/lib/mareaCategories";

// Horizontal, scrollable category navigation: ALL | LARGE EARRINGS | ...
export default function CategoryTabs({ active = "all" }) {
  const [, setSearchParams] = useSearchParams();

  const select = (id) => {
    setSearchParams(id === "all" ? {} : { cat: id }, { replace: true });
  };

  return (
    <div className="no-scrollbar sticky top-14 z-20 flex gap-5 overflow-x-auto border-b border-border/60 bg-parchment/85 px-4 py-3 backdrop-blur-md">
      {CATEGORIES.map((c) => {
        const isActive = active === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => select(c.id)}
            className={`whitespace-nowrap text-[11px] uppercase tracking-[0.18em] transition-colors ${
              isActive ? "text-foreground" : "text-slate"
            }`}
          >
            {c.label}
            {isActive && (
              <span className="mt-1 block h-px w-full bg-gold" />
            )}
          </button>
        );
      })}
    </div>
  );
}