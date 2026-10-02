"use server";

import { createHash, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import type { ActionResult } from "@/lib/actions/helpers";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import { prisma } from "@/lib/prisma";
import { PISKOTEK_PRIVOLITVE } from "@/lib/privolitev";

// ============================================================================
// Beleženje obiska
// ----------------------------------------------------------------------------
// Svoja analitika in ne Google Analytics. Trije razlogi, vsi praktični:
//
// 1. Brez soglasja za piškotke. Piškotek je prve stranke, naključna oznaka,
//    nič deljenega s tujimi strežniki — pasica, ki jo mora obiskovalec
//    odkljukati, preden vidi stran, je prva ovira med njim in klicem.
// 2. Številke so v isti bazi kot povpraševanja, zato se da povedati, koliko
//    obiskov je dalo klic. Pri Googlu sta to dva ločena svetova.
// 3. Nič ne upočasni strani: ena vrstica v bazo, brez tujih skriptov.
//
// NASLOVA IP NE HRANIMO. Odtis (SHA-256, skrajšan) služi edinole temu, da
// isti človek v drugem oknu ne šteje dvakrat; iz njega se naslova ne da
// dobiti nazaj, soli pa ne shranjujemo nikjer drugje.
// ============================================================================

const PISKOTEK = "zm_obisk";
const DNI = 180;
/** Nov obisk po pol ure mirovanja — tako šteje tudi večina orodij. */
const PRESLEDEK_MIN = 30;

function odtis(ip: string | null, agent: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256")
    .update(`${ip}|${agent ?? ""}|zanmeke`)
    .digest("hex")
    .slice(0, 32);
}

/** Groba razpoznava naprave iz niza brskalnika — dovolj za »telefon ali ne«. */
function razberi(agent: string) {
  const a = agent.toLowerCase();
  const naprava = /mobile|android|iphone|ipod/.test(a)
    ? "telefon"
    : /ipad|tablet/.test(a)
      ? "tablica"
      : "računalnik";
  const os = /iphone|ipad|ios/.test(a)
    ? "iOS"
    : /android/.test(a)
      ? "Android"
      : /mac os|macintosh/.test(a)
        ? "macOS"
        : /windows/.test(a)
          ? "Windows"
          : /linux/.test(a)
            ? "Linux"
            : null;
  // Vrstni red šteje: Edge se predstavlja kot Chrome, Chrome kot Safari.
  const brskalnik = /edg\//.test(a)
    ? "Edge"
    : /opr\//.test(a)
      ? "Opera"
      : /chrome\//.test(a)
        ? "Chrome"
        : /firefox\//.test(a)
          ? "Firefox"
          : /safari\//.test(a)
            ? "Safari"
            : null;
  return { naprava, os, brskalnik };
}

/** Pajki ne štejejo med obiskovalce — sicer je polovica obiska Googlov robot. */
function jePajek(agent: string): boolean {
  return /bot|crawler|spider|crawling|headless|lighthouse|preview|facebookexternalhit|slurp/i.test(
    agent,
  );
}

export async function zabeleziOgled(pot: string, naslov?: string): Promise<void> {
  try {
    const glave = await headers();
    const agent = glave.get("user-agent") ?? "";
    if (jePajek(agent)) return;

    const ip =
      glave.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      glave.get("x-real-ip") ??
      null;

    const piskotki = await cookies();

    // BREZ PRIVOLITVE SE NE ZAPIŠE NIČ. Odjemalec lahko laže ali pa se pas
    // sploh ne izriše (blokirnik, star predpomnilnik); zapis v bazo sme
    // nastati samo, kadar privolitev res stoji. Prvi obisk je zato vedno
    // neizmerjen — to je cena pravilnega vprašanja.
    if (piskotki.get(PISKOTEK_PRIVOLITVE)?.value !== "da") return;

    let anonId = piskotki.get(PISKOTEK)?.value;
    if (!anonId) {
      anonId = randomUUID();
      piskotki.set(PISKOTEK, anonId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * DNI,
        path: "/",
      });
    }

    const { naprava, os, brskalnik } = razberi(agent);
    const zdaj = new Date();

    const obiskovalec = await prisma.obiskovalec.upsert({
      where: { anonId },
      create: {
        anonId,
        naprava,
        os,
        brskalnik,
        jezik: glave.get("accept-language")?.split(",")[0] ?? null,
        ipHash: odtis(ip, agent),
      },
      update: { zadnjiObisk: zdaj },
    });

    // Zadnji obisk, če še teče; sicer nov. Brez tega je vsak ogled svoj
    // obisk in »strani na obisk« je vedno 1.
    const meja = new Date(zdaj.getTime() - PRESLEDEK_MIN * 60_000);
    const tekoci = await prisma.obisk.findFirst({
      where: { obiskovalecId: obiskovalec.id, zacetek: { gte: meja } },
      orderBy: { zacetek: "desc" },
      select: { id: true },
    });

    const vir = glave.get("referer");
    const obisk =
      tekoci ??
      (await prisma.obisk.create({
        data: {
          obiskovalecId: obiskovalec.id,
          // Vir zapišemo SAMO ob prvem dotiku in le, če ni z naše strani.
          vir: vir && !vir.includes("zanmeke.com") ? vir : null,
          vstopnaPot: pot,
        },
        select: { id: true },
      }));

    await prisma.ogledStrani.create({
      data: { obiskId: obisk.id, pot, naslov: naslov ?? null },
    });
  } catch {
    // Analitika ne sme nikoli podreti strani. Če zapis ne gre, ga ni —
    // obiskovalec od tega ne sme videti ničesar.
  }
}

