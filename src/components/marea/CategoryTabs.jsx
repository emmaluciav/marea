import React from "react";
import { useSearchParams } from "react-router-dom";

// Navegación horizontal de categorías. Recibe la lista de secciones visibles
// desde el catálogo (ya filtradas), y prepone la pestaña virtual "Ver todo".
export default function CategoryTabs({ active = "all", categories = [] }) {
  const [, setSearchParams] = useSearchParams();

  const select = (id) => {
    setSearchParams(id === "all" ? {} : { cat: id }, { replace: true });
  };

  const tabs = [{ id: "all", label: "Ver todo" }, ...categories];

  return (
    <div className="no-scrollbar sticky top-14 z-20 flex gap-3 overflow-x-auto border-b border-border/60 bg-parchment/85 px-4 py-3 backdrop-blur-md">
      {tabs.map((c) => {
        const isActive = active === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => select(c.id)}
            className={`whitespace-nowrap text-[12px] uppercase tracking-[0.12em] transition-colors ${
              isActive ? "text-foreground" : "text-slate"
            }`}
          >
            {c.label}
            {isActive && <span className="mt-1 block h-px w-full bg-gold" />}
          </button>
        );
      })}
    </div>
  );
}