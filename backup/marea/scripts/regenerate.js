#!/usr/bin/env node
/**
 * regenerate.js — Re-descarga las imágenes del respaldo de Marea.
 *
 * Lee backup/marea/manifest.json y, para cada imagen, la descarga desde su
 * URL original y la guarda en su local_path dentro de backup/marea/images/.
 *
 * Uso:
 *   node backup/marea/scripts/regenerate.js           # descarga todo
 *   node backup/marea/scripts/regenerate.js --verify    # solo verifica que existan
 *
 * Requiere Node 18+ (usa fetch global). Sin dependencias externas.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "manifest.json");

if (!fs.existsSync(MANIFEST)) {
  console.error("No se encontró manifest.json en " + MANIFEST);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const entries = [];
for (const p of manifest.products || []) for (const im of p.images || []) entries.push(im);
for (const p of manifest.packagings || []) for (const im of p.images || []) entries.push(im);

const verifyOnly = process.argv.includes("--verify");

async function download(url, dest) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) throw new Error("archivo demasiado pequeño (" + buf.length + " bytes)");
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      return { ok: true, bytes: buf.length };
    } catch (e) {
      lastErr = e.message;
    }
  }
  return { ok: false, err: lastErr };
}

(async () => {
  console.log((verifyOnly ? "Verificando" : "Descargando") + " " + entries.length + " imágenes...");
  let ok = 0, failed = 0, missing = 0;
  const errors = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const dest = path.join(ROOT, e.local_path);
    if (verifyOnly) {
      if (!fs.existsSync(dest)) { missing++; errors.push({ path: e.local_path, err: "no existe" }); }
      else ok++;
      continue;
    }
    const r = await download(e.url, dest);
    if (r.ok) ok++;
    else { failed++; errors.push({ path: e.local_path, err: r.err }); }
    if ((i + 1) % 20 === 0) console.log("  " + (i + 1) + "/" + entries.length);
  }
  console.log("");
  console.log("OK: " + ok + (verifyOnly ? " (presentes)" : " (descargadas)"));
  if (verifyOnly && missing) console.log("Faltantes: " + missing);
  if (failed) console.log("Fallidas: " + failed);
  if (errors.length) {
    console.log("\nDetalles (primeros 10):");
    for (const er of errors.slice(0, 10)) console.log("  " + er.path + " -> " + er.err);
    process.exit(1);
  }
})();
