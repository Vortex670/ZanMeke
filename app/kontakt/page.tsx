import type { Metadata } from "next";

import { ObrazecKontakt } from "@/components/public/kontakt/ObrazecKontakt";
import { STRAN } from "@/lib/podatki";

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

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kontakt",
  description: `Pokličite ${STRAN.telefon} ali pošljite povpraševanje. Odgovorim isti dan. Žan Meke, ${STRAN.kraj} — delam po vsem ${STRAN.obmocje}u.`,
  alternates: { canonical: "/kontakt" },
};

const ZAGOTOVILA = [
  ["Odgovorim isti dan", "Če ne dvignem, kličem nazaj do večera."],
  ["Pogovor je brezplačen", "Pol ure pri vas, brez obveznosti in brez ponudbe na silo."],
  ["Potem dobite ceno", "Napisano, s rokom. Brez »odvisno« in brez presenečenj."],
];

export default function Kontakt() {
  return (
    <>
      <section className="bg-obrat text-na-obratu">
        <div className="px-s2 pt-s4 pb-s4 mx-auto max-w-5xl">
          <p className="type-label text-poudarek">Kontakt</p>
          <h1 className="type-h1 mt-s2">Pokličite.</h1>
          <a
            href={`tel:${STRAN.telefonKlic}`}
            className="type-h1 font-naslov stevilke text-poudarek mt-s2 block"
          >
            {STRAN.telefon}
          </a>
          <p className="type-body text-na-obratu/65 mt-s2">
            <a href={`mailto:${STRAN.epota}`} className="hover:text-na-obratu underline">
              {STRAN.epota}
            </a>{" "}
            · {STRAN.kraj}, delam po vsem {STRAN.obmocje}u
          </p>
        </div>
      </section>

      <div className="px-s2 mx-auto max-w-5xl">
        <section className="odsek-y gap-s4 grid lg:grid-cols-[1fr_1.618fr]">
          <div>
            <h2 className="type-h2">Ali pišite.</h2>
            <p className="type-body text-mirno mt-s2">
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
          </div>

          <div className="border-crta bg-ploskev p-s3 border">
            <ObrazecKontakt />
          </div>
        </section>
      </div>
    </>
  );
}
