import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/JsonLd";
import { KarticaPaketa } from "@/components/public/KarticaPaketa";
import { Jamstvo } from "@/components/public/Jamstvo";
import { Odsek, UvodOdseka } from "@/components/public/Odsek";
import { BatchReveal } from "@/components/motion/BatchReveal";
import { Stik } from "@/components/public/Stik";
import { getVidniBloki } from "@/lib/domov/queries";
import { Zlozljivo } from "@/components/ui/Zlozljivo";
import { DODATNO, KORAKI, PAKETI, VPRASANJA } from "@/lib/podatki";
import { drobtineLd, vprasanjaLd } from "@/lib/seo/jsonLd";

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

// Vsebina je v bazi in se osveži ob shranjevanju odseka.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ponudba in cene",
  description:
    "Cene za izdelavo spletne strani: od 1.190 €, vzdrževanje 49 € na mesec. Trije paketi — stran, sistem za vsakdanje delo in sistem z evidenco dela.",
  alternates: { canonical: "/ponudba" },
};

const VKLJUCENO = [
  "Stran po meri — ne predloga, ki jo ima še deset drugih",
  "Vsebina, ki jo urejaš sam: ponudba, cene, novice",
  "Prilagojena telefonu, ker tam jo stranka odpre",
  "Gostovanje, domena in varnostno kopiranje",
  "Vpis v Google in zemljevid",
  "Pomoč po telefonu, brez vstopnice za podporo",
];

const NI_VKLJUCENO = [
  "Oglaševanje na družbenih omrežjih (lahko uredim posebej)",
  "Pisanje vseh besedil namesto tebe — pomagam, a tvojega posla ne poznam bolje od tebe",
  "Blagajna in fiskalizacija (stran se nanju poveže, ne zamenja ju)",
];

