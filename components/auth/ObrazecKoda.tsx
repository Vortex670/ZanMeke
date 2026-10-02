"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Gumb } from "@/components/ui/Gumb";
import { HiddenField } from "@/components/ui/HiddenField";
import { Polje, VnosZIkono } from "@/components/ui/Polje";
import type { ActionResult } from "@/lib/actions/helpers";
import { potrdiKodo } from "@/lib/prijava/actions";

// ============================================================================
// <ObrazecKoda /> — drugi korak prijave
// ----------------------------------------------------------------------------
// ENO POLJE ZA OBE VRSTI KODE. Šestmestna iz generatorja in rezervna
// (`XXXX-XXXX-XXXX-XXXX`) gresta v isto polje; strežnik ju loči po obliki.
// Dve polji bi pomenili, da mora človek sredi prijave presoditi, katero je
// njegovo — in ravno takrat, ko mu telefon ni pri roki in se mu mudi.
//
// `inputMode="numeric"` prikliče na telefonu številčnico, `autoComplete`
// pa pove upravitelju gesel, da gre za enkratno kodo.
// ============================================================================

export function ObrazecKoda({ next = "/admin" }: { next?: string }) {
  const [izid, oddaj, tece] = useActionState<ActionResult | null, FormData>(
    potrdiKodo,
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
      <HiddenField name="next" value={next} />

      <Polje
        oznaka="Koda"
        obvezno
        napaka={napake.koda?.[0]}
        namig="Šest števk iz generatorja ali rezervna koda s črticami."
      >
        {(l) => (
          <VnosZIkono
            {...l}
            ikona={<ShieldCheck className="size-4" strokeWidth={1.8} />}
            name="koda"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            className="stevilke tracking-[0.3em]"
          />
        )}
      </Polje>

      <Gumb type="submit" disabled={tece} ikona={<ArrowRight aria-hidden />}>
        {tece ? "Preverjam …" : "Potrdi"}
      </Gumb>

      <p className="type-micro text-bledo text-center">
        Telefona ni pri roki in rezervnih kod nimaš?{" "}
        <Link href="/prijava" className="underline underline-offset-4">
          Začni znova
        </Link>
      </p>
    </form>
  );
}
