import { Camera, Check, Monitor } from "lucide-react";

import { GumbPovezava } from "@/components/ui/Gumb";
import type { Storitev } from "@/lib/podatki";

// ============================================================================
// <KarticaStoritve /> — ena od dveh stvari, ki jih delam
// ----------------------------------------------------------------------------
// Dve kartici drug ob drugem, ne seznam veščin. Obiskovalec mora v enem
// pogledu videti, za kaj od dvojega me kliče — in koliko to stane. Cena je na
// kartici in ne na podstrani: kdor je ne najde, ne pokliče, da bi vprašal.
//
// Kartici sta ENAKO VISOKI (`h-full` + `mt-auto` pri nogi), tudi kadar ima
// ena daljši povzetek. Dve kartici različnih višin sta prva stvar, ki jo oko
// prebere kot »tega ni nihče pogledal«.
// ============================================================================

const IKONA = { splet: Monitor, foto: Camera } as const;

export function KarticaStoritve({ storitev }: { storitev: Storitev }) {
  const Ikona = IKONA[storitev.kljuc];

  return (
    <article className="border-crta bg-ploskev p-s3 flex h-full flex-col border">
      <Ikona className="text-poudarek size-6" strokeWidth={1.6} aria-hidden />

      <h3 className="type-h3 mt-s2">{storitev.naslov}</h3>
      <p className="type-body text-mirno mt-s1">{storitev.povzetek}</p>

      <ul className="mt-s2 gap-s1 grid">
        {storitev.tocke.map((t) => (
          <li key={t} className="type-small text-mirno flex items-start gap-2">
            <Check
              className="text-poudarek mt-0.5 size-4 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            {t}
          </li>
        ))}
      </ul>

      <div className="border-crta-mehka mt-s3 pt-s2 gap-s2 flex flex-wrap items-center border-t">
        <p className="type-h3 font-naslov stevilke mt-auto">{storitev.cenaOd}</p>
        <GumbPovezava href="/ponudba" videz="obris" velikost="mal" className="ml-auto">
          Podrobno
        </GumbPovezava>
      </div>
    </article>
  );
}
