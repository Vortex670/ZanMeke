import { ArrowUpRight } from "lucide-react";

import { Odsek, UvodOdseka } from "@/components/public/Odsek";
import type { Priporocilo } from "@/lib/priporocila/queries";

// ============================================================================
// <Priporocila /> — edino besedilo na strani, ki ga nisem napisal sam
// ----------------------------------------------------------------------------
// Vse drugo na strani je moja beseda in obiskovalec to ve. Tu je beseda
// nekoga, ki je plačal — in to je razlika med »izgleda dobro« in
// »pokličimo ga«.
//
// BREZ ZVEZDIC IN BREZ POVPREČIJ. Dve priporočili s povprečjem 5,0 sta videti
// izmišljeni; poved z imenom, hišo in krajem je preverljiva, ker lahko vsak
// pokliče in vpraša.
//
// ODSEKA NI, DOKLER NI PRIPOROČIL. Prazen odsek z napisom »kmalu« je slabši
// od odseka, ki ga ni — pove, da sem si ga zamislil in ga nisem napolnil.
// ============================================================================

export function Priporocila({ seznam }: { seznam: Priporocilo[] }) {
  if (seznam.length === 0) return null;

  const eno = seznam.length === 1;

  return (
    <Odsek plast="mehka" sirina="sirok" as="section">
      <UvodOdseka
        stevilka="03"
        oznaka="Stranke"
        naslov={eno ? "Kaj pravi stranka." : "Kaj pravijo stranke."}
      />

      <div className={eno ? "mt-s4" : "mt-s4 gap-s4 grid lg:grid-cols-2 lg:gap-x-(--s5)"}>
        {seznam.map((p) => (
          <figure key={p.id} className="border-crta pt-s3 border-t">
            {/* Narekovaj je znak in ne beseda: stoji zunaj stolpca besedila,
                da prva vrstica ostane poravnana z vsemi drugimi. */}
            <blockquote
              className={
                eno
                  ? "type-h2 text-crnilo max-w-[22ch] text-balance"
                  : "type-h3 text-crnilo text-balance"
              }
            >
              <span aria-hidden className="text-poudarek">
                „
              </span>
              {p.besedilo}
              <span aria-hidden className="text-poudarek">
                “
              </span>
            </blockquote>

            <figcaption className="type-small font-oznaka text-bledo mt-s3 gap-x-s2 flex flex-wrap items-center gap-y-1">
              <span className="text-crnilo">{p.ime}</span>
              {p.vloga ? <span>· {p.vloga}</span> : null}
              {p.hisa ? (
                p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-poudarek inline-flex items-center gap-1 hover:underline"
                  >
                    {p.hisa}
                    <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
                  </a>
                ) : (
                  <span>· {p.hisa}</span>
                )
              ) : null}
              {p.kraj ? <span>· {p.kraj}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </Odsek>
  );
}
