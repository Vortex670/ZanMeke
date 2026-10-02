import "server-only";

import PotrdiloPlacila from "@/emails/PotrdiloPlacila";
import { posljiPredlogo } from "@/lib/posta/send";
import { prisma } from "@/lib/prisma";
import { zneskovno } from "@/lib/racuni/validation";

// ============================================================================
// lib/racuni/potrdilo.ts — potrdilo o plačilu
// ----------------------------------------------------------------------------
// Ločeno od webhooka, ker plačilo lahko potrdita DVE poti: Stripov webhook in
// uskladitev, ki Stripa vpraša sama (`lib/racuni/uskladi.ts`). Potrdilo mora
// biti enako ne glede na to, katera je bila prva — in poslano sme biti
// natanko enkrat, kar zagotavlja pogoj na stanju pri obeh klicateljih.
//
// POŠTA NE SME PODRETI KLICATELJA. Webhook ob odgovoru, ki ni 200, dogodek
// ponovi; uskladitev teče med izrisom plačilne strani. V obeh primerih je
// napaka pri pošti vrstica v dnevniku in ne izjema.
// ============================================================================

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Ljubljana",
});

export async function posljiPotrdiloOPlacilu(racunId: string): Promise<void> {
  try {
    const racun = await prisma.racun.findUnique({
      where: { id: racunId },
      select: {
        epota: true,
        stranka: true,
        podjetje: true,
        stevilka: true,
        znesekCentov: true,
        valuta: true,
        placanoAt: true,
        vrsta: true,
      },
    });

    // Brez e-naslova potrdila ni komu poslati; račun je plačan in to je
    // pomembnejše od pisma.
    if (!racun?.epota) return;

    await posljiPredlogo({
      za: racun.epota,
      zadeva: `Plačilo prejeto — ${zneskovno(racun.znesekCentov, racun.valuta)}`,
      predloga: "potrdilo-placila",
      vsebina: PotrdiloPlacila({
        stranka: racun.podjetje ?? racun.stranka,
        stevilka: racun.stevilka,
        znesek: zneskovno(racun.znesekCentov, racun.valuta),
        datum: DATUM.format(racun.placanoAt ?? new Date()),
        naslednjiKorak:
          racun.vrsta === "PREDRACUN"
            ? "Z delom začnem takoj; javim se v enem delovnem dnevu."
            : "Nič več ni treba narediti. Za vprašanja o listini pokličite.",
      }),
    });
  } catch (e) {
    console.error("[racuni] potrdila ni bilo mogoče poslati:", e);
  }
}