export default async function Ponudba() {
  const vidni = await getVidniBloki("ponudba");
  const vsebina = new Map(vidni.map((x) => [x.def.kljuc, x.data]));
  const b = (kljuc: string) => vsebina.get(kljuc) ?? {};
  const viden = (kljuc: string) => vsebina.has(kljuc);
  const uvod = b("uvod");
  const cene = b("cene");
  const vkljuceno = b("vkljuceno");
  const koraki = b("koraki");
  const vprasanja = b("vprasanja");
  const stik = b("stik");

  return (
    <>
      <Odsek plast="temna" sirina="sirok" visina={false} as="section" sij>
        <div className="uvod-y">
          <p className="type-poglavje text-poudarek">{uvod.oznaka || "Ponudba"}</p>
          <h1 className="type-display mt-s3 max-w-[16ch]">
            {uvod.naslov || "Kaj dobite in koliko stane."}
          </h1>
          <p className="type-lead text-mirno mt-s3 mera">
            {uvod.uvod ||
              "Trije paketi. Prvi je stran, druga dva ji dodata, kar mora vsak dan delati namesto vas. Vse spodaj danes teče v dveh podjetjih, ki ju vodim sam."}
          </p>
        </div>
      </Odsek>

      {/* ISTA PLAST RAZKRITIJ kot na domači strani: odseki vstopijo,
          ko prideš do njih, vsak po enkrat in vsi po istem pragu. Brez tega
          se je domača stran premikala, ostale tri pa so stale. */}
      <BatchReveal izbirnik="section">
        {/* ── Cene ─────────────────────────────────────────────────────── */}
        <Odsek plast="mehka" sirina="sirok" as="section">
          <UvodOdseka
            stevilka="01"
            oznaka="Cene"
            naslov={cene.naslov || "Cena je znana pred delom."}
            uvod="Polovica ob začetku, polovica ob zagonu. Vzdrževanje odpoveste kadarkoli; stran in domena ostaneta vaši."
          />

          <div className="mt-s4 gap-s2 grid sm:grid-cols-2 lg:grid-cols-3">
            {PAKETI.map((p) => (
              <KarticaPaketa key={p.kljuc} paket={p} />
            ))}
          </div>

          {/* Dodatki stojijo LOČENO od paketov. V stolpcu paketov bi mesečno
              vzdrževanje izgledalo kot četrti paket in bi zmedlo primerjavo. */}
          <dl className="mt-s2 gap-s2 grid sm:grid-cols-2">
            {DODATNO.map((d) => (
              <div
                key={d.kaj}
                className="bg-ploskev p-s3 rounded-2xl shadow-(--shadow-card)"
              >
                <dt className="gap-s2 flex items-baseline justify-between">
                  <span className="type-h3">{d.kaj}</span>
                  <span className="type-body font-naslov stevilke text-poudarek whitespace-nowrap">
                    {d.cena}
                  </span>
                </dt>
                <dd className="type-small text-mirno mt-s1">{d.opis}</dd>
              </div>
            ))}
          </dl>
        </Odsek>

        {/* ── Kaj je in kaj ni vključeno ───────────────────────────────── */}
        {/* Skrit odsek v `getVidniBloki` sploh ne pride — gumb »skrij« v
            adminu mora kaj storiti, sicer javi uspeh in stran ostane ista. */}
        {viden("vkljuceno") ? (
          <Odsek plast="svetla" sirina="sirok" as="section">
            <UvodOdseka
              stevilka="02"
              oznaka="Obseg"
              naslov="Kaj je v ceni in kaj ni."
              uvod="Oboje je napisano prej. Izključitev, ki se pokaže po podpisu, je edina stvar, ki pokvari posel."
            />

            <div className="mt-s4 gap-s4 grid sm:grid-cols-2">
              <div>
                <p className="type-label text-poudarek">
                  {vkljuceno.naslov || "Vključeno"}
                </p>
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
                  Kar ni našteto, povem na pogovoru.
                </p>
              </div>
            </div>
          </Odsek>
        ) : null}

        <Jamstvo />

        {/* ── Kako poteka ──────────────────────────────────────────────── */}
        {viden("koraki") ? (
          <Odsek plast="mehka" sirina="sirok" as="section">
            <UvodOdseka
              stevilka="03"
              oznaka="Kako poteka"
              naslov={koraki.naslov || "Štirje koraki, en teden."}
            />

            <ol className="mt-s4 gap-s3 grid sm:grid-cols-2">
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
          </Odsek>
        ) : null}

        {/* ── Vprašanja ────────────────────────────────────────────────── */}
        {viden("vprasanja") ? (
          <Odsek plast="svetla" sirina="ozek" as="section">
            <UvodOdseka
              stevilka="04"
              oznaka="Vprašanja"
              naslov={vprasanja.naslov || "Kar me vprašajo najprej."}
            />

            {/* Odgovori so v HTML-u tudi, ko so zaprti — glej `Zlozljivo`. Isti
              odgovori gredo še v `FAQPage` spodaj, da jih lahko navede
              iskalnik ali jezikovni model, ne da bi človek prišel do sem. */}
            <div className="mt-s4">
              {VPRASANJA.map((v, i) => (
                <Zlozljivo key={v.q} vprasanje={v.q} privzetoOdprto={i === 0}>
                  {v.a}
                </Zlozljivo>
              ))}
            </div>
          </Odsek>
        ) : null}

        <Stik
          naslov={stik.naslov || "Pokličite in povem ceno za vaš primer."}
          uvod={
            stik.uvod ||
            "Pol ure pri vas, brez obveznosti. Pogledam, kaj že imate in kaj vam jemlje čas — po pogovoru veste ceno, rok in kaj morate pripraviti."
          }
          druga={{ href: "/kontakt", besedilo: "Ali pišite" }}
        />
      </BatchReveal>

      <JsonLd podatki={vprasanjaLd(VPRASANJA)} />
      <JsonLd
        podatki={drobtineLd([
          { ime: "Domov", pot: "/" },
          { ime: "Ponudba", pot: "/ponudba" },
        ])}
      />
    </>
  );
}
