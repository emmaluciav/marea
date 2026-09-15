import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CATEGORIES } from "@/lib/mareaCategories";

// Carga las secciones (categorías) dinámicas desde la BD.
// Devuelve objetos normalizados: { id (key), label, visible, order, recordId }.
// RLS: los visitantes no-admin solo reciben las visibles; el admin recibe
// todas (incluidas las ocultas), que es lo que necesitan las pantallas de
// administración. Si la BD aún no tiene registros (p.ej. antes de sembrar),
// se conserva la lista integrada por defecto para no vaciar el catálogo.
export function useCategories() {
  const fallback = CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
    id: c.id,
    label: c.label,
    visible: true,
    order: 0,
    recordId: null,
  }));

  const [categories, setCategories] = useState(fallback);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Category.list("order");
      if (list && list.length) {
        setCategories(
          list.map((c) => ({
            id: c.key,
            label: c.label,
            visible: !!c.visible,
            order: Number(c.order) || 0,
            recordId: c.id,
          }))
        );
      }
    } catch {
      /* keep fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, loading, reload: load };
}