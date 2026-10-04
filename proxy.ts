import { NextResponse, type NextRequest } from "next/server";

// ============================================================================
// proxy.ts
// ----------------------------------------------------------------------------
// Zasebne strani pod /h/… (npr. 3D model hiše) so zaščitene z geslom (HTTP
// Basic Auth). Geslo je v okolju (HISA_GESLO) in ne v kodi. Če ga ni, je
// dostop zaprt za vse — raje zaprto kot odprto.
// ============================================================================

const zavrni = () =>
  new NextResponse("Zaščiteno.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Zasebno", charset="UTF-8"',
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "no-store",
    },
  });

export function proxy(req: NextRequest) {
  const geslo = process.env.HISA_GESLO;
  const auth = req.headers.get("authorization");
  if (!geslo || !auth?.startsWith("Basic ")) return zavrni();
  let dekodirano = "";
  try {
    dekodirano = atob(auth.slice(6));
  } catch {
    return zavrni();
  }
  const vnos = dekodirano.slice(dekodirano.indexOf(":") + 1);
  if (vnos !== geslo) return zavrni();
  const odgovor = NextResponse.next();
  odgovor.headers.set("Cache-Control", "private, no-store");
  return odgovor;
}

export const config = { matcher: ["/h/:path*"] };
