/* @refresh reset */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const MareaContext = createContext(null);

// Default brand cover used before the admin sets one (and as a fallback).
export const DEFAULT_COVER =
  "https://media.base44.com/images/public/6a9105ed8948a36bbe06a37f/62a751727_generated_f877364f.png";
const SAVED_KEY = "marea_saved";

// Tokens MAREA que usan el rosa de acento. Cambiarlos a la vez actualiza todo
// (botones, iconos, líneas, highlights) que use bg-gold / text-gold / bg-primary.
const ACCENT_TOKENS = ["--primary", "--accent", "--ring", "--gold", "--chart-1", "--admin-dot-hover"];

function hexToHslChannels(hex) {
  let h = (hex || "").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue *= 60;
  }
  return `${Math.round(hue)} ${Math.round(sat * 100)}% ${Math.round(l * 100)}%`;
}

// Aplica un hex de acento sobreescribiendo los tokens CSS en :root.
export function applyAccentColor(hex) {
  const channels = hexToHslChannels(hex);
  if (!channels) return;
  const root = document.documentElement;
  ACCENT_TOKENS.forEach((t) => root.style.setProperty(t, channels));
}

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
  const [brandCovers, setBrandCovers] = useState([DEFAULT_COVER]);
  const [accentColor, setAccentColor] = useState(null);
  const [packagingWidget, setPackagingWidget] = useState(null);
  const [filterConfig, setFilterConfig] = useState(null);
  const [brandLogo, setBrandLogo] = useState(null);
  const [brandCoverRatio, setBrandCoverRatio] = useState(null);
  const [adminAccessImage, setAdminAccessImage] = useState(null);
  const [contactBlock, setContactBlock] = useState(null);

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
        if (!mounted) return;
        // Portada: preferir arreglo (carrusel), luego portada única, luego default.
        const coversSetting = settings.find((s) => s.key === "brand_covers");
        const single = settings.find((s) => s.key === "brand_cover");
        let covers = null;
        if (coversSetting && coversSetting.value) {
          try { covers = JSON.parse(coversSetting.value); } catch { /* ignore */ }
        }
        if (!Array.isArray(covers) || !covers.length) {
          if (single && single.value) covers = [single.value];
        }
        if (Array.isArray(covers) && covers.length) setBrandCovers(covers);

        // Color de acento global.
        const accent = settings.find((s) => s.key === "marea_accent_color");
        if (accent && accent.value) {
          setAccentColor(accent.value);
          applyAccentColor(accent.value);
        }

        // Widget "Ver Tipos de Empaque" (texto, colores, posición, esquinas).
        const pw = settings.find((s) => s.key === "packaging_widget");
        if (pw && pw.value) {
          try { setPackagingWidget(JSON.parse(pw.value)); } catch { /* ignore */ }
        }

        // Configuración de filtros del catálogo (visibilidad + opciones de color).
        const cf = settings.find((s) => s.key === "catalog_filters");
        if (cf && cf.value) {
          try { setFilterConfig(JSON.parse(cf.value)); } catch { /* ignore */ }
        }

        // Logo del encabezado.
        const logo = settings.find((s) => s.key === "brand_logo");
        if (logo && logo.value) setBrandLogo(logo.value);

        // Imagen mini de acceso administrador (reemplaza "Entrar como admin").
        const accessImg = settings.find((s) => s.key === "admin_access_image");
        if (accessImg && accessImg.value) setAdminAccessImage(accessImg.value);

        // Bloque de contacto editable (renglones, estilos, enlaces).
        const cb = settings.find((s) => s.key === "contact_block");
        if (cb && cb.value) {
          try { setContactBlock(JSON.parse(cb.value)); } catch { /* ignore */ }
        }

        // Proporción de la portada (ancho/alto en cm → ratio).
        const ratio = settings.find((s) => s.key === "brand_cover_ratio");
        if (ratio && ratio.value) {
          try {
            const parsed = JSON.parse(ratio.value);
            if (parsed && parsed.w && parsed.h) setBrandCoverRatio(parsed);
          } catch { /* ignore */ }
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const savedIds = savedItems.map((s) => s.id);

  // Variant-aware: con color, verifica la variante exacta; sin color, cualquiera.
  const isSaved = useCallback((id, colorId = null) => {
    if (colorId === null || colorId === undefined) return savedItems.some((s) => s.id === id);
    return savedItems.some((s) => s.id === id && s.color === colorId);
  }, [savedItems]);

  // Con color: alterna esa variante exacta (permite guardar Oro y Plata por
  // separado). Sin color: si existe cualquier entrada del producto las quita
  // todas; si no, guarda una entrada sin color.
  const toggleSave = useCallback((id, color = null) => {
    setSavedItems((prev) => {
      if (color !== null && color !== undefined) {
        const exact = prev.some((s) => s.id === id && s.color === color);
        if (exact) return prev.filter((s) => !(s.id === id && s.color === color));
        return [...prev, { id, color }];
      }
      const any = prev.some((s) => s.id === id);
      if (any) return prev.filter((s) => s.id !== id);
      return [...prev, { id, color: null }];
    });
  }, []);

  const setSavedColor = useCallback((id, color) => {
    setSavedItems((prev) =>
      prev.some((s) => s.id === id) ? prev.map((s) => (s.id === id ? { ...s, color } : s)) : prev
    );
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
        brandCover: brandCovers[0],
        brandCovers,
        setBrandCovers,
        accentColor,
        setAccentColor,
        packagingWidget,
        setPackagingWidget,
        filterConfig,
        setFilterConfig,
        brandLogo,
        setBrandLogo,
        brandCoverRatio,
        setBrandCoverRatio,
        adminAccessImage,
        setAdminAccessImage,
        contactBlock,
        setContactBlock,
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