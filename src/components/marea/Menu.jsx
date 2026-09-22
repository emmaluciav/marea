import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { useMarea } from "./MareaProvider";
import { Pencil } from "lucide-react";
import SettingImageEditor from "./SettingImageEditor";

// The menu slides down like a heavy silk curtain, full-screen with large
// editorial typography for the category names.
// Las secciones se toman automáticamente de las categorías activas (BD).
export default function Menu({ isAdmin = false, onClose, onLogin }) {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { adminAccessImage, setAdminAccessImage } = useMarea();
  const [editOpen, setEditOpen] = useState(false);

  const go = (catId) => {
    navigate(catId === "all" ? "/" : `/?cat=${catId}`);
    onClose();
  };

  const exitAdmin = () => {
    sessionStorage.removeItem("marea_admin_session");
    onClose();
    navigate("/");
  };

  const visibleCats = categories
    .filter((c) => c.visible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const menuCats = [{ id: "all", label: "Ver todo" }, ...visibleCats];

  const accessImg = adminAccessImage;

  return (
    <div className="fixed inset-0 z-50 bg-parchment curtain-in flex flex-col">
      <div className="flex items-center justify-end px-5 pt-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="flex h-10 w-10 items-center justify-center text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.3}>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <nav className="flex flex-1 flex-col justify-center gap-2 px-7">
        {menuCats.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => go(c.id)}
            className="text-left font-heading text-4xl leading-tight text-foreground transition-colors hover:text-gold"
            style={{ animation: `marea-reveal 500ms ${i * 60}ms cubic-bezier(0.4,0,0.2,1) both` }}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <div className="px-7 pb-10">
        {isAdmin ? (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={exitAdmin}
              className="text-xs uppercase tracking-[0.2em] text-slate underline-offset-4 hover:underline"
            >
              Salir del modo administrador
            </button>
            <div className="flex items-center gap-2">
              {accessImg ? (
                <img src={accessImg} alt="" className="h-4 w-4 object-contain opacity-60" />
              ) : (
                <span className="block h-2.5 w-2.5 rounded-full bg-slate/40" />
              )}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                aria-label="Editar imagen de acceso"
                title="Editar imagen de acceso"
                className="text-slate hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            aria-label="."
            className="flex items-center"
          >
            {accessImg ? (
              <img
                src={accessImg}
                alt=""
                className="h-4 w-4 object-contain opacity-70 transition-opacity hover:opacity-100"
              />
            ) : (
              <span className="block h-2.5 w-2.5 rounded-full bg-slate/40 transition-colors hover:bg-gold" />
            )}
          </button>
        )}
      </div>

      {editOpen && (
        <SettingImageEditor
          settingKey="admin_access_image"
          title="Imagen de acceso administrador"
          current={adminAccessImage}
          onSave={setAdminAccessImage}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}