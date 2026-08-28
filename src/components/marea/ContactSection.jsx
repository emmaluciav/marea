import React from "react";
import { INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/mareaCategories";

// Bloque de información de pedido. Se usa tanto arriba (bajo la portada) como
// al final del catálogo. Incluye Instagram, WhatsApp y la ubicación.
export default function ContactSection({ variant = "bottom" }) {
  const top = variant === "top";
  return (
    <section
      className={`px-6 text-center ${
        top ? "py-10" : "border-t border-border/60 bg-secondary/40 py-14"
      }`}
    >
      <h2 className="font-heading text-2xl text-foreground">¿Quieres ordenar?</h2>
      <p className="mt-2 text-sm text-slate">Escríbenos por Instagram</p>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block font-heading text-lg text-gold underline-offset-4 hover:underline"
      >
        @mareaccesoriosmx
      </a>

      <div className="mt-7 flex flex-col items-center gap-3">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-56 items-center justify-center rounded-sm bg-obsidian text-[12px] uppercase tracking-[0.18em] text-parchment transition-opacity active:opacity-80"
        >
          Ir a Instagram
        </a>
        <p className="text-xs text-slate">También puedes contactarnos por WhatsApp</p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-56 items-center justify-center rounded-sm border border-border text-[12px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-gold hover:text-gold"
        >
          Ir a WhatsApp
        </a>
      </div>

      <p className="mt-7 text-[11px] uppercase tracking-[0.2em] text-slate">
        Ciudad Obregón, Sonora
      </p>
    </section>
  );
}