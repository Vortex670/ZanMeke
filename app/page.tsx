import Link from "next/link";

import { KarticaDela } from "@/components/public/dela/KarticaDela";
import { CENE, DELA, KORAKI, OPIS, STRAN, TEZAVE } from "@/lib/podatki";

// ============================================================================
// Domača stran
// ----------------------------------------------------------------------------
// Šest odsekov, vsak odgovarja na eno vprašanje — po vrsti, kakor si jih
// kupec zastavlja:
//
//   1 kaj dela ta človek in za koga   → hero
//   2 je to že kdaj naredil           → dela, vsako z IZIDOM in ne s posnetkom
//   3 razume mojo težavo              → štiri stvari, ki jih slišiš pri vsaki
//   4 koliko                          → cene, s priporočeno srednjo stopnjo
//   5 kaj me čaka                     → štirje koraki in rok
//   6 kako ga dobim                   → telefon
//
// HERO JE TEMEN IN ČEZ CELO ŠIRINO, ker se nadaljuje iz glave: prvi zaslon
// mora imeti težo, vse ostalo pa je papir. Poudarek porabimo na enem mestu
// (hero in cena), drugod je stran tiha — sicer poudarek neha biti poudarek.
//
// Pod herojem je PAS DEJSTEV. Tri reči, ki jih človek preveri, preden kogar
// koli pokliče: kdaj odgovorim, od kod sem in ali sem to že delal.
//
// Česar ni: galerije, bloga in prodaje fotografij. Niso slabi — samo na
// nobeno od teh šestih vprašanj ne odgovorijo, in stran ima eno nalogo.
// ============================================================================

export const revalidate = 3600;

const DEJSTVA = [
  { oznaka: "Odziv", vrednost: "Isti dan", pod: "pokličem nazaj" },
  { oznaka: "Kje", vrednost: STRAN.kraj, pod: `po vsem ${STRAN.obmocje}u` },
  {
    oznaka: "V živo",
    vrednost: `${DELA.filter((d) => d.stanje === "živo").length} strani`,
    pod: "gostinstvo in turizem",
  },
];

/** Naslov odseka — oznaka, naslov in uvod vedno v istem razmerju. */
function Glava({
  oznaka,
  naslov,
  uvod,
}: {
  oznaka: string;
  naslov: string;
  uvod?: string;
}) {
  return (
    <div className="mera">
      <p className="type-label text-poudarek">{oznaka}</p>
      <h2 className="type-h2 mt-s1">{naslov}</h2>
      {uvod ? <p className="type-body text-mirno mt-s2">{uvod}</p> : null}
    </div>
  );
}

