"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";

import { Gumb } from "@/components/ui/Gumb";
import {
  PISKOTEK_PRIVOLITVE,
  PRIVOLITEV_DNI,
  preberiPrivolitev,
  type Privolitev,
} from "@/lib/privolitev";

// ============================================================================
// <PasPiskotkov /> — vprašanje o merjenju obiska
// ----------------------------------------------------------------------------
// ENAKO VELIKA GUMBA. »Sprejmem« in »Zavrnem« sta iste velikosti in iste teže;
// barvno poudarjen »Sprejmi« ob sivem »Zavrni« je po presoji evropskih
// nadzornikov privolitev, ki ni prostovoljna, in se ne šteje.
//
// PAS IN NE OKNO ČEZ ZASLON. Stran se da brati, dokler se človek ne odloči.
// Okno, ki zakrije vsebino, dobi »Sprejmi« od vsakogar — ne zato, ker bi kdo
// privolil, ampak zato, ker hoče naprej.
//
// NIČ SE NE ZGODI, DOKLER NI ODGOVORA: statistika do privolitve ne zapiše
// ničesar (`lib/analytics/actions.ts` to preveri še na strežniku), zato pas
// ni opravičilo za nekaj, kar že teče.
//
// Odločitev se da kadarkoli spremeniti — gumb »Piškotki« v nogi pas odpre
// znova. Umik privolitve mora biti enako preprost kot privolitev.
// ----------------------------------------------------------------------------
// Vidnost NI v `useState`: stanje, ki ga postavi učinek ob naložitvi, v
// Reactu 19 sproži drugi izris in pravilo `set-state-in-effect` to javi kot
// napako — upravičeno, ker pas potem utripne. Zunanja shramba pove isto brez
// drugega izrisa: na strežniku `false`, v brskalniku odgovor iz piškotka.
// ============================================================================

const poslusalci = new Set<() => void>();
let prisilno = false;

/** Noga pokliče to; pas se odpre tudi, kadar je odgovor že shranjen. */
export function odpriPasPiskotkov() {
  prisilno = true;
  poslusalci.forEach((f) => f());
}

function naroci(ponovi: () => void) {
  poslusalci.add(ponovi);
  return () => {
    poslusalci.delete(ponovi);
  };
}

const vBrskalniku = () => prisilno || preberiPrivolitev(document.cookie) === null;
const naStrezniku = () => false;

function shrani(odgovor: Privolitev) {
  const sekund = PRIVOLITEV_DNI * 24 * 60 * 60;
  document.cookie = `${PISKOTEK_PRIVOLITVE}=${odgovor}; Max-Age=${sekund}; Path=/; SameSite=Lax${
    location.protocol === "https:" ? "; Secure" : ""
  }`;
}

export function PasPiskotkov() {
  const viden = useSyncExternalStore(naroci, vBrskalniku, naStrezniku);

  const odgovori = useCallback((odgovor: Privolitev) => {
    shrani(odgovor);
    prisilno = false;
    poslusalci.forEach((f) => f());
    // Osveži stran, da se merjenje po privolitvi začne takoj. Po zavrnitvi
    // osveževanja ni — tam se ni začelo nič, kar bi bilo treba ustaviti.
    if (odgovor === "da") location.reload();
  }, []);

  if (!viden) return null;

  return (
    <div
      role="dialog"
      aria-label="Piškotki"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:right-auto sm:bottom-4 sm:left-4 sm:max-w-md sm:p-0"
    >
      <div className="border-crta bg-ploskev p-s3 rounded-2xl border shadow-[0_18px_48px_-18px_rgba(15,21,19,0.35)]">
        <p className="type-label text-poudarek">Piškotki</p>
        <p className="type-small text-mirno mt-s1">
          Za merjenje obiska uporabim en piškotek in zgoščeno sled naslova IP. Brez
          njega stran dela enako — samo ne vem, katera stran je komu koristila.
        </p>

        <div className="mt-s2 gap-s1 flex flex-wrap items-center">
          <Gumb velikost="mal" onClick={() => odgovori("da")}>
            Sprejmem
          </Gumb>
          <Gumb velikost="mal" videz="obris" onClick={() => odgovori("ne")}>
            Zavrnem
          </Gumb>
          <Link
            href="/piskotki"
            className="type-micro text-bledo hover:text-crnilo ml-auto underline transition-colors"
          >
            Kaj to pomeni
          </Link>
        </div>
      </div>
    </div>
  );
}
