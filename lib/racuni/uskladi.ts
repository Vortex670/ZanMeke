import "server-only";

import { posljiPotrdiloOPlacilu } from "@/lib/racuni/potrdilo";
import { prisma } from "@/lib/prisma";
import { getStripe, jeStripePripravljen } from "@/lib/stripe/client";

// ============================================================================
// lib/racuni/uskladi.ts — Stripa vprašamo sami
// ----------------------------------------------------------------------------
// WEBHOOK NI EDINA POT DO RESNICE, in ne sme biti. Dovolj je napačna podpisna
// skrivnost, izpad strežnika ali kratek izpad omrežja — in račun ostane
// neplačan, čeprav je denar že na računu. Ravno to se je zgodilo prvič, ko
// sva vklopila živa plačila: Stripe je poslal `checkout.session.completed`,
// podpis se ni ujemal, račun pa je ostal »poslan«.
//
// Webhook ostaja PRVA pot, ker pride sam in takoj. To je DRUGA: vprašamo
// Stripa za sejo, ki je zapisana na računu, in verjamemo njegovemu odgovoru.
// Kliče se tam, kjer je dvom največji — ko se stranka vrne z blagajne — in
// na pritisk v administraciji.
//
// Vrne `true` SAMO ob prvi spremembi. Tako potrdilo odide natanko enkrat,
// ne glede na to, katera pot je bila prva.
// ============================================================================

export async function uskladiSStripom(racunId: string): Promise<boolean> {
  if (!jeStripePripravljen()) return false;

  const racun = await prisma.racun.findUnique({
    where: { id: racunId },
    select: { stanje: true, stripeSejaId: true },
  });

  if (!racun?.stripeSejaId) return false;
  if (racun.stanje === "PLACAN") return false;

  try {
    const seja = await getStripe().checkout.sessions.retrieve(racun.stripeSejaId);
    if (seja.payment_status !== "paid") return false;

    // Isti pogoj na stanju kot v webhooku: če je bil račun medtem označen,
    // se ne zgodi nič in potrdilo ne odide dvakrat.
    const izid = await prisma.racun.updateMany({
      where: { id: racunId, stanje: { not: "PLACAN" } },
      data: {
        stanje: "PLACAN",
        placanoAt: new Date(),
        stripePlaciloId:
          typeof seja.payment_intent === "string" ? seja.payment_intent : null,
      },
    });

    if (izid.count === 0) return false;

    await posljiPotrdiloOPlacilu(racunId);
    return true;
  } catch (e) {
    // Stripe ne odgovori ali seje ni — račun ostane, kakršen je. Napačno
    // označen račun je dražja napaka od neoznačenega.
    console.error("[racuni] uskladitev s Stripom ni uspela:", e);
    return false;
  }
}
