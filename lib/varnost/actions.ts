"use server";

import { revalidatePath } from "next/cache";

import { preveri, zasifriraj as zasifrirajGeslo } from "@/lib/auth/geslo";
import { steviPoskus } from "@/lib/auth/omejitev";
import { koncajSejo, odtisTrenutneSeje } from "@/lib/auth/seja";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import {
  beriSkrivnost,
  izdajRezervneKode,
  izklopi,
  novaSkrivnost,
  preveriKodo,
  shraniSkrivnost,
  totpNaslov,
} from "@/lib/auth/totp";
import { jeSifriranjePripravljeno } from "@/lib/auth/sifriranje";
import { napaka, uspeh, type ActionResult } from "@/lib/actions/helpers";
import { prisma } from "@/lib/prisma";
import { zapisiSled } from "@/lib/sled";
import {
  izbrisRacunaShema,
  sPotrditvijoGeslaShema,
  totpKodaShema,
  zamenjajGesloShema,
} from "@/lib/varnost/validation";

// ============================================================================
// lib/varnost/actions.ts — svoj račun ureja vsak sam
// ----------------------------------------------------------------------------
// Vsa dejanja na tej strani zahtevajo PRIJAVO IN GESLO, ne le prijave. Odprta
// administracija na nezaklenjenem računalniku ne sme zadoščati za zamenjavo
// gesla, izklop dvofaktorske prijave ali izbris računa — to so ravno dejanja,
// ki jih naredi nekdo, ki je sedel za tujo mizo.
//
// Ob zamenjavi gesla gredo vse DRUGE seje ven, trenutna pa ostane: kdor geslo
// menja zato, ker ga je kdo videl, hoče prav to — in noče se pri tem odjaviti
// sam.
// ============================================================================

function osvezi() {
  revalidatePath("/admin/varnost");
  revalidatePath("/admin/racun");
}

// ----------------------------------------------------------------------------
// Geslo
// ----------------------------------------------------------------------------

export async function zamenjajGesloAction(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  const uporabnik = await zahtevajPrijavo();

  const vhod = zamenjajGesloShema.safeParse({
    trenutno: podatki.get("trenutno"),
    novo: podatki.get("novo"),
    ponovi: podatki.get("ponovi"),
  });
  if (!vhod.success) {
    const polja: Record<string, string[]> = {};
    for (const t of vhod.error.issues) {
      (polja[String(t.path[0] ?? "obrazec")] ??= []).push(t.message);
    }
    return napaka("Preveri vnos.", polja);
  }

  // Omejitev tudi tu: ugibanje trenutnega gesla skozi ta obrazec je enako
  // uporabno kot ugibanje na prijavni strani.
  const omejitev = await steviPoskus(`geslo:${uporabnik.id}`, 5, 10);
  if (!omejitev.dovoljeno) {
    return napaka("Preveč poskusov. Počakaj deset minut.");
  }

  const zapis = await prisma.uporabnik.findUnique({
    where: { id: uporabnik.id },
    select: { geslo: true },
  });
  if (!zapis) return napaka("Računa ni več.");

  if (!(await preveri(zapis.geslo, vhod.data.trenutno))) {
    return napaka("Trenutno geslo ni pravilno.", { trenutno: ["Ni pravilno."] });
  }

  const odtis = await odtisTrenutneSeje();

  await prisma.$transaction([
    prisma.uporabnik.update({
      where: { id: uporabnik.id },
      data: { geslo: await zasifrirajGeslo(vhod.data.novo) },
    }),
    prisma.seja.deleteMany({
      where: {
        uporabnikId: uporabnik.id,
        ...(odtis ? { NOT: { zetonHash: odtis } } : {}),
      },
    }),
  ]);

  await zapisiSled({
    dejanje: "GESLO_SPREMENJENO",
    uporabnikId: uporabnik.id,
    tarca: "Uporabnik",
    oznaka: uporabnik.email,
  });

  osvezi();
  return uspeh("Geslo je spremenjeno. Druge naprave so odjavljene.");
}

// ----------------------------------------------------------------------------
// Dvofaktorska prijava
// ----------------------------------------------------------------------------

/**
 * Prvi korak: ustvari skrivnost in vrne naslov za kodo QR.
 *
 * Skrivnost se shrani TAKOJ, a z `totpPotrjenAt = null` — dokler človek ne
 * vpiše veljavne kode, 2FA ne velja. Brez tega bi se dalo vklopiti zaščito,
 * ki je generator nikoli ni prebral, in se zakleniti iz lastnega admina.
 */
