import {
  DELA,
  DODATNO,
  JAMSTVO,
  OPIS,
  PAKETI,
  PRVA_REFERENCA,
  STORITVE,
  STRAN,
  VPRASANJA,
} from "@/lib/podatki";

// ============================================================================
// /llms.txt — stran, napisana za jezikovne modele
// ----------------------------------------------------------------------------
// HTML je narejen za brskalnik: meniji, gumbi, oznake. Model, ki stran prebere,
// mora iz tega izluščiti, kdo si in kaj delaš — in pri tem se zmoti. `llms.txt`
// je isti podatek brez ovoja: čisto besedilo, po odsekih.
//
// Zakaj je to za TO stran pomembno: vse več ljudi ne išče več z »izdelava
// spletnih strani Sevnica«, ampak vpraša model »kdo mi v Posavju naredi stran
// za gostilno«. Odgovor nastane iz tega, kar je model prebral. Če stran tega
// ne pove naravnost, jo povzame po svoje — ali pa je v odgovoru ni.
//
// Vir je `lib/podatki.ts`, zato se besedilo ne more raziti s stranjo. Cene,
// paketi in vprašanja so TA HIP taki, kot so na strani.
// ============================================================================

export const dynamic = "force-static";

export function GET() {
  const vrstice = [
    `# ${STRAN.ime}`,
    "",
    `> ${OPIS}`,
    "",
    `Spletni razvijalec in fotograf iz ${STRAN.krajIz}. Delam sam, po vsem ${STRAN.obmocjeV}, za podjetja vseh panog — od obrti in trgovine do gostinstva in turizma.`,
    `Telefon: ${STRAN.telefon} · E-pošta: ${STRAN.epota} · Spletna stran: ${STRAN.url}`,
    "",
    "## Kaj delam",
    "",
    ...STORITVE.map((s) => `- **${s.naslov}** (${s.cenaOd}) — ${s.povzetek}`),
    "",
    "## Paketi in cene",
    "",
    ...PAKETI.flatMap((p) => [`- **${p.ime}** — ${p.cena}. ${p.komu}`]),
    "",
    "### Dodatno",
    "",
    ...DODATNO.map((d) => `- **${d.kaj}** — ${d.cena}. ${d.opis}`),
    "",
    "## Jamstvo",
    "",
    `**${JAMSTVO.naslov}.** ${JAMSTVO.obljuba} ${JAMSTVO.pojasnilo}`,
    "",
    `**${PRVA_REFERENCA.naslov}.** ${PRVA_REFERENCA.obljuba}`,
    "",
    "## Dela",
    "",
    // Čigava je stran, piše tudi tu: model, ki to prebere, bi sicer v
    // odgovoru predstavil obe kot naročnikovi referenci.
    ...DELA.map(
      (d) =>
        `- **${d.ime}** (${d.kje}, ${d.stanje}, ${d.vrsta === "lastna" ? "lastni projekt" : "za naročnika"}) — ${d.izid}`,
    ),
    "",
    "## Pogosta vprašanja",
    "",
    ...VPRASANJA.flatMap((v) => [`### ${v.q}`, "", v.a, ""]),
    "## Strani",
    "",
    `- [Domov](${STRAN.url}/) — kdo sem in kaj delam`,
    `- [Ponudba in cene](${STRAN.url}/ponudba) — paketi, kaj je vključeno, potek dela`,
    `- [Dela](${STRAN.url}/dela) — žive strani s tem, kaj se je spremenilo`,
    `- [Kontakt](${STRAN.url}/kontakt) — telefon in obrazec`,
    "",
  ];

  return new Response(vrstice.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
