import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES } from "@/lib/mareaCategories";

// The menu slides down like a heavy silk curtain, full-screen with large
// editorial typography for the category names.
export default function Menu({ isAdmin = false, onClose, onLogin }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const go = (catId) => {
    navigate(catId === "all" ? "/" : `/?cat=${catId}`);
    onClose();
  };

  const exitAdmin = () => {
    logout(false);
    onClose();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-50 bg-parchment curtain-in flex flex-col">
      <div className="flex items-center justify-end px-5 pt-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.3}>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <nav className="flex flex-1 flex-col justify-center gap-2 px-7">
        {CATEGORIES.map((c, i) => (
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
          <button
            type="button"
            onClick={exitAdmin}
            className="text-xs uppercase tracking-[0.2em] text-slate underline-offset-4 hover:underline"
          >
            Exit admin mode
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="text-[10px] uppercase tracking-[0.2em] text-slate/50 hover:text-slate"
          >
            Enter as administrator
          </button>
        )}
      </div>
    </div>
  );
}