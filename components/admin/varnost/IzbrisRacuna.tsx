"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { FieldGroup } from "@/components/admin/kit/FieldGroup";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/actions/helpers";
import { izbrisiMojRacunAction } from "@/lib/varnost/actions";

// ============================================================================
// <IzbrisRacuna /> — zadnja sekcija na strani in tako mora biti
// ----------------------------------------------------------------------------
// Najbolj nepovratno dejanje stoji na dnu, za vsem drugim: da prideš do njega,
// moraš mimo gesla, dvofaktorske prijave in seznama naprav.
//
// Tri zapore: geslo, prepis lastnega e-naslova in pravilo, da zadnjega računa
// ni mogoče izbrisati. Brez tretje bi stran ostala brez vsakogar, ki bi se
// sploh lahko prijavil — in nazaj ne bi bilo poti.
//
// OKVIR JE RDEČ. Prej je bil ta odsek videti natanko kot »Prijavljene
// naprave«: ista kartica, ista obroba, isti razmik. Najbolj nepovratno
// dejanje v administraciji se ne sme brati kot vsako drugo — barva je tu
// opozorilo in ne okras.
// ============================================================================

export function IzbrisRacuna({ epota }: { epota: string }) {
  const [izid, oddaj, tece] = useActionState<ActionResult | null, FormData>(
    izbrisiMojRacunAction,
    null,
  );
  const zadnji = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!izid || izid === zadnji.current) return;
    zadnji.current = izid;
    if (izid.ok) {
      toast.success(izid.message ?? "Račun je izbrisan.");
      window.location.href = "/prijava";
    } else {
      toast.error(izid.message);
    }
  }, [izid]);

  const napake = izid && !izid.ok ? (izid.fieldErrors ?? {}) : {};

  return (
    <section className="border-danger/55 bg-danger-bg/40 rounded-2xl border p-(--s3)">
      <header className="flex items-start gap-3">
        <span className="bg-danger/15 text-danger flex size-10 shrink-0 items-center justify-center rounded-full">
          <Trash2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="type-lead text-text font-semibold">Izbris računa</h2>
          <p className="type-small text-muted mt-0.5 max-w-prose">
            Nepovratno in takojšnje. Računi strank, sporočila in listine ostanejo — niso
            last tega računa.
          </p>
        </div>
      </header>

      <form action={oddaj} className="mt-(--s3) grid gap-(--s2)" noValidate>
        {/* Obe polji sta potrditev istega dejanja, zato stojita skupaj. */}
        <div className="grid gap-(--s2) sm:grid-cols-2">
          <FieldGroup label="Geslo" required error={napake.geslo}>
            <Input
              name="geslo"
              type="password"
              autoComplete="current-password"
              required
            />
          </FieldGroup>

          <FieldGroup
            label="Prepiši svoj e-naslov"
            required
            hint={
              <>
                Natanko <span className="text-text">{epota}</span>
              </>
            }
            error={napake.potrdilo}
          >
            <Input
              name="potrdilo"
              autoComplete="off"
              placeholder={epota}
              inputMode="email"
              required
            />
          </FieldGroup>
        </div>

        <div>
          <Button
            type="submit"
            variant="danger"
            disabled={tece}
            leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
          >
            {tece ? "Brišem …" : "Izbriši moj račun"}
          </Button>
        </div>
      </form>
    </section>
  );
}
