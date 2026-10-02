"use client";

import { ArrowRight, AtSign, KeyRound } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Gumb } from "@/components/ui/Gumb";
import { Kljukica, Polje, VnosGeslo, VnosZIkono } from "@/components/ui/Polje";
import type { ActionResult } from "@/lib/actions/helpers";
import { prijavi } from "@/lib/prijava/actions";

// ============================================================================
// <ObrazecPrijava />
// ----------------------------------------------------------------------------
// Dve polji, kljukica in gumb. Brez registracije — nov račun nastane z ukazom
// na strežniku in ne s klikom na javni strani.
//
// »Zapomni si me« ni okras: brez njega traja seja do zaprtja brskalnika, kar
// je prav na tuji napravi. S kljukico traja trideset dni, kar je prav na
// svojem telefonu. Razlika je zapisana pod kljukico, ker je sicer nihče ne
// razume in jo vsi pustijo, kakor je bila.
//
// Geslo ima gumb za prikaz: kdor tipka dolgo geslo na slepo, se zmoti — in
// prijava ne sme in ne more povedati, kje se je zmotil.
// ============================================================================

export function ObrazecPrijava({ next = "/admin" }: { next?: string }) {
  const [izid, oddaj, tece] = useActionState<ActionResult | null, FormData>(
    prijavi,
    null,
  );
  const zadnji = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!izid || izid === zadnji.current || izid.ok) return;
    zadnji.current = izid;
    toast.error(izid.message);
  }, [izid]);

  const napake = izid && !izid.ok ? (izid.fieldErrors ?? {}) : {};

  return (
    <form action={oddaj} className="gap-s2 grid" noValidate>
      {/* Kam po prijavi — pot je preverjena na strani, ki obrazec izriše. */}
      <input type="hidden" name="next" value={next} />

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

      <Polje oznaka="Geslo" obvezno napaka={napake.geslo?.[0]}>
        {(l) => (
          <VnosGeslo
            {...l}
            ikona={<KeyRound className="size-4" strokeWidth={1.8} />}
            name="geslo"
            autoComplete="current-password"
            required
          />
        )}
      </Polje>

      <div className="mt-s1">
        <Kljukica
          ime="zapomni"
          napis="Zapomni si me"
          razlaga="Trideset dni na tej napravi. Na tujem računalniku pusti prazno — seja se konča ob zaprtju brskalnika."
          privzeto
        />
      </div>

      <Gumb type="submit" disabled={tece} className="mt-s2 w-full justify-center">
        {tece ? "Prijavljam …" : "Prijavi se"}
        {!tece ? <ArrowRight className="size-4" strokeWidth={2} aria-hidden /> : null}
      </Gumb>

      <p className="type-label text-bledo mt-s2 text-center">
        <Link href="/prijava/geslo" className="hover:text-crnilo transition-colors">
          Pozabljeno geslo?
        </Link>
      </p>
    </form>
  );
}
