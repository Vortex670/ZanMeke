import "server-only";

/**
 * HTML sanitize plast za rich-text vsebine iz DB.
 *
 * Admin (trusted) generira HTML preko TipTap → shrani v DB. Javna stran
 * (detail apartmaja, email predloge) vzame HTML iz DB in ga mora sanitize-ati,
 * preden ga pošlje v DOM (protirazinski XSS).
 *
 * Zakaj `sanitize-html` in NE `isomorphic-dompurify`:
 *   - DOMPurify potrebuje pravi DOM, zato `isomorphic-dompurify` v Node
 *     potegne `jsdom`. Ta na Vercelu pade: `html-encoding-sniffer` (CJS)
 *     `require()`-a `@exodus/bytes`, ki je čisti ESM → `ERR_REQUIRE_ESM`.
 *     Dokler so bile strani statične, se je to zgodilo med gradnjo in ni
 *     bilo opazno; prva dinamična stran, ki sanitizira HTML, je vrnila 500.
 *   - `sanitize-html` je čisti JS nad `htmlparser2` — brez DOM-a, brez
 *     jsdom-a, hitrejši hladen zagon in ena odvisnost manj, ki lahko pade.
 *   - Model je isti: allowlist tagov in atributov, ne blacklist.
 *
 * ALLOWLIST pristop (ne blacklist):
 *   - Dovolimo samo tage, ki jih TipTap editor generira.
 *   - Brez `<iframe>`, `<script>`, `<style>`, `<form>`, `<input>` itd.
 *   - Link-i dovoljeni ampak samo `http(s):` protokoli; `javascript:` URL-ji
 *     in data: URL-ji zavrnjeni.
 *
 * Uporaba:
 *   ```ts
 *   import { sanitizeHtml } from "@/lib/rich-text/sanitize";
 *
 *   const safe = sanitizeHtml(unit.description.hr);
 *   return <div dangerouslySetInnerHTML={{ __html: safe }} />;
 *   ```
 */

import sanitize from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "s",
  "u",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "hr",
];

/** Atributi, dovoljeni na VSEH dovoljenih tagih. */
const ALLOWED_ATTR = ["class"];

/**
 * Sanitizira HTML string iz rich-text polja pred render-om.
 * - Dovoli samo tage, ki jih generira TipTap urejevalnik.
 * - Na povezavah dovoli samo `http(s)`, `mailto` in `tel`; vse drugo
 *   (`javascript:`, `data:`) odpade skupaj z atributom.
 * - `target="_blank"` vedno dobi `rel="noopener noreferrer"`.
 * - Vsi `on*` atributi in `style` odpadejo, ker niso na allowlisti.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== "string" || dirty.length === 0) return "";

  return sanitize(dirty, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: {
      "*": [...ALLOWED_ATTR],
      a: ["href", "target", "rel", ...ALLOWED_ATTR],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    // Relativne povezave (`/apartments`, `#faq`) ostanejo veljavne.
    allowProtocolRelative: false,
    // Vsebina odstranjenih tagov se OHRANI (npr. `<span>` pade, besedilo ostane).
    disallowedTagsMode: "discard",
    transformTags: {
      a: (tagName, attribs) => {
        const next: Record<string, string> = { ...attribs };
        if (next.target === "_blank") next.rel = "noopener noreferrer";
        return { tagName, attribs: next };
      },
    },
  });
}

/**
 * Plain text iz HTML-a — za štetje znakov, SEO opise in besedilno različico
 * e-pošte. Odstrani vse tage, besedilo ohrani.
 */
export function htmlToPlainText(html: string): string {
  if (typeof html !== "string" || html.length === 0) return "";
  // Blokovni tagi so vizualni prelom — brez tega se "Naslov" in "Prvi
  // odstavek" zlepita v "NaslovPrvi odstavek".
  const spaced = html.replace(/<\/(p|h[1-6]|li|blockquote|div|tr)>|<br\s*\/?>/gi, " ");
  return sanitize(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
