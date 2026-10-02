"use server";

import { redirect } from "next/navigation";
import { prijavaShema } from "@/lib/prijava/validation";

import { napaka, runAction, type ActionResult } from "@/lib/actions/helpers";
import { beriCakajoco, koncajCakajoco, zacniCakajoco } from "@/lib/auth/cakajoca";
import { preveri } from "@/lib/auth/geslo";
import {
  cezKoliko,
  naslovIp,
  pocistiPoskuse,
  pocistiPoteklaOkna,
  steviPoskus,
} from "@/lib/auth/omejitev";
import { pocistiPotekle, koncajSejo, zacniSejo } from "@/lib/auth/seja";
import { beriSkrivnost, porabiRezervnoKodo, preveriKodo } from "@/lib/auth/totp";
import { rezervnaKodaShema } from "@/lib/varnost/validation";
import { prisma } from "@/lib/prisma";
import { zapisiSled } from "@/lib/sled";

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
//
// POSKUSI SO OMEJENI po naslovu IP in po e-naslovu. Prej niso bili: tabela
// `omejitve_poskusov` je stala v shemi, uporabljala je ni nobena koda, in
// geslo je bilo mogoče ugibati tako hitro, kot zmore omrežje. V adminu so
// računi strank in njihovi osebni podatki.
//
// Meja po e-naslovu je ohlapnejša od tiste po naslovu IP, ker bi ostra meja
// pomenila, da me lahko kdorkoli zaklene iz lastnega admina — zaklepanje
// računa je obramba, ki jo je mogoče obrniti v napad.
//
// DVOFAKTORSKA PRIJAVA: kadar je vklopljena, pravilno geslo NE odpre seje,
// ampak samo čakajoče stanje (`lib/auth/cakajoca.ts`), in prijava se dokonča
// s kodo na `/prijava/koda`.
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

    // ── Omejitev poskusov ────────────────────────────────────────────────
    const ip = await naslovIp();
    const kljucIp = `prijava:ip:${ip ?? "neznan"}`;
    const kljucEpote = `prijava:epota:${vhod.data.email}`;

    const poIp = await steviPoskus(kljucIp, 10, 15);
    if (!poIp.dovoljeno) {
      return napaka(
        `Preveč poskusov s tega naslova. Poskusi ${cezKoliko(poIp.cezSekund)}.`,
      );
    }
    const poEpoti = await steviPoskus(kljucEpote, 20, 60);
    if (!poEpoti.dovoljeno) {
      return napaka(
        `Preveč poskusov za ta račun. Poskusi ${cezKoliko(poEpoti.cezSekund)}.`,
      );
    }

    const uporabnik = await prisma.uporabnik.findUnique({
      where: { email: vhod.data.email },
      select: { id: true, geslo: true, email: true, totpPotrjenAt: true },
    });

    const ujema = await preveri(uporabnik?.geslo ?? PRAZEN_ZAPIS, vhod.data.geslo);
    if (!uporabnik || !ujema) {
      await zapisiSled({
        dejanje: "PRIJAVA_NEUSPEH",
        oznaka: vhod.data.email,
        tarca: "Uporabnik",
      });
      return napaka("Napačen e-naslov ali geslo.");
    }

    // ── Drugi korak, kadar je 2FA vklopljena ─────────────────────────────
    // Seje tu NE odpremo: polovica prijave, ki bi se dala uporabiti kot cela,
    // je slabša od odsotnosti dvofaktorske prijave.
    if (uporabnik.totpPotrjenAt) {
      await zacniCakajoco(uporabnik.id);
      return { ok: true as const, message: "2FA", data: "koda" as const };
    }

    await pocistiPoskuse([kljucIp, kljucEpote]);
    await pocistiPoteklaOkna();
    await pocistiPotekle();
    // Brez kljukice traja seja do zaprtja brskalnika — tako je prav na tuji
    // napravi. S kljukico trideset dni, kar je prav na svojem telefonu.
    await zacniSejo(uporabnik.id, podatki.get("zapomni") === "on");
    await prisma.uporabnik.update({
      where: { id: uporabnik.id },
      data: { zadnjaPrijava: new Date() },
    });
    await zapisiSled({
      dejanje: "PRIJAVA_USPEH",
      uporabnikId: uporabnik.id,
      tarca: "Uporabnik",
      oznaka: uporabnik.email,
    });

    return { ok: true as const, message: "Prijavljen." };
  }, "Prijava trenutno ne dela. Poskusi čez minuto.");

  // Preusmeritev MORA biti zunaj `runAction`: Next jo izvede tako, da vrže
  // posebno napako, in lovilec v ovoju bi jo pogoltnil kot okvaro.
  if (izid.ok) {
    // Čakajoča prijava pelje na vnos kode in ne v administracijo.
    if (izid.data === "koda") {
      const kam = String(podatki.get("next") ?? "");
      redirect(
        kam.startsWith("/") && !kam.startsWith("//")
          ? `/prijava/koda?next=${encodeURIComponent(kam)}`
          : "/prijava/koda",
      );
    }
    const kam = String(podatki.get("next") ?? "/admin");
    redirect(kam.startsWith("/") && !kam.startsWith("//") ? kam : "/admin");
  }
  return izid;
}

