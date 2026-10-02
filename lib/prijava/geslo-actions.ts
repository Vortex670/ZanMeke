"use server";

import { createHash, randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import GesloPonastavitev from "@/emails/GesloPonastavitev";
import { novoGesloShema, zahtevaGeslaShema } from "@/lib/prijava/validation";
import { napaka, runAction, uspeh, type ActionResult } from "@/lib/actions/helpers";
import { zasifriraj } from "@/lib/auth/geslo";
import { naslovIp, steviPoskus } from "@/lib/auth/omejitev";
import { posljiPredlogo } from "@/lib/posta/send";
import { prisma } from "@/lib/prisma";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// lib/prijava/geslo-actions.ts — pozabljeno geslo
// ----------------------------------------------------------------------------
// Dve pravili, ki se ju ne sme obiti:
//
//   1. Odgovor je VEDNO isti, tudi za neobstoječ e-naslov. Drugače je obrazec
//      seznam veljavnih računov, ki ga lahko kdorkoli prebere.
//   2. Žeton velja ENO URO in SAMO ENKRAT. Povezava iz pošte ostane v
//      poštnem predalu za vedno; brez roka bi bila trajen ključ.
//
// Ob uspešni ponastavitvi se pobrišejo VSE seje tega človeka. Če je nekdo
// geslo ponastavil zato, ker sumi, da mu je nekdo prišel do računa, mora ta
// nekdo iz vseh naprav takoj ven.
// ============================================================================

const VELJA_MINUT = 60;

const hash = (zeton: string) => createHash("sha256").update(zeton).digest("hex");

const ISTI_ODGOVOR =
  "Če ta e-naslov obstaja, je povezava za ponastavitev na poti. Velja eno uro.";

export async function zahtevajPonastavitev(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const vhod = zahtevaGeslaShema.safeParse({ email: podatki.get("email") });
    if (!vhod.success) {
      return napaka("Preveri vnos.", { email: [vhod.error.issues[0]!.message] });
    }

    // Obrazec pošlje PRAVO POŠTO na tuj naslov, zato je brez omejitve orodje
    // za nadlegovanje: nekdo lahko s klikanjem napolni predal komurkoli,
    // katerega naslov ugane. Meja je po naslovu IP, ker e-naslov sme biti
    // tudi napačen in ta pot ne sme izdati, kateri obstajajo.
    const omejitev = await steviPoskus(
      `ponastavitev:${(await naslovIp()) ?? "neznan"}`,
      5,
      60,
    );
    if (!omejitev.dovoljeno) {
      // Odgovor ostane ISTI kot ob uspehu: tudi meja ne sme izdati, ali
      // naslov obstaja.
      return uspeh(ISTI_ODGOVOR);
    }

    const uporabnik = await prisma.uporabnik.findUnique({
      where: { email: vhod.data.email },
      select: { id: true, email: true, ime: true },
    });

    // Odgovor je isti ne glede na obstoj računa — glej pravilo 1 zgoraj.
    if (!uporabnik) return uspeh(ISTI_ODGOVOR);

    const zeton = randomBytes(32).toString("base64url");
    await prisma.zetonGesla.create({
      data: {
        uporabnikId: uporabnik.id,
        zetonHash: hash(zeton),
        potece: new Date(Date.now() + VELJA_MINUT * 60_000),
      },
    });

    const naslov = process.env.NEXT_PUBLIC_SITE_URL ?? STRAN.url;
    const povezava = `${naslov}/prijava/geslo/${zeton}`;

    // Predloga in ne golo besedilo. Prej je bil tu svoj klic Resenda z
    // besedilom v nizu: sporočilo ni šlo skozi dnevnik pošte in ni bilo
    // videti kot nič drugega, kar ta stran pošlje. Predloga `emails/` je
    // obstajala že ves čas — samo nihče je ni poslal.
    const izid = await posljiPredlogo({
      za: uporabnik.email,
      zadeva: "Ponastavitev gesla",
      predloga: "geslo-ponastavitev",
      vsebina: GesloPonastavitev({
        ime: uporabnik.ime,
        ponastavitevUrl: povezava,
        veljavnost: "60 minut",
      }),
    });

    // Odgovor ostane isti tudi ob napaki: kdo ima račun in ali je pošta šla
    // skozi, sta dve stvari, ki ju obrazec ne sme izdati.
    if (!izid.ok) console.error("[geslo] pošta:", izid.napaka);
    return uspeh(ISTI_ODGOVOR);
  });
}

export async function nastaviNovoGeslo(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  const izid = await runAction(async () => {
    const vhod = novoGesloShema.safeParse({
      zeton: podatki.get("zeton"),
      geslo: podatki.get("geslo"),
      ponovi: podatki.get("ponovi"),
    });

    if (!vhod.success) {
      const polja: Record<string, string[]> = {};
      for (const t of vhod.error.issues) {
        const k = String(t.path[0] ?? "obrazec");
        (polja[k] ??= []).push(t.message);
      }
      return napaka("Preveri vnos.", polja);
    }

    const zapis = await prisma.zetonGesla.findUnique({
      where: { zetonHash: hash(vhod.data.zeton) },
      select: { id: true, uporabnikId: true, potece: true, porabljen: true },
    });

    if (!zapis || zapis.porabljen || zapis.potece < new Date()) {
      return napaka("Povezava je potekla ali je bila že uporabljena. Zahtevaj novo.");
    }

    await prisma.$transaction([
      prisma.uporabnik.update({
        where: { id: zapis.uporabnikId },
        data: { geslo: await zasifriraj(vhod.data.geslo) },
      }),
      prisma.zetonGesla.update({
        where: { id: zapis.id },
        data: { porabljen: new Date() },
      }),
      // Vse naprave ven — glej razlago na vrhu datoteke.
      prisma.seja.deleteMany({ where: { uporabnikId: zapis.uporabnikId } }),
    ]);

    return uspeh("Geslo je spremenjeno. Prijavi se z novim.");
  });

  if (izid.ok) redirect("/prijava?geslo=spremenjeno");
  return izid;
}
