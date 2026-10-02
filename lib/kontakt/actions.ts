"use server";


import PovprasevanjePotrditev from "@/emails/PovprasevanjePotrditev";
import PovprasevanjePrejeto from "@/emails/PovprasevanjePrejeto";
import { napaka, runAction, uspeh, type ActionResult } from "@/lib/actions/helpers";
import { ZANIMANJE_NAPIS, povprasevanjeSchema } from "@/lib/kontakt/validation";
import { STRAN } from "@/lib/podatki";
import { posljiPredlogo } from "@/lib/posta/send";
import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/kontakt/actions.ts — povpraševanje pride do Žana
// ----------------------------------------------------------------------------
// Pot sporočila: obrazec → ta akcija → Zod → Resend → poštni predal.
//
// `replyTo` je nastavljen na obiskovalca, kadar je pustil e-naslov: na
// sporočilo se odgovori s pritiskom na Odgovori, brez prepisovanja naslova.
//
// Pošteta gresta DVE: meni obvestilo s podatki, stranki potrdilo, da je
// povpraševanje prispelo. Drugo je pomembnejše, kot zveni — kdor odda obrazec
// in ne dobi ničesar, čez pol ure ne ve, ali je šlo skozi, in pokliče
// konkurenco. Potrdilo gre samo, če je pustil e-naslov; ta ni obvezen.
//
// Obe gresta skozi predlogo iz `emails/`. Prej je bilo obvestilo `<pre>` z
// golim besedilom, potrdila pa sploh ni bilo.
//
// Če ključa za pošto ni (razvoj), se sporočilo izpiše v dnevnik in akcija
// uspe. Tako se obrazec da preizkusiti, ne da bi komu kaj poslali.
// ============================================================================

const PREDAL = process.env.CONTACT_TO_EMAIL ?? STRAN.epota;

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

    // NAJPREJ V BAZO, šele potem pošta. E-pošta zna odpovedati — tiho in brez
    // sledi; povpraševanje pa je edina stvar, zaradi katere ta stran stoji, in
    // se ne sme izgubiti zaradi tuje storitve.
    const zapis = await prisma.sporocilo.create({
      data: {
        ime: v.ime,
        podjetje: v.podjetje || null,
        telefon: v.telefon,
        epota: v.epota || null,
        zanimanje: v.zanimanje,
        sporocilo: v.sporocilo,
      },
      select: { id: true },
    });

    // Pošta gre skozi ENA VRATA (`lib/posta/send.ts`), kjer se vsak poskus
    // zapiše v dnevnik — tudi neuspel in tudi preskočen, ker ključa ni.
    // Prej je bil klic Resenda tu in o njem ni ostalo sledi nikjer.
    const izid = await posljiPredlogo({
      za: PREDAL,
      zadeva: `Povpraševanje — ${v.ime}${v.podjetje ? `, ${v.podjetje}` : ""}`,
      predloga: "povprasevanje-prejeto",
      vsebina: PovprasevanjePrejeto({
        ime: v.ime,
        ...(v.podjetje ? { podjetje: v.podjetje } : {}),
        telefon: v.telefon,
        ...(v.epota ? { epota: v.epota } : {}),
        zanimanje: ZANIMANJE_NAPIS[v.zanimanje],
        sporocilo: v.sporocilo,
      }),
      ...(v.epota ? { odgovorNa: v.epota } : {}),
    });

    if (!izid.ok) {
      // Zapis ostane v adminu z oznako, da obvestilo ni odšlo — sporočilo
      // torej ni izgubljeno, tudi če pošta pade.
      return napaka(
        `Sporočila ni bilo mogoče poslati. Pokličite na ${STRAN.telefon} — odgovorim takoj.`,
      );
    }

    // »Poslano« pomeni, da je pošta res odšla; preskočena (razvoj) to ni.
    if (!izid.preskoceno) {
      await prisma.sporocilo.update({
        where: { id: zapis.id },
        data: { poslano: true },
      });
    }

    // Potrdilo stranki — ločeno od obvestila meni in NAMENOMA brez vpliva na
    // izid. Če potrdilo ne gre skozi, povpraševanje vseeno stoji v adminu in
    // obrazec ne sme javiti napake za nekaj, kar je stranka že opravila.
    if (v.epota) {
      const potrdilo = await posljiPredlogo({
        za: v.epota,
        zadeva: "Vaše povpraševanje je prispelo",
        predloga: "povprasevanje-potrditev",
        vsebina: PovprasevanjePotrditev({ ime: v.ime, telefon: STRAN.telefon }),
      });
      if (!potrdilo.ok) console.error("[kontakt] potrdilo:", potrdilo.napaka);
    }

    return uspeh("Hvala, sporočilo je oddano. Oglasim se isti dan.");
  });
}
