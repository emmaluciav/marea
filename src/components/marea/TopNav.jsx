import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HeartIcon } from "./icons";
import { useMarea } from "./MareaProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { CATEGORIES } from "@/lib/mareaCategories";
import AdminLogin from "./AdminLogin";
import Menu from "./Menu";

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { savedCount } = useMarea();
  const isAdmin = useIsAdmin();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const isHome = location.pathname === "/";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-parchment/85 px-4 backdrop-blur-md">
        {/* Left: discreet admin entry (home only) OR saved heart */}
        <div className="flex items-center gap-3">
          {isHome && !isAdmin && (
            <button
              type="button"
              aria-label="."
              title=""
              onClick={() => setLoginOpen(true)}
              className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full bg-admin-dot transition-colors duration-300 hover:bg-admin-dot-hover"
            />
          )}
          {isHome && isAdmin && (
            <button
              type="button"
              aria-label="Agregar producto"
              onClick={() => navigate("/admin/add")}
              className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-br-lg bg-gold text-parchment shadow-sm transition-transform active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/saved")}
            className="relative ml-9 flex items-center gap-1.5 text-foreground transition-opacity active:opacity-60"
            aria-label="Productos guardados"
          >
            <HeartIcon filled={savedCount > 0} className={`h-5 w-5 ${savedCount > 0 ? "text-obsidian" : "text-obsidian/70"}`} />
            {savedCount > 0 && (
              <span className="text-[11px] font-medium tabular-nums text-foreground/70">
                {savedCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center text-foreground transition-opacity active:opacity-60"
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.4}>
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {menuOpen && (
        <Menu
          isAdmin={isAdmin}
          onClose={() => setMenuOpen(false)}
          onLogin={() => {
            setMenuOpen(false);
            setLoginOpen(true);
          }}
        />
      )}
      {loginOpen && <AdminLogin onClose={() => setLoginOpen(false)} />}
    </>
  );
}