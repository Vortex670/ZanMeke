"use client";

import { odpriPasPiskotkov } from "@/components/analytics/PasPiskotkov";
import { Pressable } from "@/components/ui/Pressable";

// ============================================================================
// <GumbPiskotki /> — »Piškotki« v nogi
// ----------------------------------------------------------------------------
// Umik privolitve mora biti enako preprost kot privolitev; to je zahteva in
// ne vljudnost. Gumb pas odpre znova ne glede na to, kaj je človek izbral
// prej — tudi tisti, ki je sprejel, mora imeti pot nazaj.
//
// NAPIS NI »Piškotki«: tako se imenuje stran s pojasnilom, ki v nogi stoji
// tik ob njem. Dve povezavi z istim napisom, ki peljeta drugam, sta napaka,
// tudi kadar sta obe pravilni.
// ============================================================================

export function GumbPiskotki({ className }: { className?: string }) {
  return (
    <Pressable onClick={odpriPasPiskotkov} className={className}>
      Nastavitve piškotkov
    </Pressable>
  );
}
