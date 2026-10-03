import type { Metadata } from "next";

import { BatchReveal } from "@/components/motion/BatchReveal";
import { ShieldCheck } from "lucide-react";

import { Odsek } from "@/components/public/Odsek";
import { ObrazecKontakt } from "@/components/public/kontakt/ObrazecKontakt";
import { JsonLd } from "@/components/seo/JsonLd";
import { getVidniBloki } from "@/lib/domov/queries";
import { drobtineLd } from "@/lib/seo/jsonLd";
import { JAMSTVO, STRAN } from "@/lib/podatki";

// ============================================================================
// /kontakt
// ----------------------------------------------------------------------------
// Telefon je prvi in večji od obrazca. Gostilničar med delom ne piše — pokliče
// ali pa ne stori nič. Obrazec je za tiste, ki kličejo neradi, in za zvečer,
// ko je hiša polna.
//
// Troje piše tik ob obrazcu, ker je prav to tisto, kar človeka ustavi: kdaj
// odgovorim, da je pogovor brezplačen in kaj se zgodi potem.
// ============================================================================

// Vsebina je v bazi in se osveži ob shranjevanju odseka.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kontakt",
  description: `Pokličite ${STRAN.telefon} ali pošljite povpraševanje. Odgovorim isti dan. Žan Meke, ${STRAN.kraj} — delam po vsem ${STRAN.obmocjeV}.`,
  alternates: { canonical: "/kontakt" },
};

const ZAGOTOVILA = [
  ["Odgovorim isti dan", "Če ne dvignem, kličem nazaj do večera."],
  ["Pogovor je brezplačen", "Pol ure pri vas, brez obveznosti in brez ponudbe na silo."],
  ["Potem dobite ceno", "Napisano, s rokom. Brez »odvisno« in brez presenečenj."],
];

export default async function Kontakt() {
  const vidni = await getVidniBloki("kontakt");
  const vsebina = new Map(vidni.map((x) => [x.def.kljuc, x.data]));
  const b = (kljuc: string) => vsebina.get(kljuc) ?? {};
  const uvod = b("uvod");
  const obrazec = b("obrazec");

  return (
    <>
      {/* Telefonska številka je NAJVEČJA stvar na strani in ne naslov. Na
          strani, ki se imenuje »Kontakt«, je naslov samo napis nad podatkom;
          podatek je številka, in ta mora biti berljiva z metra. */}
      <Odsek plast="temna" sirina="sirok" visina={false} as="section" sij>
        <div className="uvod-y">
          <p className="type-poglavje text-poudarek">{uvod.oznaka || "Kontakt"}</p>
          <h1 className="type-h2 mt-s3 text-mirno">{uvod.naslov || "Pokličite."}</h1>

          <a
            href={`tel:${STRAN.telefonKlic}`}
            className="type-display stevilke text-crnilo decoration-poudarek mt-s2 block underline-offset-[0.1em] hover:underline"
          >
            {STRAN.telefon}
          </a>

          <p className="type-lead text-mirno mt-s3">
            <a href={`mailto:${STRAN.epota}`} className="hover:text-crnilo underline">
              {STRAN.epota}
            </a>{" "}
            · {STRAN.kraj}, delam po vsem {STRAN.obmocjeV}
          </p>
        </div>
      </Odsek>

      {/* ISTA PLAST RAZKRITIJ kot na ostalih straneh. */}
      <BatchReveal izbirnik="section">
        <Odsek
          plast="mehka"
          sirina="sirok"
          as="section"
          vsebnikClassName="gap-s4 grid lg:grid-cols-[1fr_1.618fr]"
        >
          <div>
            <h2 className="type-h1">{obrazec.naslov || "Ali pišite."}</h2>
            <p className="type-lead text-mirno mt-s2">
              Povejte, kaj vas muči. Odgovorim z oceno, koliko bi to stalo in koliko časa
              vzelo.
            </p>

            <dl className="mt-s3 border-crta border-t">
              {ZAGOTOVILA.map(([naslov, opis]) => (
                <div key={naslov} className="border-crta-mehka py-s2 border-b">
                  <dt className="type-body font-naslov font-semibold">{naslov}</dt>
                  <dd className="type-body text-mirno">{opis}</dd>
                </div>
              ))}
            </dl>

            <div className="border-poudarek bg-poudarek-mehko p-s3 mt-s3 gap-s2 flex rounded-2xl border">
              <ShieldCheck
                className="text-poudarek mt-0.5 size-5 shrink-0"
                strokeWidth={1.6}
                aria-hidden
              />
              <p className="type-small">
                <span className="type-body block font-medium">{JAMSTVO.naslov}</span>
                <span className="text-mirno mt-1 block">{JAMSTVO.obljuba}</span>
              </p>
            </div>
          </div>

          {/* ROB KARTICE JE NA TELEFONU OŽJI. `--s3` je 26 px; skupaj z robom
              strani je to 42 px na vsaki strani, torej 84 od 375 — polja so
              zato merila 291 px namesto 311. Na širšem zaslonu ostane
              prejšnji rob, ker tam prostora ne manjka. */}
          <div className="p-s2 sm:p-s3 bg-ploskev rounded-2xl shadow-(--shadow-card)">
            <ObrazecKontakt />
            {obrazec.zasebnost ? (
              <p className="type-micro text-bledo mt-s2">{obrazec.zasebnost}</p>
            ) : null}
          </div>
        </Odsek>
      </BatchReveal>

      <JsonLd
        podatki={drobtineLd([
          { ime: "Domov", pot: "/" },
          { ime: "Kontakt", pot: "/kontakt" },
        ])}
      />
    </>
  );
}
