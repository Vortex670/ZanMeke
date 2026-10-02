"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Gumb } from "@/components/ui/Gumb";
import { Polje, Vnos } from "@/components/ui/Polje";
import type { ActionResult } from "@/lib/actions/helpers";
import { prijavi } from "@/lib/prijava/actions";

// ============================================================================
// <ObrazecPrijava />
// ----------------------------------------------------------------------------
// Obrazec za enega človeka. Brez »zapomni si me« (seja traja trideset dni) in
// brez registracije — nov račun nastane z ukazom na strežniku, ne s klikom na
// javni strani.
// ============================================================================

export function ObrazecPrijava() {
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
      <Polje oznaka="E-naslov" obvezno napaka={napake.email?.[0]}>
        {(l) => (
          <Vnos
            {...l}
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
          <Vnos
            {...l}
            name="geslo"
            type="password"
            autoComplete="current-password"
            required
          />
        )}
      </Polje>

      <Gumb type="submit" disabled={tece} className="mt-s1 justify-center">
        {tece ? "Prijavljam …" : "Prijava"}
      </Gumb>
    </form>
  );
}
