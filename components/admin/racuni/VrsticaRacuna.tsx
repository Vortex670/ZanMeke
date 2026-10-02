"use client";

import { Ban, Check, Copy, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import {
  oznaciPlacanAction,
  oznaciPoslanAction,
  preklicIRacunAction,
} from "@/lib/racuni/actions";

// ============================================================================
// <VrsticaRacuna /> — dejanja pri enem računu
// ----------------------------------------------------------------------------
// »Kopiraj povezavo« je prvo in največje dejanje: to je tisto, kar se res
// počne — povezavo prilepiš v e-pošto ali sporočilo.
//
// »Označi plačano« je tu za nakazila na račun. Kartično plačilo se označi
// samo, nikoli od tod.
//
// Preklic je zadnji in tih. Plačanega računa ni mogoče preklicati — za
// vračilo gre skozi Stripe, kjer je tudi denar.
//
// BRISANJA TU NI: to je `EntityRowActions`, ista komponenta kot na
// gostilnica-plus.si in second-home.hr, ki nosi urejanje in brisanje na vseh
// seznamih. Tu so DOMENSKA dejanja, ki jih druge strani nimajo.
// ============================================================================

export function VrsticaRacuna({
  id,
  zeton,
  stanje,
}: {
  id: string;
  zeton: string;
  stanje: "OSNUTEK" | "POSLAN" | "PLACAN" | "PREKLICAN";
}) {
  const router = useRouter();
  const [tece, zacni] = useTransition();

  function kopiraj() {
    const url = `${window.location.origin}/racun/${zeton}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Povezava je kopirana."))
      // Odklonjen odložišče (starejši brskalnik, stran brez HTTPS) ne sme
      // ostati brez odgovora — takrat pokažemo naslov, da ga je mogoče
      // prepisati ročno.
      .catch(() => toast.message("Povezava", { description: url }));
  }

  function dejanje(fn: () => Promise<{ ok: boolean; message?: string }>) {
    zacni(async () => {
      const izid = await fn();
      if (izid.ok) {
        toast.success(izid.message ?? "Shranjeno.");
        router.refresh();
      } else {
        toast.error(izid.message ?? "Ni šlo.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={kopiraj}
        leftIcon={<Copy className="h-4 w-4" aria-hidden />}
      >
        Kopiraj povezavo
      </Button>

      {stanje === "OSNUTEK" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={tece}
          onClick={() => dejanje(() => oznaciPoslanAction(id))}
          leftIcon={<Send className="h-4 w-4" aria-hidden />}
        >
          Označi poslano
        </Button>
      ) : null}

      {stanje !== "PLACAN" && stanje !== "PREKLICAN" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={tece}
          onClick={() => dejanje(() => oznaciPlacanAction(id))}
          leftIcon={<Check className="h-4 w-4" aria-hidden />}
        >
          Plačano z nakazilom
        </Button>
      ) : null}

      {stanje !== "PLACAN" && stanje !== "PREKLICAN" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={tece}
          onClick={() => dejanje(() => preklicIRacunAction(id))}
          leftIcon={<Ban className="h-4 w-4" aria-hidden />}
          className="text-danger hover:text-danger"
        >
          Prekliči
        </Button>
      ) : null}
    </div>
  );
}
