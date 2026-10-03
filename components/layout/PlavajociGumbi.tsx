"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { GumbIkona } from "@/components/ui/Gumb";

// ============================================================================
// Plavajoči gumb — na vrh
// ----------------------------------------------------------------------------
// OSTAL JE EN SAM. Poleg njega je stal gumb, ki je odprl predal s telefonsko
// številko, e-pošto in povezavo na obrazec. Odkar ima glava na telefonu meni
// s tremi črtami, ta predal ponuja isto — in dva načina, kako priti do iste
// telefonske številke, nista dvakrat več poti, ampak dvakrat več vprašanja,
// katero je pravo. Številka je poleg tega v glavi, v uvodu, v odseku »Stik«
// in v nogi; peta pot do nje ni manjkala nikomur.
//
// »Na vrh« se pokaže šele po enem zaslonu drsenja — prej ni kam. Pojavi se
// brez animacije velikosti, ker bi ta ob vsakem drsenju premikala kot.
// ============================================================================

export function PlavajociGumbi() {
  const [viden, nastaviViden] = useState(false);

  useEffect(() => {
    const preveri = () => nastaviViden(window.scrollY > window.innerHeight * 0.8);
    preveri();
    window.addEventListener("scroll", preveri, { passive: true });
    return () => window.removeEventListener("scroll", preveri);
  }, []);

  if (!viden) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      <GumbIkona
        naziv="Na vrh strani"
        videz="obris"
        velikost="mal"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="size-11 shadow-[0_8px_24px_-12px_rgba(15,21,19,0.4)]"
      >
        <ArrowUp className="size-4" strokeWidth={2} aria-hidden />
      </GumbIkona>
    </div>
  );
}