/**
 * Drugi korak prijave — koda iz generatorja ali rezervna koda.
 *
 * Čakajoče stanje je podpisan piškotek s petminutno veljavnostjo. Če ga ni,
 * prijave ni mogoče dokončati in človek se vrne na začetek: brez tega bi se
 * dalo priti do seje samo s kodo, brez gesla.
 */
export async function potrdiKodo(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  const izid = await runAction(async () => {
    const uporabnikId = await beriCakajoco();
    if (!uporabnikId) {
      return napaka("Prijava se je iztekla. Začni znova.");
    }

    const vnos = String(podatki.get("koda") ?? "").trim();
    if (!vnos) return napaka("Vpiši kodo.", { koda: ["Vpiši kodo."] });

    // Omejitev je tu NUJNA: šestmestna koda ima milijon možnosti in brez
    // zavore jo je mogoče uganiti v nekaj minutah.
    const omejitev = await steviPoskus(`2fa:${uporabnikId}`, 8, 10);
    if (!omejitev.dovoljeno) {
      await koncajCakajoco();
      return napaka(
        `Preveč poskusov. Prijavi se znova ${cezKoliko(omejitev.cezSekund)}.`,
      );
    }

    const uporabnik = await prisma.uporabnik.findUnique({
      where: { id: uporabnikId },
      select: { id: true, email: true, totpPotrjenAt: true },
    });
    if (!uporabnik?.totpPotrjenAt) return napaka("Prijava se je iztekla. Začni znova.");

    const skrivnost = await beriSkrivnost(uporabnik.id);
    const jeRezervna = rezervnaKodaShema.safeParse(vnos);

    const velja = jeRezervna.success
      ? await porabiRezervnoKodo(uporabnik.id, jeRezervna.data)
      : Boolean(skrivnost) && preveriKodo(skrivnost!, vnos);

    if (!velja) {
      await zapisiSled({
        dejanje: "PRIJAVA_NEUSPEH",
        uporabnikId: uporabnik.id,
        oznaka: uporabnik.email,
        podatki: { korak: "2fa" },
      });
      return napaka("Koda ni pravilna.", { koda: ["Ni pravilna."] });
    }

    await koncajCakajoco();
    await pocistiPoskuse([`2fa:${uporabnik.id}`]);
    await pocistiPotekle();
    await zacniSejo(uporabnik.id, podatki.get("zapomni") === "on");
    await prisma.uporabnik.update({
      where: { id: uporabnik.id },
      data: { zadnjaPrijava: new Date() },
    });
    await zapisiSled({
      dejanje: "PRIJAVA_USPEH",
      uporabnikId: uporabnik.id,
      tarca: "Uporabnik",
      oznaka: uporabnik.email,
      podatki: { korak: "2fa", rezervna: jeRezervna.success },
    });

    return { ok: true as const, message: "Prijavljen." };
  }, "Prijava trenutno ne dela. Poskusi čez minuto.");

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
