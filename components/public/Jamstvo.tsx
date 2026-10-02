import { ShieldCheck, Sparkles } from "lucide-react";

import { Odsek, UvodOdseka } from "@/components/public/Odsek";
import { JAMSTVO, PRVA_REFERENCA } from "@/lib/podatki";

// ============================================================================
// <Jamstvo /> — kdo nosi tveganje
// ----------------------------------------------------------------------------
// Dve ploskvi, ne ena. Jamstvo in ponudba za prvo referenco sta dve različni
// stvari in če stojita v istem okvirju, se bere kot eno dolgo opravičilo.
//
// Jamstvo ima poln poudarek, prva referenca samo obrobo: prvo velja za
// vsakogar in vedno, drugo je začasno in za dva. Teža na strani naj to pove,
// preden kdo prebere besedilo.
// ============================================================================

export function Jamstvo() {
  return (
    <Odsek plast="svetla" sirina="sirok" as="section">
      <UvodOdseka
        stevilka="05"
        oznaka="Tveganje"
        naslov="Tveganje nosim jaz."
        uvod="Vi ne morete vnaprej vedeti, ali vam bo sistem res prihranil čas. Jaz lahko. Zato je jamstvo napisano s številko, ki jo lahko preštejete."
      />

      <div className="mt-s4 gap-s2 grid lg:grid-cols-[1.2fr_1fr]">
        <div className="border-poudarek bg-poudarek-mehko p-s3 sm:p-s4 rounded-2xl border">
          <ShieldCheck className="text-poudarek size-7" strokeWidth={1.5} aria-hidden />
          <h3 className="type-h2 mt-s3">{JAMSTVO.naslov}</h3>
          <p className="type-lead text-crnilo mt-s2 mera">{JAMSTVO.obljuba}</p>
          <p className="type-small text-mirno mt-s2 mera">{JAMSTVO.pojasnilo}</p>
        </div>

        <div className="border-crta p-s3 sm:p-s4 rounded-2xl border border-dashed">
          <Sparkles className="text-poudarek size-6" strokeWidth={1.5} aria-hidden />
          <h3 className="type-h3 mt-s3">{PRVA_REFERENCA.naslov}</h3>
          <p className="type-body text-mirno mt-s2">{PRVA_REFERENCA.obljuba}</p>
          <p className="type-small text-bledo mt-s2">{PRVA_REFERENCA.pojasnilo}</p>
        </div>
      </div>
    </Odsek>
  );
}
