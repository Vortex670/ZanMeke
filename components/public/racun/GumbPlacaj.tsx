"use client";

import { CreditCard } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Gumb } from "@/components/ui/Gumb";
import { zacniPlaciloAction } from "@/lib/racuni/actions";

// ============================================================================
// <GumbPlacaj /> — odpre Stripovo blagajno
// ----------------------------------------------------------------------------
// Preusmeritve ne naredi strežnik, ampak brskalnik z vrnjenim naslovom: tako
// se napaka (Stripe ne odgovori) pokaže kot sporočilo na strani in ne kot
// prazen zaslon sredi preusmerjanja.
//
// Gumb ostane ONEMOGOČEN tudi PO uspehu — med klikom in preusmeritvijo mine
// trenutek, in v tem času se da pritisniti še enkrat. Dve blagajni za isti
// račun sta dve plačili.
// ============================================================================

export function GumbPlacaj({ zeton }: { zeton: string }) {
  const [tece, zacni] = useTransition();
  const [preusmerja, nastaviPreusmerja] = useState(false);

  function placaj() {
    zacni(async () => {
      const izid = await zacniPlaciloAction(zeton);
      if (izid.ok && izid.data) {
        nastaviPreusmerja(true);
        window.location.assign(izid.data.url);
      } else {
        toast.error(izid.ok ? "Blagajne ni bilo mogoče odpreti." : izid.message);
      }
    });
  }

  return (
    <Gumb
      type="button"
      onClick={placaj}
      disabled={tece || preusmerja}
      ikona={<CreditCard aria-hidden />}
    >
      {tece || preusmerja ? "Odpiram blagajno …" : "Plačaj s kartico"}
    </Gumb>
  );
}
