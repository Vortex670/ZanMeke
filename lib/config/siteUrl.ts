// ============================================================================
// SITE_URL — zanesljiv osnovni naslov strani
// ----------------------------------------------------------------------------
// V PRODUKCIJI prezre napačno nastavljen localhost (npr. če je na Vercelu
// NEXT_PUBLIC_SITE_URL pomotoma »http://localhost:3000«). To je ključno za:
//   • povezave v e-pošti (potrditev novičnika, odjava, rezervacija),
//   • canonical, OG in JSON-LD.
// Lokalno localhost OSTANE — tako je prav za razvoj.
//
// Ista datoteka na gostilnica-plus.si; tam se je napaka
// pokazala pri Stripu, ko je kupca po plačilu vrglo na localhost.
// ============================================================================

const PRIVZETI = "https://zanmeke.com";

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const isProd = process.env.NODE_ENV === "production";
  const isLocalhost = Boolean(raw) && /localhost|127\.0\.0\.1/.test(raw ?? "");

  if (raw && !(isProd && isLocalhost)) return isLocalhost ? withDevPort(raw) : raw;
  return PRIVZETI;
}

/**
 * V razvoju popravi vrata na tista, na katerih strežnik res teče — sicer gre
 * povezava iz e-pošte na `localhost:3000`, kjer lahko teče druga stran.
 */
function withDevPort(raw: string): string {
  const port = process.env.PORT?.trim();
  if (!port) return raw;
  try {
    const url = new URL(raw);
    url.port = port;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return raw;
  }
}

export const SITE_URL = resolveSiteUrl();

/** Klicna oblika, kadar se vrednost bere med izvajanjem (npr. v metadata). */
export function siteUrl(): string {
  return SITE_URL;
}

/** Relativna pot → absoluten naslov. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