export async function zacniVklopTotpAction(): Promise<
  ActionResult<{ naslov: string; skrivnost: string }>
> {
  const uporabnik = await zahtevajPrijavo();

  if (!jeSifriranjePripravljeno()) {
    return napaka(
      "Dvofaktorske prijave ni mogoče vklopiti: v okolju manjka ključ TOTP_KEY.",
    );
  }

  const skrivnost = novaSkrivnost();
  await shraniSkrivnost(uporabnik.id, skrivnost);

  osvezi();
  return uspeh(undefined, {
    naslov: totpNaslov(skrivnost, uporabnik.email),
    skrivnost,
  });
}

/** Drugi korak: koda iz generatorja. Ob uspehu izda rezervne kode. */
export async function potrdiVklopTotpAction(
  _prejsnje: ActionResult<{ kode: string[] }> | null,
  podatki: FormData,
): Promise<ActionResult<{ kode: string[] }>> {
  const uporabnik = await zahtevajPrijavo();

  const koda = totpKodaShema.safeParse(podatki.get("koda"));
  if (!koda.success) return napaka("Koda ima šest števk.", { koda: ["Šest števk."] });

  const omejitev = await steviPoskus(`totp-vklop:${uporabnik.id}`, 10, 10);
  if (!omejitev.dovoljeno) return napaka("Preveč poskusov. Počakaj deset minut.");

  const skrivnost = await beriSkrivnost(uporabnik.id);
  if (!skrivnost) return napaka("Vklop se je iztekel. Začni znova.");

  if (!preveriKodo(skrivnost, koda.data)) {
    return napaka("Koda ni pravilna. Preveri uro na telefonu.", {
      koda: ["Ni pravilna."],
    });
  }

  await prisma.uporabnik.update({
    where: { id: uporabnik.id },
    data: { totpPotrjenAt: new Date() },
  });
  const kode = await izdajRezervneKode(uporabnik.id);

  await zapisiSled({
    dejanje: "2FA_VKLOPLJENA",
    uporabnikId: uporabnik.id,
    tarca: "Uporabnik",
    oznaka: uporabnik.email,
  });

  osvezi();
  return uspeh("Dvofaktorska prijava je vklopljena.", { kode });
}

export async function izklopiTotpAction(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  const uporabnik = await zahtevajPrijavo();

  const vhod = sPotrditvijoGeslaShema.safeParse({ geslo: podatki.get("geslo") });
  if (!vhod.success) return napaka("Vpiši geslo.", { geslo: ["Vpiši geslo."] });

  const omejitev = await steviPoskus(`totp-izklop:${uporabnik.id}`, 5, 10);
  if (!omejitev.dovoljeno) return napaka("Preveč poskusov. Počakaj deset minut.");

  const zapis = await prisma.uporabnik.findUnique({
    where: { id: uporabnik.id },
    select: { geslo: true },
  });
  if (!zapis || !(await preveri(zapis.geslo, vhod.data.geslo))) {
    return napaka("Geslo ni pravilno.", { geslo: ["Ni pravilno."] });
  }

  await izklopi(uporabnik.id);
  await zapisiSled({
    dejanje: "2FA_IZKLOPLJENA",
    uporabnikId: uporabnik.id,
    tarca: "Uporabnik",
    oznaka: uporabnik.email,
  });

  osvezi();
  return uspeh("Dvofaktorska prijava je izklopljena.");
}

/** Nov komplet rezervnih kod — star preneha veljati. */
export async function noveRezervneKodeAction(
  _prejsnje: ActionResult<{ kode: string[] }> | null,
  podatki: FormData,
): Promise<ActionResult<{ kode: string[] }>> {
  const uporabnik = await zahtevajPrijavo();

  const vhod = sPotrditvijoGeslaShema.safeParse({ geslo: podatki.get("geslo") });
  if (!vhod.success) return napaka("Vpiši geslo.", { geslo: ["Vpiši geslo."] });

  const zapis = await prisma.uporabnik.findUnique({
    where: { id: uporabnik.id },
    select: { geslo: true, totpPotrjenAt: true },
  });
  if (!zapis?.totpPotrjenAt) return napaka("Dvofaktorska prijava ni vklopljena.");
  if (!(await preveri(zapis.geslo, vhod.data.geslo))) {
    return napaka("Geslo ni pravilno.", { geslo: ["Ni pravilno."] });
  }

  const kode = await izdajRezervneKode(uporabnik.id);
  await zapisiSled({
    dejanje: "2FA_REZERVNE_KODE",
    uporabnikId: uporabnik.id,
    tarca: "Uporabnik",
    oznaka: uporabnik.email,
  });

  osvezi();
  return uspeh("Izdane so nove kode. Stare ne veljajo več.", { kode });
}

