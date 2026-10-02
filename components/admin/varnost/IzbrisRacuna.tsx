"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { AdminSection } from "@/components/admin/kit/AdminSection";
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
    <AdminSection
      icon={<Trash2 className="h-5 w-5" aria-hidden />}
      title="Izbris računa"
      description="Nepovratno. Računi strank, sporočila in listine ostanejo — niso last tega računa."
    >
      <form action={oddaj} className="grid max-w-md gap-(--s2)" noValidate>
        <FieldGroup label="Geslo" required error={napake.geslo}>
          <Input name="geslo" type="password" autoComplete="current-password" required />
        </FieldGroup>

        <FieldGroup
          label="Za potrditev prepiši svoj e-naslov"
          required
          hint={epota}
          error={napake.potrdilo}
        >
          <Input name="potrdilo" autoComplete="off" required />
        </FieldGroup>

        <div>
          <Button
            type="submit"
            variant="ghost"
            disabled={tece}
            leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
            className="text-danger hover:text-danger"
          >
            {tece ? "Brišem …" : "Izbriši moj račun"}
          </Button>
        </div>
      </form>
    </AdminSection>
  );
}
