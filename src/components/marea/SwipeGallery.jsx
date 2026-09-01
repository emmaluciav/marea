import React, { useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { isVideoUrl } from "@/lib/media";

// Horizontal, snap-scrolling image gallery with a thin segmented progress bar.
// A tap (no horizontal movement) fires onImageClick; a swipe does not.
// `jumpTo` (opcional) lleva la galería a una foto específica SIN filtrar las
// demás: solo desplaza el scroll, como si el usuario hubiera hecho swipe.
export default function SwipeGallery({
  images = [],
  aspect = "3 / 4",
  onImageClick,
  className = "",
  imageClassName = "",
  showBar = true,
  jumpTo = null,
}) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const startX = useRef(0);

  // Cuando llega un índice de salto externo, desplaza la galería a esa foto.
  useEffect(() => {
    if (jumpTo == null || !images.length) return;
    const el = ref.current;
    if (!el) return;
    const idx = Math.min(Math.max(jumpTo, 0), images.length - 1);
    el.scrollTo({ left: idx * el.clientWidth, behavior: "auto" });
    setActive(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTo]);

  if (!images.length) return null;

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  };

  const handleClick = (i) => {
    const el = ref.current;
    if (el && Math.abs(el.scrollLeft - startX.current) > 6) return;
    onImageClick && onImageClick(i);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        onTouchStart={() => {
          startX.current = ref.current ? ref.current.scrollLeft : 0;
        }}
        onScroll={onScroll}
        className="no-scrollbar flex w-full overflow-x-auto snap-x snap-mandatory"
        style={{ aspectRatio: aspect, WebkitOverflowScrolling: "touch" }}
      >
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            className={`relative w-full flex-shrink-0 snap-center ${imageClassName}`}
            style={{ aspectRatio: aspect }}
          >
            {isVideoUrl(src) ? (
              <video
                src={src}
                autoPlay
                loop
                muted
                playsInline
                className="pointer-events-none h-full w-full object-cover"
              />
            ) : (
              <Image src={src} alt="" fittingType="fill" className="w-full h-full" />
            )}
          </button>
        ))}
      </div>

      {showBar && images.length > 1 && (
        <div className="pointer-events-none absolute bottom-0 inset-x-0 flex gap-1 px-3 pb-2">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                i === active ? "bg-obsidian/70" : "bg-obsidian/15"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}