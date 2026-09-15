/* @refresh reset */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const MareaContext = createContext(null);

// Default brand cover used before the admin sets one (and as a fallback).
export const DEFAULT_COVER =
  "https://media.base44.com/images/public/6a9105ed8948a36bbe06a37f/62a751727_generated_f877364f.png";
const SAVED_KEY = "marea_saved";

// Migra el formato viejo (arreglo de strings) al nuevo (arreglo de
// { id, color }) de forma transparente.
function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((x) =>
        typeof x === "string" ? { id: x, color: null } : { id: x.id, color: x.color || null }
      );
    }
    return [];
  } catch {
    return [];
  }
}

export function MareaProvider({ children }) {
  const [savedItems, setSavedItems] = useState(loadSaved);
  const [brandCover, setBrandCover] = useState(DEFAULT_COVER);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedItems));
    } catch {
      /* ignore */
    }
  }, [savedItems]);

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

  const savedIds = savedItems.map((s) => s.id);

  const isSaved = useCallback((id) => savedIds.includes(id), [savedIds]);

  // Guarda (o quita) un producto. El color seleccionado se recuerda junto con él.
  const toggleSave = useCallback((id, color = null) => {
    setSavedItems((prev) => {
      if (prev.some((s) => s.id === id)) return prev.filter((s) => s.id !== id);
      return [...prev, { id, color }];
    });
  }, []);

  // Actualiza el color de un producto ya guardado (sin tocar el guardado en sí).
  const setSavedColor = useCallback((id, color) => {
    setSavedItems((prev) => (prev.some((s) => s.id === id) ? prev.map((s) => (s.id === id ? { ...s, color } : s)) : prev));
  }, []);

  const getSavedColor = useCallback(
    (id) => {
      const item = savedItems.find((s) => s.id === id);
      return item ? item.color : null;
    },
    [savedItems]
  );

  return (
    <MareaContext.Provider
      value={{
        savedIds,
        savedItems,
        savedCount: savedItems.length,
        isSaved,
        toggleSave,
        setSavedColor,
        getSavedColor,
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