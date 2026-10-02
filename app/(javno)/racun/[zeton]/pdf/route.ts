import { renderToBuffer } from "@react-pdf/renderer";

import { getNastavitve, manjkaZaRacun } from "@/lib/nastavitve/queries";
import { RacunPdf } from "@/lib/racuni/pdf";
import { upnKoda } from "@/lib/racuni/qr";
import { getRacunPoZetonu } from "@/lib/racuni/queries";

// ============================================================================
// GET /racun/[zeton]/pdf — listina za stranko
// ----------------------------------------------------------------------------
// ISTA LISTINA KOT V ADMINU, le vrata so druga: tam straža, tu žeton. Stranka,
// ki plača z nakazilom, listino potrebuje — brez nje plačila nima kam
// knjižiti. Doslej ji jo je bilo treba poslati ročno po e-pošti, kar pomeni,
// da je morala počakati name.
//
// ŽETON JE EDINI KLJUČ. Trideset dva naključnih bajtov; kdor ima povezavo, je
// stranka ali nekdo, ki mu jo je stranka dala. Preklicani račun se ne izda —
// `getRacunPoZetonu` ga ne vrne.
//
// Odgovor se NE PREDPOMNI nikjer po poti: listina nosi ime in znesek.
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _zahteva: Request,
  { params }: { params: Promise<{ zeton: string }> },
) {
  const { zeton } = await params;
  const [racun, nastavitve] = await Promise.all([
    getRacunPoZetonu(zeton),
    getNastavitve(),
  ]);

  if (!racun) return new Response("Te listine ni.", { status: 404 });

  // Osnutek ni izdana listina. Da je stranka povezavo sploh dobila, mora biti
  // račun poslan — osnutek na tej poti je moja napaka v adminu in ne nekaj,
  // kar bi smela videti stranka.
  if (racun.stanje === "OSNUTEK") {
    return new Response("Ta listina še ni izdana.", { status: 404 });
  }

  const manjka = manjkaZaRacun(nastavitve);
  if (manjka.length > 0) {
    return new Response(
      "Listine trenutno ni mogoče izdelati. Pokličite in pošljem jo po e-pošti.",
      { status: 409, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const qr = await upnKoda({
    iban: nastavitve.iban,
    imePrejemnika: nastavitve.izdajateljIme,
    ulica: nastavitve.izdajateljUlica,
    posta: nastavitve.izdajateljPosta,
    znesekCentov: racun.znesekCentov,
    sklic: racun.stevilka,
    namen: `${racun.vrsta === "PREDRACUN" ? "Predracun" : "Racun"} ${racun.stevilka}`,
    rok: racun.zapadlost,
  });

  const pdf = await renderToBuffer(
    RacunPdf({
      qr,
      racun: {
        vrsta: racun.vrsta,
        stevilka: racun.stevilka,
        stranka: racun.stranka,
        podjetje: racun.podjetje,
        epota: racun.epota,
        opis: racun.opis,
        znesekCentov: racun.znesekCentov,
        valuta: racun.valuta,
        createdAt: racun.createdAt,
        zapadlost: racun.zapadlost,
        placanoAt: racun.placanoAt,
      },
      n: nastavitve,
    }),
  );

  const ime = `${racun.vrsta === "PREDRACUN" ? "predracun" : "racun"}-${racun.stevilka}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${ime}"`,
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
