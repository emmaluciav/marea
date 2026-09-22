import React, { useState } from "react";
import { Link } from "react-router-dom";
import { INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/mareaCategories";
import { useMarea } from "./MareaProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Pencil } from "lucide-react";
import PackagingWidgetEditor from "./PackagingWidgetEditor";
import ContactBlockEditor from "./ContactBlockEditor";

export const DEFAULT_CONTACT_BLOCK = {
  instagramUrl: INSTAGRAM_URL,
  whatsappUrl: WHATSAPP_URL,
  gap: 8,
  rows: [
    { id: "r1", text: "¿Quieres ordenar?", font: "heading", size: 24, color: "#1a1a1c", align: "center" },
    { id: "r2", text: "Escríbenos por Instagram", font: "body", size: 14, color: "#6b6965", align: "center" },
    { id: "r3", text: "@mareaaccesoriosmx", font: "heading", size: 18, color: "#DB949B", isLink: true, link: "instagram", align: "center" },
    { id: "r4", text: "Ir a Instagram", font: "heading", size: 12, color: "#FFFFFF", uppercase: true, tracking: 0.18, align: "center", isLink: true, link: "instagram", isButton: true, bg: "#1a1a1c", hasBorder: false, borderRadius: 2, paddingX: 20, paddingY: 16, width: 224 },
    { id: "r5", text: "También puedes contactarnos por WhatsApp", font: "body", size: 12, color: "#6b6965", align: "center" },
    { id: "r6", text: "Ir a WhatsApp", font: "heading", size: 12, color: "#1a1a1c", uppercase: true, tracking: 0.18, align: "center", isLink: true, link: "whatsapp", isButton: true, hasBorder: true, borderColor: "#e7e5e9", borderWidth: 1, borderRadius: 2, paddingX: 20, paddingY: 16, width: 224 },
    { id: "r7", text: "Ciudad Obregón, Sonora", font: "body", size: 11, color: "#6b6965", uppercase: true, tracking: 0.2, align: "center" },
    { id: "r8", text: "Entrega inmediata en productos disponibles.", font: "body", size: 11, color: "#9a9893", align: "center", deliveryOnly: true },
  ],
};

const FONT_MAP = {
  heading: "var(--font-heading)",
  body: "var(--font-body)",
  display: "var(--font-display)",
};

// Bloque de contacto editable por el admin (Setting "contact_block").
// Se usa arriba (bajo la portada) y al final del catálogo; al persistirse,
// cualquier cambio se refleja en ambas ubicaciones automáticamente.
export default function ContactSection({ variant = "bottom", delivery = false }) {
  const top = variant === "top";
  const { contactBlock, setContactBlock, packagingWidget, setPackagingWidget } = useMarea();
  const isAdmin = useIsAdmin();
  const [editorOpen, setEditorOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const block = { ...DEFAULT_CONTACT_BLOCK, ...(contactBlock || {}) };
  const rows = (block.rows || []).filter((r) => !r.deliveryOnly || top || delivery);

  const linkUrl = (row) => {
    if (row.link === "instagram") return block.instagramUrl || INSTAGRAM_URL;
    if (row.link === "whatsapp") return block.whatsappUrl || WHATSAPP_URL;
    if (row.link === "empaque") return "/empaque";
    if (row.link === "custom") return row.url || "#";
    return "#";
  };

  const renderRow = (row) => {
    const style = {
      fontFamily: FONT_MAP[row.font] || FONT_MAP.body,
      fontSize: `${row.size || 14}px`,
      color: row.color || "#1a1a1c",
      fontWeight: row.bold ? 600 : 400,
      textTransform: row.uppercase ? "uppercase" : "none",
      letterSpacing: row.tracking ? `${row.tracking}em` : undefined,
    };
    const isLink = row.isLink && row.link && row.link !== "none";
    const url = linkUrl(row);

    if (row.isButton) {
      const btnStyle = {
        ...style,
        background: row.bg || undefined,
        border: row.hasBorder ? `${row.borderWidth || 1}px solid ${row.borderColor || "#e7e5e9"}` : "none",
        borderRadius: `${row.borderRadius || 0}px`,
        padding: `${row.paddingY || 10}px ${row.paddingX || 20}px`,
        width: row.width ? `${row.width}px` : undefined,
        textDecoration: row.underline ? "underline" : "none",
      };
      const inner = isLink ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center transition-opacity active:opacity-80" style={btnStyle}>
          {row.text}
        </a>
      ) : (
        <span className="inline-flex items-center justify-center" style={btnStyle}>{row.text}</span>
      );
      return <div key={row.id} style={{ textAlign: row.align || "center", width: "100%" }}>{inner}</div>;
    }

    if (isLink) {
      return (
        <div key={row.id} style={{ textAlign: row.align || "center", width: "100%" }}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...style, textDecoration: row.underline ? "underline" : "none" }} className="inline-block hover:opacity-80">
            {row.text}
          </a>
        </div>
      );
    }

    return <p key={row.id} style={{ ...style, textAlign: row.align || "center" }}>{row.text}</p>;
  };

  const pw = { text: "Ver Tipos de Empaque", textColor: "#FFFFFF", bgColor: "#DB949B", position: "left", corners: "rounded", ...(packagingWidget || {}) };
  const radius = pw.corners === "square" ? "rounded-none" : "rounded-md";
  const justify = pw.position === "center" ? "center" : pw.position === "right" ? "flex-end" : "flex-start";

  return (
    <section
      className={`px-6 text-center ${
        top ? "pb-1 pt-10" : "border-t border-border/60 bg-secondary/40 py-14"
      }`}
    >
      {isAdmin && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            aria-label="Editar bloque de contacto"
            title="Editar bloque de contacto"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-slate transition-colors hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col items-center" style={{ gap: `${block.gap || 8}px` }}>
        {rows.map(renderRow)}
      </div>

      {top && (
        <div className="mt-9 flex items-center gap-2" style={{ justifyContent: justify }}>
          <Link
            to="/empaque"
            style={{ background: pw.bgColor, color: pw.textColor }}
            className={`inline-flex items-center px-5 py-2.5 text-[12px] uppercase tracking-[0.18em] shadow-sm transition-transform hover:scale-[1.02] active:scale-95 ${radius}`}
          >
            {pw.text || "Ver Tipos de Empaque"}
          </Link>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setPwOpen(true)}
              aria-label="Editar widget de empaques"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-slate transition-colors hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {editorOpen && (
        <ContactBlockEditor
          current={contactBlock}
          onSave={setContactBlock}
          onClose={() => setEditorOpen(false)}
        />
      )}
      {pwOpen && (
        <PackagingWidgetEditor
          current={packagingWidget}
          onSave={setPackagingWidget}
          onClose={() => setPwOpen(false)}
        />
      )}
    </section>
  );
}