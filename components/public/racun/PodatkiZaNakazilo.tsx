"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ============================================================================
// <PodatkiZaNakazilo /> — IBAN, sklic in znesek s tipko »kopiraj«
// ----------------------------------------------------------------------------
// VSAKA VRSTICA JE TIPKA. Kdor plačuje v spletni banki, ima odprti dve okni
// in med njima prenaša devetnajst znakov IBAN-a; prepis na roko je ena
// napačna števka od nakazila, ki se vrne čez teden dni. Dotik kopira, kljukica
// pove, da je kopirano.
//
// Vrednost ostane VIDNA kot besedilo in izbirna z miško: kopiranje v odložišče
// brskalnik včasih zavrne (ni varne povezave, zavrnjeno dovoljenje), in takrat
// mora človek še vedno priti do podatka. Zato tipka nikoli ne skrije vrednosti
// in ob zavrnitvi vrstico označi, da si jo lahko označi sam.
// ============================================================================

export type VrsticaNakazila = {
  oznaka: string;
  /** Kar se vidi — s presledki, ki jih oko potrebuje. */
  prikaz: string;
  /** Kar gre v odložišče — brez presledkov, če jih banka ne mara. */
  vrednost: string;
};

export function PodatkiZaNakazilo({ vrstice }: { vrstice: VrsticaNakazila[] }) {
  const [kopirano, nastaviKopirano] = useState<string | null>(null);
  const ura = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (ura.current && clearTimeout(ura.current)), []);

  async function kopiraj(v: VrsticaNakazila, cilj: HTMLElement) {
    try {
      await navigator.clipboard.writeText(v.vrednost);
      nastaviKopirano(v.oznaka);
      if (ura.current) clearTimeout(ura.current);
      ura.current = setTimeout(() => nastaviKopirano(null), 1800);
    } catch {
      // Brez odložišča ostane edina pot ročna — zato vrednost vsaj označimo,
      // da je en ukaz od kopiranja.
      const izbor = window.getSelection();
      const obseg = document.createRange();
      obseg.selectNodeContents(cilj);
      izbor?.removeAllRanges();
      izbor?.addRange(obseg);
    }
  }

  return (
    <ul className="divide-crta-mehka divide-y">
      {vrstice.map((v) => {
        const je = kopirano === v.oznaka;
        return (
          <li key={v.oznaka}>
            <button
              type="button"
              onClick={(e) => kopiraj(v, e.currentTarget.querySelector("[data-v]")!)}
              aria-label={`Kopiraj ${v.oznaka.toLowerCase()}`}
              className="group gap-s2 hover:bg-poudarek-mehko/60 flex w-full items-baseline justify-between rounded-md px-2 py-2.5 text-left transition-colors"
            >
              <span className="type-micro text-bledo shrink-0">{v.oznaka}</span>
              <span className="gap-s1 flex min-w-0 items-baseline">
                <span data-v className="type-small stevilke truncate">
                  {v.prikaz}
                </span>
                <span
                  aria-hidden
                  className={`shrink-0 transition-colors ${
                    je ? "text-poudarek" : "text-bledo group-hover:text-poudarek"
                  }`}
                >
                  {je ? (
                    <Check className="size-3.5" strokeWidth={2.4} />
                  ) : (
                    <Copy className="size-3.5" strokeWidth={1.8} />
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
