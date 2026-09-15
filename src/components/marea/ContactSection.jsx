import React from "react";
import { Link } from "react-router-dom";
import { INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/mareaCategories";

// Bloque de información de pedido. Se usa tanto arriba (bajo la portada) como
// al final del catálogo. Incluye Instagram, WhatsApp y la ubicación.
export default function ContactSection({ variant = "bottom", delivery = false }) {
  const top = variant === "top";
  return (
    <section
      className={`px-6 text-center ${
        top ? "pb-1 pt-10" : "border-t border-border/60 bg-secondary/40 py-14"
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
        @mareaaccesoriosmx
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

      {(top || delivery) && (
        <p className="mt-2 text-[11px] text-slate/70">
          Entrega inmediata en productos disponibles.
        </p>
      )}
      {top && (
        <div className="mt-9 flex justify-start">
          <Link
            to="/empaque"
            className="inline-flex items-center rounded-md bg-gold px-5 py-2.5 text-[12px] uppercase tracking-[0.18em] text-parchment shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
          >
            Ver Tipos de Empaque
          </Link>
        </div>
      )}
    </section>
  );
}