export default function Domov() {
  return (
    <>
      {/* ── 1 · Hero — nadaljuje temno glavo ───────────────────────────── */}
      <section className="bg-obrat text-na-obratu">
        <div className="px-s2 pt-s5 pb-s4 mx-auto max-w-5xl">
          <p className="type-label text-poudarek">
            {STRAN.kraj} · {STRAN.obmocje}
          </p>
          <h1 className="type-h1 mt-s2 max-w-[19ch]">
            Spletne strani, ki opravijo delo, ki ga zdaj opravlja telefon.
          </h1>
          <p className="type-lead text-na-obratu/65 mt-s3 mera">{OPIS}</p>

          <div className="mt-s4 gap-s1 flex flex-wrap items-center">
            <Link
              href="/ponudba"
              className="type-label bg-poudarek text-na-obratu px-s3 rounded-full py-3"
            >
              Poglej ponudbo
            </Link>
            <a
              href={`tel:${STRAN.telefonKlic}`}
              className="type-label border-na-obratu/25 text-na-obratu hover:bg-na-obratu/10 px-s3 rounded-full border py-3 transition-colors"
            >
              Pokliči <span className="stevilke">{STRAN.telefon}</span>
            </a>
          </div>
        </div>

        {/* Pas dejstev — tri reči, ki jih človek preveri pred klicem. */}
        <div className="border-na-obratu/10 border-t">
          <dl className="divide-na-obratu/10 px-s2 mx-auto grid max-w-5xl sm:grid-cols-3 sm:divide-x">
            {DEJSTVA.map((d) => (
              <div key={d.oznaka} className="py-s3 sm:px-s3 sm:first:pl-0 sm:last:pr-0">
                <dt className="type-label text-na-obratu/40">{d.oznaka}</dt>
                <dd className="type-h3 mt-s1">{d.vrednost}</dd>
                <dd className="type-micro text-na-obratu/50">{d.pod}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="px-s2 mx-auto max-w-5xl">
        {/* ── 2 · Dela ─────────────────────────────────────────────────── */}
        <section className="odsek-y">
          <Glava
            oznaka="Dela"
            naslov="Kar že teče."
            uvod="Strani, ki danes delajo. Pri vsaki piše, kaj lastniku vsak dan prihrani — ne, kako izgleda."
          />

          <div className="mt-s3 gap-s2 grid sm:grid-cols-2">
            {DELA.map((d) => (
              <KarticaDela key={d.ime} delo={d} />
            ))}
          </div>
        </section>

        {/* ── 3 · Kaj rešim ────────────────────────────────────────────── */}
        <section className="odsek-y">
          <Glava
            oznaka="Kaj rešim"
            naslov="Štiri stvari, ki jih slišim pri vsaki gostilni."
          />

          <div className="mt-s3 bg-crta-mehka border-crta-mehka grid gap-px border sm:grid-cols-2">
            {TEZAVE.map((t) => (
              <div key={t.vprasanje} className="bg-ploskev p-s3">
                <p className="type-h3">{t.vprasanje}</p>
                <p className="type-body text-mirno mt-s1">{t.odgovor}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4 · Cene ─────────────────────────────────────────────────── */}
        <section className="border-crta odsek-y border-t">
          <Glava
            oznaka="Cene"
            naslov="Cena je znana vnaprej."
            uvod="Povem jo pred delom, ne po njem. Polovica ob začetku, polovica ob zagonu."
          />

          <table className="mt-s3 w-full border-collapse">
            <tbody>
              {CENE.map((p) => (
                <tr key={p.kaj} className="border-crta-mehka border-b">
                  <td
                    className={`type-body py-s2 ${p.priporoceno ? "bg-poudarek-mehko px-s2" : ""}`}
                  >
                    {p.kaj}
                    {p.opomba ? (
                      <span className="type-label text-poudarek ml-s1">{p.opomba}</span>
                    ) : null}
                  </td>
                  <td
                    className={`type-body font-naslov stevilke py-s2 text-right font-bold whitespace-nowrap ${
                      p.priporoceno ? "bg-poudarek-mehko text-poudarek px-s2" : ""
                    }`}
                  >
                    {p.cena}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="type-body text-mirno mt-s3 mera">
            Agencija bi tak sistem zaračunala osem tisoč in delala tri mesece. Pri meni je
            osnova že narejena — zato je ceneje in zato je v enem tednu.
          </p>
        </section>

        {/* ── 5 · Kako poteka ──────────────────────────────────────────── */}
        <section className="odsek-y">
          <Glava oznaka="Kako poteka" naslov="Od pogovora do žive strani v enem tednu." />

          <ol className="mt-s3 gap-s3 grid sm:grid-cols-2">
            {KORAKI.map((k, i) => (
              <li
                key={k.naslov}
                className="gap-s2 grid grid-cols-[2.5rem_1fr] items-start"
              >
                <span className="type-label text-bledo stevilke pt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="type-h3">{k.naslov}</h3>
                  <p className="type-body text-mirno mt-s1">{k.opis}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 6 · Stik ─────────────────────────────────────────────────── */}
        <section className="odsek-y">
          <div className="border-crta bg-ploskev p-s4 border">
            <p className="type-label text-poudarek">Stik</p>
            <h2 className="type-h2 mt-s1">Pokličite. Odgovorim isti dan.</h2>
            <a
              href={`tel:${STRAN.telefonKlic}`}
              className="type-h1 font-naslov stevilke mt-s2 hover:text-poudarek block transition-colors"
            >
              {STRAN.telefon}
            </a>
            <p className="type-body text-mirno mt-s2">
              <a href={`mailto:${STRAN.epota}`} className="hover:text-crnilo underline">
                {STRAN.epota}
              </a>{" "}
              · {STRAN.kraj}, delam po vsem {STRAN.obmocje}u
            </p>
            <Link href="/kontakt" className="type-label text-poudarek mt-s3 inline-block">
              Ali pišite prek obrazca →
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
