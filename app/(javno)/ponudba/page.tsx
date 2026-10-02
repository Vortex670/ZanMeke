import type { Metadata } from "next";
import Link from "next/link";

import { CENE, KORAKI, STRAN } from "@/lib/podatki";

// ============================================================================
// /ponudba — kaj dobiš in koliko stane
// ----------------------------------------------------------------------------
// Stran je zgrajena okrog ene odločitve: ali se splača. Zato cena ni na dnu,
// ampak takoj za tem, ko človek izve, kaj dobi — in zraven piše, kaj NI
// vključeno. Nepovedana izključitev je edina stvar, ki pokvari posel po
// podpisu.
//
// Vprašanja na dnu so prava vprašanja z obiskov, ne izmišljena. Vsako od njih
// je nekdo že postavil in vsako je imelo moč ustaviti odločitev.
// ============================================================================

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Ponudba in cene",
  description:
    "Spletna stran za gostilno ali apartma: jedilnik, dnevne malice, spletno naročanje in evidenca ur. Cene od 1.990 €, vzdrževanje 49 € na mesec.",
  alternates: { canonical: "/ponudba" },
};

const VKLJUCENO = [
  "Stran po meri — ne predloga, ki jo ima še deset drugih",
  "Vsebina, ki jo urejaš sam: jedilnik, malice, novice",
  "Prilagojena telefonu, ker tam jo gost odpre",
  "Gostovanje, domena in varnostno kopiranje",
  "Vpis v Google in zemljevid",
  "Pomoč po telefonu, brez vstopnice za podporo",
];

const NI_VKLJUCENO = [
  "Oglaševanje na družbenih omrežjih (lahko uredim posebej)",
  "Pisanje vseh besedil namesto tebe — pomagam, a hiše ne poznam bolje od tebe",
  "Blagajna in fiskalizacija (stran se nanju poveže, ne zamenja ju)",
];

const VPRASANJA: Array<{ q: string; a: string }> = [
  {
    q: "Koliko časa traja?",
    a: "Teden dni od dogovora do žive strani, če so fotografije in jedilnik pripravljeni. Fotografiram v istem tednu.",
  },
  {
    q: "Kaj če ne znam urejati?",
    a: "Malico vpišeš v dveh minutah — to ti pokažem na mestu. Če ti je lažje, mi jo pošlješ in jo vpišem jaz; to je del vzdrževanja.",
  },
  {
    q: "Moram podpisati dolgo pogodbo?",
    a: "Ne. Vzdrževanje odpoveš kadarkoli, stran in domena ostaneta tvoji. Nimam vezave na leto.",
  },
  {
    q: "Že imam stran, ki je ne maram.",
    a: "Potem jo pogledam in ti povem, ali se jo splača popraviti ali narediti na novo. Če se splača popraviti, to tudi rečem.",
  },
  {
    q: "Kdaj plačam?",
    a: "Polovica ob začetku, polovica ob zagonu. Vzdrževanje teče od zagona naprej, mesečno.",
  },
];

export default function Ponudba() {
  return (
    <>
      <section className="bg-obrat text-na-obratu">
        <div className="px-s2 uvod-y mx-auto max-w-5xl">
          <p className="type-label text-poudarek">Ponudba</p>
          <h1 className="type-h1 mt-s2 max-w-[20ch]">
            Stran, ki pozna vaš jedilnik in vaš delovni čas.
          </h1>
          <p className="type-lead text-na-obratu/65 mt-s3 mera">
            Za gostilne, picerije, apartmaje in manjša podjetja. Vse, kar je spodaj, danes
            dela pri gostilnici Plus v Sevnici — ne gre za obljubo, ampak za stran, ki jo
            lahko odprete.
          </p>
        </div>
      </section>

      <div className="px-s2 mx-auto max-w-5xl">
        {/* ── Cene ─────────────────────────────────────────────────────── */}
        <section className="odsek-y">
          <p className="type-label text-poudarek">Cene</p>
          <h2 className="type-h2 mt-s1">Cena je znana pred delom.</h2>

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
            Polovica ob začetku, polovica ob zagonu. Vzdrževanje odpoveste kadarkoli;
            stran in domena ostaneta vaši.
          </p>
        </section>

        {/* ── Kaj je in kaj ni vključeno ───────────────────────────────── */}
        <section className="border-crta odsek-y border-t">
          <div className="gap-s4 grid sm:grid-cols-2">
            <div>
              <p className="type-label text-poudarek">Vključeno</p>
              <ul className="mt-s2 gap-s1 grid">
                {VKLJUCENO.map((v) => (
                  <li key={v} className="type-body gap-s1 grid grid-cols-[1rem_1fr]">
                    <span aria-hidden className="text-poudarek">
                      ·
                    </span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="type-label text-bledo">Ni vključeno</p>
              <ul className="mt-s2 gap-s1 grid">
                {NI_VKLJUCENO.map((v) => (
                  <li
                    key={v}
                    className="type-body text-mirno gap-s1 grid grid-cols-[1rem_1fr]"
                  >
                    <span aria-hidden className="text-bledo">
                      ·
                    </span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
              <p className="type-micro text-bledo mt-s2">
                Kar ni našteto, povem na pogovoru — izključitev, ki se pokaže po podpisu,
                je edina stvar, ki pokvari posel.
              </p>
            </div>
          </div>
        </section>

        {/* ── Kako poteka ──────────────────────────────────────────────── */}
        <section className="border-crta odsek-y border-t">
          <p className="type-label text-poudarek">Kako poteka</p>
          <h2 className="type-h2 mt-s1">Štirje koraki, en teden.</h2>

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

        {/* ── Vprašanja ────────────────────────────────────────────────── */}
        <section className="border-crta odsek-y border-t">
          <p className="type-label text-poudarek">Vprašanja</p>
          <h2 className="type-h2 mt-s1">Kar me vprašajo najprej.</h2>

          <dl className="mt-s3 border-crta border-t">
            {VPRASANJA.map((v) => (
              <div key={v.q} className="border-crta-mehka py-s3 border-b">
                <dt className="type-h3">{v.q}</dt>
                <dd className="type-body text-mirno mt-s1 mera">{v.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Stik ─────────────────────────────────────────────────────── */}
        <section className="odsek-y">
          <div className="border-crta bg-ploskev p-s4 border">
            <h2 className="type-h2">Pokličite in povem ceno za vašo hišo.</h2>
            <p className="type-body text-mirno mt-s2 mera">
              Pol ure pogovora pri vas, brez obveznosti. Po njem veste ceno, rok in kaj
              morate pripraviti.
            </p>
            <div className="mt-s3 gap-s1 flex flex-wrap items-center">
              <a
                href={`tel:${STRAN.telefonKlic}`}
                className="type-label bg-poudarek text-na-obratu px-s3 rounded-full py-3"
              >
                <span className="stevilke">{STRAN.telefon}</span>
              </a>
              <Link
                href="/kontakt"
                className="type-label border-crta px-s3 rounded-full border py-3"
              >
                Pišite
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
