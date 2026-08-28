import React from "react";
import { INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/mareaCategories";

// "Want to order?" contact block shown at the bottom of the catalog and saved pages.
export default function ContactSection() {
  return (
    <section className="border-t border-border/60 bg-secondary/40 px-6 py-14 text-center">
      <h2 className="font-heading text-2xl text-foreground">Want to order?</h2>
      <p className="mt-2 text-sm text-slate">DM us on Instagram</p>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block font-heading text-lg text-gold underline-offset-4 hover:underline"
      >
        @Marea.accesories
      </a>

      <div className="mt-7 flex flex-col items-center gap-3">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-56 items-center justify-center rounded-sm bg-obsidian text-[12px] uppercase tracking-[0.18em] text-parchment transition-opacity active:opacity-80"
        >
          Go to Instagram
        </a>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-56 items-center justify-center rounded-sm border border-border text-[12px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-gold hover:text-gold"
        >
          Message on WhatsApp
        </a>
      </div>
    </section>
  );
}