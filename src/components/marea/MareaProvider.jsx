import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const MareaContext = createContext(null);

// Default brand cover used before the admin sets one (and as a fallback).
export const DEFAULT_COVER =
  "https://media.base44.com/images/public/6a9105ed8948a36bbe06a37f/62a751727_generated_f877364f.png";
const SAVED_KEY = "marea_saved";

export function MareaProvider({ children }) {
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [brandCover, setBrandCover] = useState(DEFAULT_COVER);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds));
    } catch {
      /* ignore */
    }
  }, [savedIds]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settings = await base44.entities.Setting.list();
        const cover = settings.find((s) => s.key === "brand_cover");
        if (cover && cover.value && mounted) setBrandCover(cover.value);
      } catch {
        /* keep default cover */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleSave = useCallback((id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const isSaved = useCallback((id) => savedIds.includes(id), [savedIds]);

  return (
    <MareaContext.Provider
      value={{
        savedIds,
        toggleSave,
        isSaved,
        savedCount: savedIds.length,
        brandCover,
        setBrandCover,
      }}
    >
      {children}
    </MareaContext.Provider>
  );
}

export function useMarea() {
  const ctx = useContext(MareaContext);
  if (!ctx) throw new Error("useMarea must be used within MareaProvider");
  return ctx;
}