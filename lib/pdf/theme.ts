import { Font } from "@react-pdf/renderer";
import { existsSync } from "node:fs";
import { join } from "node:path";

// ============================================================================
// PDF design tokens — en vir za vse dokumente (račun, dobropis, predračun,
// ponudba, DMCA …). second-home.hr kopira to mapo 1:1 in spremeni samo
// `brand` konstante (pisave ostanejo Inter + JetBrains Mono).
// ----------------------------------------------------------------------------
// Enote so pt (1 pt = 1/72"). Razmiki sledijo φ lestvici iz styles/theme.css
// (--s1…--s5 = 0,618 · 1 · 1,618 · 2,618 · 4,236 rem) pri osnovi 8 pt.
// ============================================================================

/** Stran A4 (595 × 842 pt) z robovi; header/footer sta fiksna na vsaki strani. */
export const page = {
  size: "A4" as const,
  /** 17 mm ≈ 48 pt levo/desno. */
  marginX: 48,
  marginTop: 36,
  /** Prostor za fiksno nogo (legal vrstica + številka strani). */
  marginBottom: 58,
  /** Širina vsebine: 595 − 2 × 48. */
  contentWidth: 595 - 2 * 48,
} as const;

/** φ razmiki v pt (osnova 8 pt): 5 · 8 · 13 · 21 · 34. */
export const space = {
  s1: 5,
  s2: 8,
  s3: 13,
  s4: 21,
  s5: 34,
} as const;

/** Tipografska lestvica (pt). Vse velikosti so ≥ 7 pt zaradi berljivosti tiska. */
export const type = {
  h1: 20,
  h2: 14,
  h3: 11,
  body: 9.5,
  small: 8,
  eyebrow: 7,
  mono: 8.5,
  monoLarge: 15,
} as const;

/** Višine vrstic — enake kot v CSS (`--leading-*`). */
export const leading = {
  body: 1.5,
  heading: 1.15,
  tight: 1.3,
} as const;

/**
 * Paleta listine — ista kot svetla tema strani.
 *
 * `ink` ni čista črna in `rule` ni čista siva: to sta črnilo in črta iz
 * `app/globals.css`, le zapisana v HEX, ker PDF ne pozna CSS spremenljivk.
 * Listina in stran morata biti ena stvar; račun je pogosto prvi dokument, ki
 * ga stranka shrani in čez pol leta spet odpre.
 *
 * `accent` je zelena strani in se uporablja PO KAPLJICAH — znesek, tanke
 * črte nad vsotami, oznaka plačila. Pravilo 60/30/10 velja tudi na papirju,
 * na tiskalniku pa še bolj: barvna ploskev čez pol strani stane barvo in se
 * na črno-belem izpisu spremeni v sivo packo.
 */
export const color = {
  ink: "#0f1513",
  muted: "#55605c",
  subtle: "#8b9693",
  rule: "#dfe5e3",
  surface: "#f1f4f3",
  paper: "#ffffff",
  accent: "#0f5d4c",
  accentSoft: "#e2efea",
} as const;

export const font = {
  /** Besedilo dokumenta — ista pisava kot telo strani. */
  sans: "PublicSans",
  /** Številke, sklici, IBAN — ista pisava kot oznake in številke na strani. */
  mono: "Archivo",
  /** Naslovi dokumenta — ista serifna pisava kot naslovi strani. */
  serif: "Newsreader",
  /** Rokopisna pisava za podpis (opcijsko — registrira se le, če datoteka obstaja). */
  script: "Great Vibes",
} as const;

/** Sledenje (letterSpacing) za eyebrow napise. */
export const tracking = {
  eyebrow: 1.4,
  heading: -0.3,
  number: -0.5,
} as const;

/** QR/2D kode: najmanj 30 mm (85 pt) zaradi skeniranja z mobilnimi bankami. */
export const qr = {
  minSize: 85,
  size: 96,
} as const;

// ----------------------------------------------------------------------------
// Registracija pisav — enkrat na proces (guard prek globalThis, ker Next.js v
// dev načinu modul lahko naloži večkrat; podvojena Font.register bi podvojila
// vgrajene pisave v PDF-u).
// ----------------------------------------------------------------------------

const FONTS_DIR = join(process.cwd(), "public/pisave");
const SCRIPT_FONT = join(process.cwd(), "public/fonts/great-vibes.ttf");

type PdfGlobal = typeof globalThis & { __pdfFontsRegistered?: boolean; __pdfScriptFont?: boolean };

/** Ali je rokopisna pisava na voljo (PdfSignature pade nazaj na Inter, če ni). */
export function hasScriptFont(): boolean {
  return Boolean((globalThis as PdfGlobal).__pdfScriptFont);
}

export function registerPdfFonts(): void {
  const g = globalThis as PdfGlobal;
  if (g.__pdfFontsRegistered) return;
  g.__pdfFontsRegistered = true;

  const f = (name: string) => join(FONTS_DIR, name);

  // TTF (ne WOFF/WOFF2) — PDFKit drugih formatov ne podpira. Latin Extended-A → č/š/ž.
  // PISAVE SO ISTE KOT NA STRANI. Račun je pogosto prvi dokument, ki ga
  // stranka shrani in čez pol leta spet odpre; če je v drugi tipografiji,
  // se v spominu ne poveže z nikomer.
  //
  // Nujno TTF (ne WOFF/WOFF2) — PDFKit drugih formatov ne podpira — in s
  // podnaborom latin-ext, sicer v dokumentu ni č, š in ž.
  Font.register({
    family: font.sans,
    fonts: [
      { src: f("PublicSans-Regular.ttf"), fontWeight: 400 },
      { src: f("PublicSans-SemiBold.ttf"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: font.serif,
    fonts: [
      { src: f("Newsreader-Regular.ttf"), fontWeight: 400 },
      { src: f("Newsreader-SemiBold.ttf"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: font.mono,
    fonts: [
      { src: f("Archivo-Medium.ttf"), fontWeight: 500 },
      { src: f("Archivo-Bold.ttf"), fontWeight: 700 },
    ],
  });
  if (existsSync(SCRIPT_FONT)) {
    Font.register({ family: font.script, fonts: [{ src: SCRIPT_FONT }] });
    g.__pdfScriptFont = true;
  }

  // Brez deljenja besed — slovenščina nima vgrajenih pravil, vezaji sredi besed
  // bi bili napačni; besede se lomijo samo na presledkih.
  Font.registerHyphenationCallback((word) => [word]);
}
