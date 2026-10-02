"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Gumb } from "@/components/ui/Gumb";
import { Besedilo, Past, Pilula, Polje, Vnos } from "@/components/ui/Polje";
import type { ActionResult } from "@/lib/actions/helpers";
import { posljiPovprasevanje } from "@/lib/kontakt/actions";
import { ZANIMANJE, ZANIMANJE_NAPIS } from "@/lib/kontakt/validation";

// ============================================================================
// <ObrazecKontakt /> — povpraševanje
// ----------------------------------------------------------------------------
// Polj je šest in le tri so obvezna. Vsako dodatno polje stane oddajo; tisto,
// česar ne potrebujem za klic, vprašam po telefonu.
//
// Napake stojijo pod poljem in ne v toastu: toast izgine, polje pa ostane
// napačno. Toast je samo za izid celote.
//
// Obrazec dela tudi brez JavaScripta: `action` je strežniška akcija, ne
// `onSubmit`. Kdor ima počasno zvezo, odda sporočilo, še preden se stran
// hidrira.
// ============================================================================

const ZACETNO: ActionResult | null = null;

export function ObrazecKontakt({
  privzetoZanimanje = "SPLETNA_STRAN",
}: {
  privzetoZanimanje?: (typeof ZANIMANJE)[number];
}) {
  const [izid, oddaj, teče] = useActionState(posljiPovprasevanje, ZACETNO);
  const obrazec = useRef<HTMLFormElement>(null);
  const zadnji = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!izid || izid === zadnji.current) return;
    zadnji.current = izid;

    if (izid.ok) {
      toast.success(izid.message ?? "Sporočilo je oddano.");
      obrazec.current?.reset();
    } else {
      toast.error(izid.message);
    }
  }, [izid]);

  const napake = izid && !izid.ok ? (izid.fieldErrors ?? {}) : {};
  const napakaPolja = (ime: string) => napake[ime]?.[0];

  return (
    <form ref={obrazec} action={oddaj} className="gap-s3 relative grid" noValidate>
      <Past />

      <div className="gap-s2 grid sm:grid-cols-2">
        <Polje oznaka="Ime in priimek" obvezno napaka={napakaPolja("ime")}>
          {(l) => <Vnos {...l} name="ime" autoComplete="name" required />}
        </Polje>

        <Polje oznaka="Podjetje ali dejavnost" napaka={napakaPolja("podjetje")}>
          {(l) => <Vnos {...l} name="podjetje" autoComplete="organization" />}
        </Polje>

        <Polje
          oznaka="Telefon"
          obvezno
          namig="Pokličem nazaj isti dan."
          napaka={napakaPolja("telefon")}
        >
          {(l) => <Vnos {...l} name="telefon" type="tel" autoComplete="tel" required />}
        </Polje>

        <Polje oznaka="E-pošta" napaka={napakaPolja("epota")}>
          {(l) => <Vnos {...l} name="epota" type="email" autoComplete="email" />}
        </Polje>
      </div>

      <fieldset className="gap-s1 grid">
        <legend className="type-label text-mirno">Kaj vas zanima</legend>
        <div className="gap-s1 mt-s1 flex flex-wrap">
          {ZANIMANJE.map((z) => (
            <Pilula
              key={z}
              ime="zanimanje"
              vrednost={z}
              napis={ZANIMANJE_NAPIS[z]}
              privzeto={z === privzetoZanimanje}
            />
          ))}
        </div>
      </fieldset>

      <Polje
        oznaka="Sporočilo"
        obvezno
        namig="Kaj vas muči? Na primer: »Vsak dan dvajset klicev z istim vprašanjem.«"
        napaka={napakaPolja("sporocilo")}
      >
        {(l) => <Besedilo {...l} name="sporocilo" required />}
      </Polje>

      <div className="gap-s2 flex flex-wrap items-center">
        <Gumb type="submit" disabled={teče}>
          {teče ? "Pošiljam …" : "Pošlji povpraševanje"}
        </Gumb>
        <p className="type-micro text-bledo">
          Podatke uporabim samo za odgovor na to povpraševanje.
        </p>
      </div>
    </form>
  );
}
