"use client";

import { KeyRound } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { HiddenField } from "@/components/ui/HiddenField";

import { Gumb } from "@/components/ui/Gumb";
import { Polje, VnosGeslo } from "@/components/ui/Polje";
import type { ActionResult } from "@/lib/actions/helpers";
import { nastaviNovoGeslo } from "@/lib/prijava/geslo-actions";

/**
 * Nastavitev novega gesla.
 *
 * Dvanajst znakov je spodnja meja in ne priporočilo: to je edino geslo te
 * strani in za njim so vsa povpraševanja strank.
 */
export function ObrazecNovoGeslo({ zeton }: { zeton: string }) {
  const [izid, oddaj, tece] = useActionState<ActionResult | null, FormData>(
    nastaviNovoGeslo,
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
      <HiddenField name="zeton" value={zeton} />

      <Polje
        oznaka="Novo geslo"
        obvezno
        namig="Vsaj dvanajst znakov. Najlažje je kratek stavek, ki si ga zapomniš."
        napaka={napake.geslo?.[0]}
      >
        {(l) => (
          <VnosGeslo
            {...l}
            ikona={<KeyRound className="size-4" strokeWidth={1.8} />}
            name="geslo"
            autoComplete="new-password"
            autoFocus
            required
          />
        )}
      </Polje>

      <Polje oznaka="Ponovi geslo" obvezno napaka={napake.ponovi?.[0]}>
        {(l) => <VnosGeslo {...l} name="ponovi" autoComplete="new-password" required />}
      </Polje>

      <Gumb type="submit" disabled={tece} className="mt-s1 w-full justify-center">
        {tece ? "Shranjujem …" : "Shrani geslo"}
      </Gumb>

      <p className="type-micro text-bledo mt-s1">
        Ob spremembi se odjavijo vse naprave, ki so bile prijavljene.
      </p>
    </form>
  );
}
