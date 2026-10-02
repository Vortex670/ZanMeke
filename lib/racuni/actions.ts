"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { zahtevajPrijavo } from "@/lib/auth/straza";
import { siteUrl } from "@/lib/config/siteUrl";
import { naslednjaStevilka } from "@/lib/racuni/queries";
import { racunSchema, vCente, type RacunInput } from "@/lib/racuni/validation";
import { prisma } from "@/lib/prisma";
import { getStripe, jeStripePripravljen } from "@/lib/stripe/client";
import type { ActionResult } from "@/lib/actions/helpers";

// ============================================================================
// lib/racuni/actions.ts — računi in plačilna povezava
// ----------------------------------------------------------------------------
// Dve vrsti dejanj, strogo ločeni:
//
//   • V ADMINU (ustvari, prekliči, označi za plačano) — za vsakim stoji
//     prijavljen človek.
//   • NA JAVNI STRANI (začni plačilo) — tu ni prijave, zato je edini ključ
//     žeton iz povezave. Ta ne sme biti ugotovljiv, zato je iz
//     `randomBytes(32)` in ne iz `cuid()`.
//
// Plačilo se NIKOLI ne potrdi tu. Da je Stripe uporabnika vrnil na »uspelo«,
// ne pomeni, da je denar prišel — kdor odpre povratni naslov na roko, bi si
// račun označil za plačanega sam. Edini vir resnice je webhook s podpisom.
// ============================================================================

function zeton(): string {
  return randomBytes(32).toString("base64url");
}

export async function ustvariRacunAction(
  vhod: RacunInput,
): Promise<ActionResult<{ id: string }>> {
  await zahtevajPrijavo();

  const razclenjen = racunSchema.safeParse(vhod);
  if (!razclenjen.success) {
    const napake: Record<string, string[]> = {};
    for (const n of razclenjen.error.issues) {
      const polje = String(n.path[0] ?? "_");
      (napake[polje] ??= []).push(n.message);
    }
    return { ok: false, message: "Preveri vnesene podatke.", fieldErrors: napake };
  }

  const d = razclenjen.data;
  const racun = await prisma.racun.create({
    data: {
      vrsta: d.vrsta,
      stevilka: await naslednjaStevilka(d.vrsta),
      stranka: d.stranka,
      podjetje: d.podjetje || null,
      epota: d.epota || null,
      opis: d.opis,
      znesekCentov: vCente(d.znesek),
      zapadlost: d.zapadlost ? new Date(d.zapadlost) : null,
      zeton: zeton(),
    },
    select: { id: true },
  });

  revalidatePath("/admin/racuni");
  return {
    ok: true,
    message:
      d.vrsta === "PREDRACUN" ? "Predračun je pripravljen." : "Račun je pripravljen.",
    data: racun,
  };
}

/** Račun gre iz osnutka v »poslan« — od tod naprej ga stranka lahko plača. */
export async function oznaciPoslanAction(id: string): Promise<ActionResult> {
  await zahtevajPrijavo();

  const racun = await prisma.racun.findUnique({
    where: { id },
    select: { stanje: true },
  });
  if (!racun) return { ok: false, message: "Tega računa ni." };
  if (racun.stanje === "PLACAN") return { ok: false, message: "Račun je že plačan." };

  await prisma.racun.update({
    where: { id },
    data: { stanje: "POSLAN", poslanoAt: new Date() },
  });

  revalidatePath("/admin/racuni");
  return { ok: true, message: "Račun je označen kot poslan." };
}

/**
 * Plačilo na roke — nakazilo na račun.
 *
 * Obstaja, ker vsi ne plačajo s kartico, in račun, ki je plačan z nakazilom,
 * mora iz seznama nerešenih. Datum je ta trenutek in ne datum nakazila; za
 * knjigovodstvo velja izpisek, tu gre za pregled.
 */
export async function oznaciPlacanAction(id: string): Promise<ActionResult> {
  await zahtevajPrijavo();

  await prisma.racun.update({
    where: { id },
    data: { stanje: "PLACAN", placanoAt: new Date() },
  });

  revalidatePath("/admin/racuni");
  return { ok: true, message: "Račun je označen kot plačan." };
}

