// Central MAREA category definitions shared across the catalog, menu, and tabs.
export const CATEGORIES = [
  { id: "all", label: "Ver todo" },
  { id: "large_earrings", label: "Aretes grandes" },
  { id: "small_earrings", label: "Aretes pequeños" },
  { id: "necklaces", label: "Collares" },
  { id: "pulseras", label: "Pulseras" },
  { id: "anillos", label: "Anillos" },
];

export const CATEGORY_LABELS = {
  large_earrings: "Aretes grandes",
  small_earrings: "Aretes pequeños",
  necklaces: "Collares",
  pulseras: "Pulseras",
  anillos: "Anillos",
  all: "Ver todo",
};

export const INSTAGRAM_URL = "https://www.instagram.com/mareaaccesoriosmx/";
export const WHATSAPP_URL = "https://wa.me/526442600650?text=Hola%20MAREA%2C%20quiero%20ordenar";

// Colores por defecto disponibles para cada producto. Los colores personalizados
// que el admin agrega con el botón "+" NO se guardan aquí: viven solo dentro
// del arreglo `colors` del producto donde se crearon.
export const DEFAULT_COLOR_SWATCHES = [
  { id: "dorado", name: "Dorado", hex: "#BBAA78" },
  { id: "plateado", name: "Plateado", hex: "#BFB9B3" },
  { id: "multicolor", name: "Multicolor", is_multicolor: true },
];

// Fondo del swatch: sólido para un color normal, o mitad plateado/mitad dorado
// (corte duro, sin degradado) para multicolor.
export function swatchBackground(color = {}) {
  if (color.is_multicolor) return "linear-gradient(90deg, #BFB9B3 50%, #BBAA78 50%)";
  return color.hex || "#CCCCCC";
}