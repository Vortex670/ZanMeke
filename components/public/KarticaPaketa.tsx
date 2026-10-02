import { Check } from "lucide-react";

import { GumbPovezava } from "@/components/ui/Gumb";
import type { Paket } from "@/lib/podatki";
import { cn } from "@/lib/utils";

// ============================================================================
// <KarticaPaketa /> — en paket s ceno
// ----------------------------------------------------------------------------
// Tri kartice, ki se primerjajo z enim pogledom. Priporočena ima debelejšo
// obrobo in oznako — in NIČ VEČ: pobarvana kartica med dvema belima izloči
// drugi dve iz igre, namesto da bi med njimi pomagala izbrati.
//
// Enake višine so nujne, ker so cene v isti vrstici edino, kar se bere
// vodoravno. `grid-rows-subgrid` bi bil lepši, a razpad pri dveh stolpcih na
// tablici ni vreden tveganja — zato `flex` in `mt-auto` pri nogi.
// ============================================================================

export function KarticaPaketa({ paket }: { paket: Paket }) {
  return (
    <article
      className={cn(
        // PLOSKEV S SENCO in ne obroba. Tri kartice z obrobo poleg tabele
        // z obrobo in odsekov z obrobo naredijo stran, ki je videti kot
        // obrazec. Senca loči kartico od papirja prav tako jasno, a je ne
        // zapre v okvir.
        "bg-ploskev p-s3 relative flex h-full flex-col rounded-2xl shadow-(--shadow-card)",
        // Priporočeni paket dobi edino obrobo na strani — zato jo oko najde.
        paket.priporoceno && "ring-poudarek ring-2",
      )}
    >
      {paket.priporoceno ? (
        <span className="bg-poudarek text-na-poudarku type-micro left-s3 absolute -top-3 rounded-full px-2.5 py-1">
          najpogosteje
        </span>
      ) : null}

      <h3 className="type-h3">{paket.ime}</h3>
      <p className="type-small text-mirno mt-s1 min-h-[3lh]">{paket.komu}</p>

      <p className="type-h2 font-naslov stevilke mt-s2">{paket.cena}</p>
      <p className="type-micro text-bledo">enkratno, brez DDV</p>

      <ul className="mt-s3 gap-s1 grid">
        {paket.vsebuje.map((v) => (
          <li key={v} className="type-small flex items-start gap-2">
            <Check
              className="text-poudarek mt-0.5 size-4 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            {v}
          </li>
        ))}
      </ul>

      <div className="pt-s3 mt-auto">
        <GumbPovezava
          href="/kontakt"
          videz={paket.priporoceno ? "polni" : "obris"}
          className="w-full"
        >
          Povprašaj
        </GumbPovezava>
      </div>
    </article>
  );
}
