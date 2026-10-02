"use client";

import { AtSign, Send } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Gumb } from "@/components/ui/Gumb";
import { Polje, VnosZIkono } from "@/components/ui/Polje";
import type { ActionResult } from "@/lib/actions/helpers";
import { zahtevajPonastavitev } from "@/lib/prijava/geslo-actions";

/**
 * Obrazec za pozabljeno geslo.
 *
 * Po oddaji ostane sporočilo na strani in ne samo v toastu: človek, ki čaka
 * na pošto, mora videti, da je zahteva odšla, tudi ko toast izgine.
 */
export function ObrazecZahtevajGeslo() {
  const [izid, oddaj, tece] = useActionState<ActionResult | null, FormData>(
    zahtevajPonastavitev,
    null,
  );
  const zadnji = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!izid || izid === zadnji.current) return;
    zadnji.current = izid;
    if (izid.ok) toast.success(izid.message ?? "Poslano.");
    else toast.error(izid.message);
  }, [izid]);

  if (izid?.ok) {
    return (
      <div className="border-poudarek bg-poudarek-mehko p-s3 rounded-[3px] border">
        <p className="type-body text-crnilo">{izid.message}</p>
        <p className="type-micro text-mirno mt-s1">
          Če pošte ni v nekaj minutah, poglej med neželeno.
        </p>
      </div>
    );
  }

  const napake = izid && !izid.ok ? (izid.fieldErrors ?? {}) : {};

  return (
    <form action={oddaj} className="gap-s2 grid" noValidate>
      <Polje oznaka="E-naslov" obvezno napaka={napake.email?.[0]}>
        {(l) => (
          <VnosZIkono
            {...l}
            ikona={<AtSign className="size-4" strokeWidth={1.8} />}
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            required
          />
        )}
      </Polje>

      <Gumb type="submit" disabled={tece} className="mt-s1 w-full justify-center">
        {tece ? "Pošiljam …" : "Pošlji povezavo"}
        {!tece ? <Send className="size-4" strokeWidth={2} aria-hidden /> : null}
      </Gumb>
    </form>
  );
}