export async function preklicIRacunAction(id: string): Promise<ActionResult> {
  await zahtevajPrijavo();

  const racun = await prisma.racun.findUnique({
    where: { id },
    select: { stanje: true },
  });
  if (racun?.stanje === "PLACAN") {
    return {
      ok: false,
      message: "Plačanega računa ni mogoče preklicati — za vračilo gre skozi Stripe.",
    };
  }

  await prisma.racun.update({ where: { id }, data: { stanje: "PREKLICAN" } });
  revalidatePath("/admin/racuni");
  return { ok: true, message: "Račun je preklican. Povezava ne dela več." };
}

/**
 * Izbriše listino — katero koli, tudi plačano.
 *
 * Moj pomislek stoji tu in ne v kodi, ki bi dejanje zaprla: plačan račun je
 * listina o prejetem denarju, Stripe ga pozna, in po brisanju se knjigovodstvo
 * razide s tem, kar piše na izpisku; za vračilo je prava pot skozi Stripe.
 *
 * Odločitev je lastnikova, zato dejanje ni zaprto. Potrditveno okno pri vsakem
 * stanju pove, kaj se izgubi.
 */
export async function izbrisiRacunAction(id: string): Promise<ActionResult> {
  await zahtevajPrijavo();

  const racun = await prisma.racun.findUnique({
    where: { id },
    select: { stanje: true, stevilka: true },
  });
  if (!racun) return { ok: false, message: "Tega računa ni." };

  await prisma.racun.delete({ where: { id } });

  revalidatePath("/admin/racuni");
  revalidatePath("/admin/racuni/arhiv");
  return { ok: true, message: `Listina ${racun.stevilka} je izbrisana.` };
}

/**
 * Z javne plačilne strani: odpre Stripovo blagajno in vrne naslov zanjo.
 *
 * Preusmeritve ne naredimo tu z `redirect()`, ampak vrnemo naslov in pusti
 * brskalniku, da gre nanj — tako se napaka (Stripe ne odgovarja) pokaže kot
 * sporočilo na strani in ne kot prazen zaslon sredi preusmerjanja.
 */
export async function zacniPlaciloAction(
  zetonRacuna: string,
): Promise<ActionResult<{ url: string }>> {
  if (!jeStripePripravljen()) {
    return { ok: false, message: "Kartično plačilo zaenkrat ni na voljo." };
  }

  const racun = await prisma.racun.findFirst({
    where: { zeton: zetonRacuna, stanje: { in: ["POSLAN", "OSNUTEK"] } },
  });
  if (!racun) {
    return { ok: false, message: "Ta povezava ne velja več." };
  }

  const osnova = siteUrl();
  const seja = await getStripe().checkout.sessions.create({
    mode: "payment",
    // Naslov je na računu, kadar ga poznamo — tako stranki ni treba
    // prepisovati e-pošte, Stripe pa ji pošlje potrdilo.
    customer_email: racun.epota ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: racun.valuta.toLowerCase(),
          unit_amount: racun.znesekCentov,
          product_data: {
            name: `Račun ${racun.stevilka}`,
            description: racun.opis,
          },
        },
      },
    ],
    // Po čem webhook ve, kateri račun je bil plačan. Brez tega bi ga bilo
    // treba iskati po znesku — in dva enaka zneska bi bila nerazločljiva.
    metadata: { racunId: racun.id, stevilka: racun.stevilka },
    success_url: `${osnova}/racun/${racun.zeton}?placano=1`,
    cancel_url: `${osnova}/racun/${racun.zeton}`,
  });

  if (!seja.url) {
    return { ok: false, message: "Blagajne ni bilo mogoče odpreti. Poskusite znova." };
  }

  await prisma.racun.update({
    where: { id: racun.id },
    data: { stripeSejaId: seja.id },
  });

  return { ok: true, data: { url: seja.url } };
}
