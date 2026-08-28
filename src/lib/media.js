// Utilidad para distinguir medios de video dentro del arreglo de imágenes
// (compartido por productos y empaques). Los videos se guardan como URL en el
// mismo campo "images" y se detectan por extensión al renderizar.
export function isVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  return /\.(mp4|mov|webm|m4v|ogg|avi|m3u8)(\?|#|$)/i.test(url);
}

export function isVideoFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith("video/")) return true;
  return isVideoUrl(file.name);
}