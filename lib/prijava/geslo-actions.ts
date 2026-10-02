"use server";

import { createHash, randomBytes } from "node:crypto";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { z } from "zod";

import { napaka, runAction, uspeh, type ActionResult } from "@/lib/actions/helpers";
import { zasifriraj } from "@/lib/auth/geslo";
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

const zahtevaShema = z.object({
  email: z.string().trim().toLowerCase().email("Vpiši veljaven e-naslov."),
});

const novoShema = z
  .object({
    zeton: z.string().min(10),
    geslo: z.string().min(12, "Geslo naj ima vsaj 12 znakov."),
    ponovi: z.string(),
  })
  .refine((v) => v.geslo === v.ponovi, {
    path: ["ponovi"],
    message: "Gesli se ne ujemata.",
  });

const ISTI_ODGOVOR =
  "Če ta e-naslov obstaja, je povezava za ponastavitev na poti. Velja eno uro.";

export async function zahtevajPonastavitev(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const vhod = zahtevaShema.safeParse({ email: podatki.get("email") });
    if (!vhod.success) {
      return napaka("Preveri vnos.", { email: [vhod.error.issues[0]!.message] });
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
    const kljuc = process.env.RESEND_API_KEY;

    if (!kljuc) {
      console.warn("[geslo] RESEND_API_KEY ni nastavljen; povezava samo v dnevnik");
      console.info(povezava);
      return uspeh(ISTI_ODGOVOR);
    }

    const resend = new Resend(kljuc);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? `Žan Meke <${STRAN.epota}>`,
      to: uporabnik.email,
      subject: "Ponastavitev gesla",
      text: [
        `Pozdravljen, ${uporabnik.ime}.`,
        "",
        "Povezava za ponastavitev gesla (velja eno uro in samo enkrat):",
        povezava,
        "",
        "Če tega nisi zahteval ti, sporočila ne upoštevaj — geslo ostane isto.",
      ].join("\n"),
    });

    if (error) console.error("[geslo] Resend:", error);
    return uspeh(ISTI_ODGOVOR);
  });
}

export async function nastaviNovoGeslo(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  const izid = await runAction(async () => {
    const vhod = novoShema.safeParse({
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
