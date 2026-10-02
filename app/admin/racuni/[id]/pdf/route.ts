import { renderToBuffer } from "@react-pdf/renderer";

import { zahtevajPrijavo } from "@/lib/auth/straza";
import { getNastavitve, manjkaZaRacun } from "@/lib/nastavitve/queries";
import { RacunPdf } from "@/lib/racuni/pdf";
import { upnKoda } from "@/lib/racuni/qr";
import { getRacun } from "@/lib/racuni/queries";

// ============================================================================
// GET /admin/racuni/[id]/pdf — listina kot PDF
// ----------------------------------------------------------------------------
// `route.ts` in ne strežniško dejanje: odgovor ni HTML, ampak datoteka, in
// brskalnik jo mora dobiti kot tako — v zavihku za predogled ali v prenosu.
//
// IZRIS JE NA STREŽNIKU. Pisave so vložene iz `public/pisave`, ker klic na
// Google ob izrisu ni zagotovljen; PDF brez pisave se izriše v Helvetici in
// brez šumnikov.
//
// Brez podatkov izdajatelja se listina NE izdela. Račun brez davčne številke
// ni veljaven dokument, in bolje je sporočilo, ki pove, česa manjka, kot
// lep PDF, ki ga računovodkinja zavrne.
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _zahteva: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await zahtevajPrijavo();

  const { id } = await params;
  const [racun, nastavitve] = await Promise.all([getRacun(id), getNastavitve()]);

  if (!racun) {
    return new Response("Tega računa ni.", { status: 404 });
  }

  const manjka = manjkaZaRacun(nastavitve);
  if (manjka.length > 0) {
    return new Response(
      `Listine ni mogoče izdelati — v nastavitvah manjka: ${manjka.join(", ")}.`,
      { status: 409, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  // UPN koda za nakazilo. `null` ni napaka — brez IBAN-a je koda brez pomena
  // in dokument jo preprosto izpusti.
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
      // `inline` in ne `attachment`: predogled se odpre v zavihku, prenos pa
      // je še vedno en klik stran. Obratno bi pomenilo, da vsak pogled
      // pristane v mapi Prenosi.
      "Content-Disposition": `inline; filename="${ime}"`,
      "Cache-Control": "no-store",
    },
  });
}
