"use server";

import { redirect } from "next/navigation";
import { prijavaShema } from "@/lib/prijava/validation";

import { napaka, runAction, type ActionResult } from "@/lib/actions/helpers";
import { preveri } from "@/lib/auth/geslo";
import { pocistiPotekle, koncajSejo, zacniSejo } from "@/lib/auth/seja";
import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/prijava/actions.ts
// ----------------------------------------------------------------------------
// Pri napačni prijavi je sporočilo VEDNO isto — »napačen e-naslov ali geslo«.
// Če bi program povedal, kateri od obeh je narobe, bi s tem potrdil, kateri
// e-naslovi obstajajo.
//
// Primerjava gesla teče tudi takrat, kadar uporabnika ni. Brez tega bi bil
// odgovor za neobstoječ račun opazno hitrejši in bi se dalo iz časa sklepati,
// kateri računi obstajajo.
// ============================================================================

/** Lažen zapis za primerjavo, kadar uporabnika ni — izenači čas odgovora. */
const PRAZEN_ZAPIS =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$3Nt5V4qH2kqJ5wQ0z4bQbLZ0M7V8f8y1l7jX9W0nX0s";

export async function prijavi(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  const izid = await runAction(async () => {
    const vhod = prijavaShema.safeParse({
      email: podatki.get("email"),
      geslo: podatki.get("geslo"),
    });

    if (!vhod.success) {
      const polja: Record<string, string[]> = {};
      for (const t of vhod.error.issues) {
        const k = String(t.path[0] ?? "obrazec");
        (polja[k] ??= []).push(t.message);
      }
      return napaka("Preveri vnos.", polja);
    }

    const uporabnik = await prisma.uporabnik.findUnique({
      where: { email: vhod.data.email },
    });

    const ujema = await preveri(uporabnik?.geslo ?? PRAZEN_ZAPIS, vhod.data.geslo);
    if (!uporabnik || !ujema) {
      return napaka("Napačen e-naslov ali geslo.");
    }

    await pocistiPotekle();
    // Brez kljukice traja seja do zaprtja brskalnika — tako je prav na tuji
    // napravi. S kljukico trideset dni, kar je prav na svojem telefonu.
    await zacniSejo(uporabnik.id, podatki.get("zapomni") === "on");
    await prisma.uporabnik.update({
      where: { id: uporabnik.id },
      data: { zadnjaPrijava: new Date() },
    });

    return { ok: true as const, message: "Prijavljen." };
  }, "Prijava trenutno ne dela. Poskusi čez minuto.");

  // Preusmeritev MORA biti zunaj `runAction`: Next jo izvede tako, da vrže
  // posebno napako, in lovilec v ovoju bi jo pogoltnil kot okvaro.
  if (izid.ok) {
    const kam = String(podatki.get("next") ?? "/admin");
    redirect(kam.startsWith("/") && !kam.startsWith("//") ? kam : "/admin");
  }
  return izid;
}

export async function odjavi(): Promise<void> {
  await koncajSejo();
  redirect("/prijava");
}
