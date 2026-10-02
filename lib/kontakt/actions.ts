"use server";

import { Resend } from "resend";

import { napaka, runAction, uspeh, type ActionResult } from "@/lib/actions/helpers";
import { ZANIMANJE_NAPIS, povprasevanjeSchema } from "@/lib/kontakt/validation";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// lib/kontakt/actions.ts — povpraševanje pride do Žana
// ----------------------------------------------------------------------------
// Pot sporočila: obrazec → ta akcija → Zod → Resend → poštni predal.
//
// `replyTo` je nastavljen na obiskovalca, kadar je pustil e-naslov: na
// sporočilo se odgovori s pritiskom na Odgovori, brez prepisovanja naslova.
//
// Sporočilo je NAVADNO BESEDILO in ne HTML. Povpraševanje se bere na telefonu
// med delom; oblikovana pošta tam ne pomaga, zanesljivo dostavljena pa.
//
// Če ključa za pošto ni (razvoj), se sporočilo izpiše v dnevnik in akcija
// uspe. Tako se obrazec da preizkusiti, ne da bi komu kaj poslali.
// ============================================================================

const PREDAL = process.env.CONTACT_TO_EMAIL ?? STRAN.epota;
const POSILJATELJ = process.env.RESEND_FROM_EMAIL ?? `Žan Meke <${STRAN.epota}>`;

export async function posljiPovprasevanje(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const vhod = povprasevanjeSchema.safeParse({
      ime: podatki.get("ime"),
      podjetje: podatki.get("podjetje") ?? undefined,
      telefon: podatki.get("telefon"),
      epota: podatki.get("epota") ?? undefined,
      zanimanje: podatki.get("zanimanje"),
      sporocilo: podatki.get("sporocilo"),
      podjetjeUrl: podatki.get("podjetjeUrl") ?? undefined,
    });

    if (!vhod.success) {
      const polja: Record<string, string[]> = {};
      for (const t of vhod.error.issues) {
        const kljuc = String(t.path[0] ?? "obrazec");
        (polja[kljuc] ??= []).push(t.message);
      }
      // Past za bote nima svojega sporočila — bot naj ne izve, kje se je ujel.
      if (polja.podjetjeUrl) return uspeh("Hvala, sporočilo je oddano.");
      return napaka("Nekaj polj je treba popraviti.", polja);
    }

    const v = vhod.data;
    const vrstice = [
      `Ime: ${v.ime}`,
      v.podjetje ? `Podjetje: ${v.podjetje}` : null,
      `Telefon: ${v.telefon}`,
      v.epota ? `E-pošta: ${v.epota}` : null,
      `Zanima: ${ZANIMANJE_NAPIS[v.zanimanje]}`,
      "",
      v.sporocilo,
      "",
      `— poslano z ${STRAN.domena}`,
    ]
      .filter(Boolean)
      .join("\n");

    const kljuc = process.env.RESEND_API_KEY;
    if (!kljuc) {
      console.warn("[kontakt] RESEND_API_KEY ni nastavljen; sporočilo samo v dnevnik");
      console.info(vrstice);
      return uspeh("Hvala, sporočilo je oddano. Oglasim se isti dan.");
    }

    const resend = new Resend(kljuc);
    const { error } = await resend.emails.send({
      from: POSILJATELJ,
      to: PREDAL,
      subject: `Povpraševanje — ${v.ime}${v.podjetje ? `, ${v.podjetje}` : ""}`,
      text: vrstice,
      ...(v.epota ? { replyTo: v.epota } : {}),
    });

    if (error) {
      console.error("[kontakt] Resend:", error);
      return napaka(
        `Sporočila ni bilo mogoče poslati. Pokličite na ${STRAN.telefon} — odgovorim takoj.`,
      );
    }

    return uspeh("Hvala, sporočilo je oddano. Oglasim se isti dan.");
  });
}
