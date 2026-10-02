"use client";

import { KeyRound } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { AdminSection } from "@/components/admin/kit/AdminSection";
import { FieldGroup } from "@/components/admin/kit/FieldGroup";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/actions/helpers";
import { zamenjajGesloAction } from "@/lib/varnost/actions";

// ============================================================================
// <GesloForm /> — zamenjava lastnega gesla
// ----------------------------------------------------------------------------
// TRENUTNO GESLO JE OBVEZNO. Odprta administracija na nezaklenjenem
// računalniku ne sme zadoščati za zamenjavo gesla — to je ravno dejanje, ki
// ga naredi nekdo, ki je sedel za tujo mizo.
//
// Ob uspehu gredo vse DRUGE naprave ven, ta ostane prijavljena: kdor geslo
// menja zato, ker ga je kdo videl, hoče prav to.
// ============================================================================

export function GesloForm() {
  const [izid, oddaj, tece] = useActionState<ActionResult | null, FormData>(
    zamenjajGesloAction,
    null,
  );
  const obrazec = useRef<HTMLFormElement>(null);
  const zadnji = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!izid || izid === zadnji.current) return;
    zadnji.current = izid;
    if (izid.ok) {
      toast.success(izid.message ?? "Geslo je spremenjeno.");
      obrazec.current?.reset();
    } else {
      toast.error(izid.message);
    }
  }, [izid]);

  const napake = izid && !izid.ok ? (izid.fieldErrors ?? {}) : {};

  return (
    <AdminSection
      icon={<KeyRound className="h-5 w-5" aria-hidden />}
      title="Geslo"
      description="Ob zamenjavi se odjavijo vse druge naprave; ta ostane prijavljena."
    >
      <form ref={obrazec} action={oddaj} className="grid max-w-md gap-(--s2)" noValidate>
        <FieldGroup label="Trenutno geslo" required error={napake.trenutno}>
          <Input
            name="trenutno"
            type="password"
            autoComplete="current-password"
            required
          />
        </FieldGroup>

        <FieldGroup
          label="Novo geslo"
          required
          hint="Vsaj dvanajst znakov. Daljše geslo je boljše od bolj zapletenega."
          error={napake.novo}
        >
          <Input name="novo" type="password" autoComplete="new-password" required />
        </FieldGroup>

        <FieldGroup label="Ponovi novo geslo" required error={napake.ponovi}>
          <Input name="ponovi" type="password" autoComplete="new-password" required />
        </FieldGroup>

        <div>
          <Button type="submit" disabled={tece}>
            {tece ? "Shranjujem …" : "Zamenjaj geslo"}
          </Button>
        </div>
      </form>
    </AdminSection>
  );
}