/** Dogodek, ki ni ogled: klik na telefon, oddano povpraševanje. */
export async function zabeleziDogodek(
  ime: string,
  pot?: string,
  podatki?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    const piskotki = await cookies();
    if (piskotki.get(PISKOTEK_PRIVOLITVE)?.value !== "da") return;

    const anonId = piskotki.get(PISKOTEK)?.value;
    if (!anonId) return;

    const obiskovalec = await prisma.obiskovalec.findUnique({
      where: { anonId },
      select: { id: true },
    });
    if (!obiskovalec) return;

    const obisk = await prisma.obisk.findFirst({
      where: { obiskovalecId: obiskovalec.id },
      orderBy: { zacetek: "desc" },
      select: { id: true },
    });
    if (!obisk) return;

    await prisma.dogodek.create({
      data: { obiskId: obisk.id, ime, pot: pot ?? null, podatki: podatki ?? undefined },
    });
  } catch {
    // Isto kot zgoraj.
  }
}

// ----------------------------------------------------------------------------
// Ponastavitev
// ----------------------------------------------------------------------------

/**
 * Izbriše vse zabeležene obiske.
 *
 * Pred zagonom so v tabelah obiski tistega, ki je stran gradil: preizkusi,
 * ista stran odprta desetkrat zapored, klici z razvojnega strežnika. Prvi
 * mesec prave statistike bi imel v sebi ves ta šum.
 *
 * Dejanje je dokončno — prejšnjih obiskov ni od kod dobiti nazaj. Zato ga
 * sme sprožiti samo prijavljen človek (strežnik preveri sam; skrit gumb ni
 * zaščita) in zato ga spremlja potrditveno okno.
 *
 * Povpraševanj se NE dotakne: ta so edino, česar si ni mogoče povrniti z
 * nobenim ponovnim obiskom.
 */
export async function ponastaviStatistikoAction(): Promise<ActionResult> {
  await zahtevajPrijavo();

  // Vrstni red šteje tudi ob `onDelete: Cascade`: dogodki in ogledi visijo
  // na obiskih, obiski na obiskovalcih. Brisanje od spodaj navzgor je isto
  // delo, a se ne zanaša na kaskado.
  const [dogodki, ogledi, obiski, obiskovalci] = await prisma.$transaction([
    prisma.dogodek.deleteMany({}),
    prisma.ogledStrani.deleteMany({}),
    prisma.obisk.deleteMany({}),
    prisma.obiskovalec.deleteMany({}),
  ]);

  revalidatePath("/admin/statistike");
  revalidatePath("/admin");

  return {
    ok: true,
    message: `Izbrisanih ${ogledi.count} ogledov, ${obiski.count} obiskov in ${obiskovalci.count} obiskovalcev.${
      dogodki.count > 0 ? ` Ter ${dogodki.count} dogodkov.` : ""
    }`,
  };
}