// ----------------------------------------------------------------------------
// Naprave
// ----------------------------------------------------------------------------

export async function odjaviSejoAction(id: string): Promise<ActionResult> {
  const uporabnik = await zahtevajPrijavo();
  const odtis = await odtisTrenutneSeje();

  const seja = await prisma.seja.findUnique({
    where: { id },
    select: { uporabnikId: true, zetonHash: true },
  });
  if (!seja || seja.uporabnikId !== uporabnik.id) return napaka("Te seje ni.");
  if (odtis && seja.zetonHash === odtis) {
    return napaka("To je naprava, na kateri si zdaj.");
  }

  await prisma.seja.delete({ where: { id } });
  await zapisiSled({
    dejanje: "SEJA_ODJAVLJENA",
    uporabnikId: uporabnik.id,
    tarca: "Seja",
  });

  osvezi();
  return uspeh("Naprava je odjavljena.");
}

export async function odjaviOstaleSejeAction(): Promise<ActionResult> {
  const uporabnik = await zahtevajPrijavo();
  const odtis = await odtisTrenutneSeje();

  const izid = await prisma.seja.deleteMany({
    where: {
      uporabnikId: uporabnik.id,
      ...(odtis ? { NOT: { zetonHash: odtis } } : {}),
    },
  });

  osvezi();
  return uspeh(
    izid.count === 0
      ? "Drugih prijavljenih naprav ni bilo."
      : `Odjavljenih naprav: ${izid.count}.`,
  );
}

// ----------------------------------------------------------------------------
// Izbris računa
// ----------------------------------------------------------------------------

/**
 * Tri zapore, ker je to edino dejanje v administraciji, ki ga ni mogoče
 * razveljaviti:
 *
 *   1. GESLO — kdor sede za odprto administracijo, računa ne izbriše;
 *   2. PREPIS E-NASLOVA — brani pred klikom iz navade;
 *   3. ZADNJEGA RAČUNA NI MOGOČE IZBRISATI, sicer bi stran ostala brez
 *      vsakogar, ki bi se sploh lahko prijavil, in nazaj ne bi bilo poti.
 *
 * Računi strank, sporočila in listine ostanejo: niso last uporabniškega
 * računa in se hranijo po svojih rokih.
 */
export async function izbrisiMojRacunAction(
  _prejsnje: ActionResult | null,
  podatki: FormData,
): Promise<ActionResult> {
  const uporabnik = await zahtevajPrijavo();

  const vhod = izbrisRacunaShema.safeParse({
    geslo: podatki.get("geslo"),
    potrdilo: podatki.get("potrdilo"),
  });
  if (!vhod.success) {
    return napaka("Za potrditev prepiši svoj e-naslov.", {
      potrdilo: ["Ne ujema se."],
    });
  }

  if (vhod.data.potrdilo.trim().toLowerCase() !== uporabnik.email.toLowerCase()) {
    return napaka("Za potrditev prepiši svoj e-naslov.", {
      potrdilo: ["Ne ujema se z e-naslovom računa."],
    });
  }

  const zapis = await prisma.uporabnik.findUnique({
    where: { id: uporabnik.id },
    select: { geslo: true },
  });
  if (!zapis) return napaka("Računa ni več.");
  if (!(await preveri(zapis.geslo, vhod.data.geslo))) {
    return napaka("Geslo ni pravilno.", { geslo: ["Ni pravilno."] });
  }

  if ((await prisma.uporabnik.count()) <= 1) {
    return napaka(
      "To je edini račun. Najprej dodaj drugega, sicer bi stran ostala brez dostopa.",
    );
  }

  await zapisiSled({
    dejanje: "RACUN_IZBRISAN",
    uporabnikId: uporabnik.id,
    tarca: "Uporabnik",
    oznaka: uporabnik.email,
  });

  await prisma.$transaction([
    prisma.seja.deleteMany({ where: { uporabnikId: uporabnik.id } }),
    prisma.uporabnik.delete({ where: { id: uporabnik.id } }),
  ]);
  await koncajSejo();

  return uspeh("Račun je izbrisan.");
}
