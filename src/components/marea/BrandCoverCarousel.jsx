import React, { useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { isVideoUrl } from "@/lib/media";

// Carrusel de portada: auto-avance lento y continuo (loop infinito), sin barra
// indicadora. Soporta arrastre/swipe manual (horizontal); el scroll vertical
// de la página se mantiene. 1 imagen = portada fija.
export default function BrandCoverCarousel({ images = [], aspect = "21 / 9", interval = 4500, className = "" }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const widthRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);

  const count = images.length;

  // Auto-avance lento e infinito.
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, interval);
    return () => clearInterval(t);
  }, [count, interval]);

  // Reinicia al primer slide si cambian las imágenes.
  useEffect(() => {
    setIndex(0);
    setDragX(0);
  }, [images]);

  if (!count) return null;

  const onPointerDown = (e) => {
    dragging.current = true;
    startX.current = e.clientX;
    widthRef.current = trackRef.current?.clientWidth || 1;
    setDragX(0);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setDragX(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const w = widthRef.current || 1;
    const dx = dragX;
    setDragX(0);
    if (dx > w * 0.12) setIndex((i) => (i - 1 + count) % count);
    else if (dx < -w * 0.12) setIndex((i) => (i + 1) % count);
  };

  const translate = -index * 100;
  const style = {
    aspectRatio: aspect,
    transform: `translateX(calc(${translate}% + ${dragX}px))`,
    transition: dragging.current ? "none" : "transform 1s ease",
  };

  return (
    <div
      ref={trackRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ aspectRatio: aspect, touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="flex h-full w-full" style={style}>
        {images.map((src, i) => (
          <div key={i} className="h-full w-full flex-shrink-0" style={{ aspectRatio: aspect }}>
            {isVideoUrl(src) ? (
              <video src={src} autoPlay loop muted playsInline className="pointer-events-none h-full w-full object-cover" />
            ) : (
              <Image src={src} alt="MAREA" fittingType="fill" className="h-full w-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}