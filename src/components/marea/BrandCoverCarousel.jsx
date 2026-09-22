import React, { useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { isVideoUrl } from "@/lib/media";
import SwipeGallery from "./SwipeGallery";

// Carrusel de portada con 3 modos (siempre avanza a la derecha, en bucle):
//  - "static": imágenes estáticas; el usuario desliza manualmente para verlas.
//  - "slow": auto-avance lento con pausas, transición suave, bucle continuo.
//  - "continuous": marquee que no se detiene, como un carrusel dando vueltas.
// 1 imagen = portada fija (sin carrusel).
export default function BrandCoverCarousel({ images = [], aspect = "21 / 9", mode = "slow", interval = 4500, className = "" }) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setIndex(0);
    setResetting(false);
  }, [images, mode]);

  // Slow: avanza una imagen cada `interval` ms.
  useEffect(() => {
    if (mode !== "slow" || count < 2) return;
    const t = setInterval(() => {
      setResetting(false);
      setIndex((i) => i + 1);
    }, interval);
    return () => clearInterval(t);
  }, [mode, count, interval]);

  if (!count) return null;

  // 1 imagen: portada fija.
  if (count < 2) {
    return (
      <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: aspect }}>
        <Image src={images[0]} alt="MAREA" fittingType="fill" className="h-full w-full" />
      </div>
    );
  }

  // Estático: swipe manual nativo, sin barra indicadora.
  if (mode === "static") {
    return <SwipeGallery images={images} aspect={aspect} showBar={false} className={`h-full w-full ${className}`} />;
  }

  // Continuo: marquee sin parar (set duplicado, translate 0 → -50%).
  if (mode === "continuous") {
    const track = [...images, ...images];
    const duration = count * 5; // segundos por vuelta completa
    return (
      <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: aspect }}>
        <div
          className="flex h-full"
          style={{ width: `${track.length * 100}%`, animation: `marea-marquee ${duration}s linear infinite` }}
        >
          {track.map((src, i) => (
            <Slide key={i} src={src} aspect={aspect} count={track.length} />
          ))}
        </div>
      </div>
    );
  }

  // Slow: clon de la primera al final para un bucle siempre a la derecha.
  const track = [...images, images[0]];
  const slidePct = 100 / track.length;
  const translate = -index * slidePct;

  const onTransitionEnd = () => {
    if (index === track.length - 1) {
      // Llegamos al clon (idéntico a la primera): reinicio invisible a 0.
      setResetting(true);
      setIndex(0);
    }
  };

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: aspect }}>
      <div
        className="flex h-full"
        style={{
          width: `${track.length * 100}%`,
          transform: `translateX(${translate}%)`,
          transition: resetting ? "none" : "transform 1.1s ease",
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {track.map((src, i) => (
          <Slide key={i} src={src} aspect={aspect} count={track.length} />
        ))}
      </div>
    </div>
  );
}

function Slide({ src, aspect, count }) {
  return (
    <div
      className="h-full flex-shrink-0 overflow-hidden"
      style={{ width: `${100 / count}%`, aspectRatio: aspect }}
    >
      {isVideoUrl(src) ? (
        <video src={src} autoPlay loop muted playsInline className="pointer-events-none h-full w-full object-cover" />
      ) : (
        <Image src={src} alt="MAREA" fittingType="fill" className="h-full w-full" />
      )}
    </div>
  );
}