import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookmarkIcon } from "./icons";
import { ArrowLeft, ClipboardList, Pencil } from "lucide-react";
import { useMarea } from "./MareaProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { CATEGORIES } from "@/lib/mareaCategories";
import AdminLogin from "./AdminLogin";
import LogoEditor from "./LogoEditor";
import SaveHint from "./SaveHint";
import Menu from "./Menu";

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { savedCount, brandLogo, setBrandLogo } = useMarea();
  const isAdmin = useIsAdmin();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);

  const isHome = location.pathname === "/";
  const isSavedPage = location.pathname === "/saved";
  const searchParams = new URLSearchParams(location.search);
  const cat = searchParams.get("cat") || "all";
  const from = searchParams.get("from") || "all";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/60 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            src={brandLogo || "https://cdn.phototourl.com/free/2026-08-28-aafc3b10-71bd-4dd3-9d1e-eb1a811109ac.png"}
            alt="MAREA"
            className="pointer-events-none h-14 object-contain"
          />
          {isAdmin && (
            <button
              type="button"
              onClick={() => setLogoEditorOpen(true)}
              aria-label="Editar logo"
              title="Editar logo"
              className="absolute -right-7 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-obsidian/80 text-parchment shadow-sm transition-transform active:scale-95"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
        {/* Left: discreet admin entry (home only) OR back arrow */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate("/admin/inventario")}
              aria-label="Panel de administración"
              title="Panel de administración"
              className="flex h-9 w-9 items-center justify-center text-gold transition-opacity active:opacity-60"
            >
              <ClipboardList className="h-5 w-5" />
            </button>
          )}
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
              className="flex h-9 w-9 items-center justify-center rounded-br-lg bg-gold text-parchment shadow-sm transition-transform active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {isSavedPage && (
            <button
              type="button"
              onClick={() => navigate(from === "all" ? "/" : `/?cat=${from}`)}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-opacity active:opacity-60"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Right: saved + hamburger */}
        <div className="flex items-center gap-2">
          {!isSavedPage && (
            <button
              type="button"
              onClick={() => navigate(`/saved?from=${cat}`)}
              className="relative flex items-center gap-1.5 text-foreground transition-opacity active:opacity-60"
              aria-label="Productos guardados"
            >
              <BookmarkIcon filled={savedCount > 0} className={`h-6 w-6 ${savedCount > 0 ? "text-obsidian" : "text-obsidian/70"}`} />
              {savedCount > 0 && (
                <span className="text-xs font-medium tabular-nums text-foreground/70">
                  {savedCount}
                </span>
              )}
            </button>
          )}
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
        </div>
        </div>
      </header>

      {isHome && (
        <SaveHint message="Guarda tus favoritos en guardados" className="top-16 right-3" />
      )}

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
      {logoEditorOpen && (
        <LogoEditor
          currentLogo={brandLogo}
          onSave={setBrandLogo}
          onClose={() => setLogoEditorOpen(false)}
        />
      )}
    </>
  );
}