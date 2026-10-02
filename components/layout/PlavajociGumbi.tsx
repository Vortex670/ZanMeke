"use client";

import { ArrowUp, MessageCircle, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { GumbIkona } from "@/components/ui/Gumb";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// Plavajoča gumba — na vrh in klepet
// ----------------------------------------------------------------------------
// Gumba stojita eden NAD drugim v istem stolpcu in se nikoli ne prekrivata.
// Na gostilnici je bila prav to napaka, ki jo je bilo treba loviti: košarica
// se je pojavila čez druga dva.
//
// »Na vrh« se pokaže šele po enem zaslonu drsenja — prej ni kam. Pojavi se
// brez animacije velikosti, ker bi ta ob vsakem drsenju premikala stolpec.
//
// Vsi trije gumbi so <GumbIkona> in ne surovi <button>: oblika, radij in
// odziv ob pritisku se tako spremenijo na enem mestu za vse tri strani.
//
// Klepet ni robot. Odpre predal s telefonsko številko, e-pošto in povezavo na
// obrazec — tri poti do človeka, ki res odgovori. Pogovorno okno, ki odgovarja
// z vnaprej pripravljenimi stavki, obiskovalca stane čas in ne pove ničesar,
// česar ne bi povedala telefonska številka.
// ============================================================================

export function PlavajociGumbi() {
  const [videnNaVrh, nastaviNaVrh] = useState(false);
  const [videnStik, nastaviStik] = useState(false);
  const [odprt, nastaviOdprt] = useState(false);

  useEffect(() => {
    const preveri = () => {
      nastaviNaVrh(window.scrollY > window.innerHeight * 0.8);
      // Gumb za stik se na PRVEM ZASLONU ne pokaže. Tam sta že dva poziva
      // (ponudba in telefon), gumb pa je silil čez pas dejstev in prekrival
      // podatek, ki je bil tam z razlogom. Pojavi se, ko hero odide.
      nastaviStik(window.scrollY > window.innerHeight * 0.5);
    };
    preveri();
    window.addEventListener("scroll", preveri, { passive: true });
    return () => window.removeEventListener("scroll", preveri);
  }, []);

  // Pobeg zapre predal — pričakovano vedenje vsakega okna, ki se odpre.
  useEffect(() => {
    if (!odprt) return;
    const naTipko = (e: KeyboardEvent) => e.key === "Escape" && nastaviOdprt(false);
    window.addEventListener("keydown", naTipko);
    return () => window.removeEventListener("keydown", naTipko);
  }, [odprt]);

  return (
    <div className="gap-s1 fixed right-4 bottom-4 z-50 flex flex-col items-end sm:right-6 sm:bottom-6">
      {odprt ? (
        <div
          role="dialog"
          aria-label="Stik"
          className="border-crta bg-ploskev w-72 overflow-hidden rounded-2xl border shadow-[0_18px_48px_-18px_rgba(15,21,19,0.35)]"
        >
          <div className="bg-obrat text-na-obratu px-s2 flex items-center justify-between py-2.5">
            <span className="type-label">Kako do mene</span>
            <GumbIkona
              naziv="Zapri"
              videz="tih"
              velikost="mal"
              onClick={() => nastaviOdprt(false)}
              className="text-na-obratu/70 hover:text-na-obratu size-8"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </GumbIkona>
          </div>

          <div className="p-s2 gap-s1 grid">
            <a
              href={`tel:${STRAN.telefonKlic}`}
              className="border-crta hover:border-poudarek gap-s1 flex items-center rounded-xl border p-3 transition-colors"
            >
              <Phone
                className="text-poudarek size-4 shrink-0"
                strokeWidth={1.8}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="type-body stevilke block">{STRAN.telefon}</span>
                <span className="type-micro text-bledo block">Odgovorim isti dan</span>
              </span>
            </a>

            <Link
              href="/kontakt"
              onClick={() => nastaviOdprt(false)}
              className="border-crta hover:border-poudarek gap-s1 flex items-center rounded-xl border p-3 transition-colors"
            >
              <MessageCircle
                className="text-poudarek size-4 shrink-0"
                strokeWidth={1.8}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="type-body block">Napišite povpraševanje</span>
                <span className="type-micro text-bledo block">Trije podatki, minuta</span>
              </span>
            </Link>
          </div>
        </div>
      ) : null}

      {videnNaVrh ? (
        <GumbIkona
          naziv="Na vrh strani"
          videz="obris"
          velikost="mal"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="size-11 shadow-[0_8px_24px_-12px_rgba(15,21,19,0.4)]"
        >
          <ArrowUp className="size-4" strokeWidth={2} aria-hidden />
        </GumbIkona>
      ) : null}

      {videnStik || odprt ? (
        <GumbIkona
          naziv={odprt ? "Zapri stik" : "Odpri stik"}
          onClick={() => nastaviOdprt((v) => !v)}
          aria-expanded={odprt}
          className="shadow-[0_10px_28px_-12px_rgba(15,21,19,0.55)]"
        >
          {odprt ? (
            <X className="size-5" strokeWidth={2} aria-hidden />
          ) : (
            <MessageCircle className="size-5" strokeWidth={2} aria-hidden />
          )}
        </GumbIkona>
      ) : null}
    </div>
  );
}
