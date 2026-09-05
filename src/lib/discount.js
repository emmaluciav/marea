// Utilidades de descuento de producto.
// El descuento puede ser general (discount_color_id vacío) o aplicarse a un
// color específico. `contextColorId` es el color que se está mostrando/active
// en la vista actual; si el descuento es de color, solo "aplica" cuando ese
// color coincide.

export function hasDiscount(product) {
  const pct = Math.round(Number(product?.discount_percent) || 0);
  return pct >= 1 && pct <= 100;
}

// Devuelve info del descuento si existe y aplica al contexto, o null.
export function discountInfo(product, contextColorId = null) {
  const pct = Math.round(Number(product?.discount_percent) || 0);
  if (pct < 1 || pct > 100) return null;
  const price = Number(product?.price) || 0;
  const finalPrice = Math.round(price * (1 - pct / 100));
  const colorId = product?.discount_color_id || null;
  const applies = !colorId || colorId === contextColorId;
  if (!applies) return null;
  return { percent: pct, finalPrice, originalPrice: price, colorId };
}