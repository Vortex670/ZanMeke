import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import PotrdiloPlacila from "@/emails/PotrdiloPlacila";
import { posljiPredlogo } from "@/lib/posta/send";
import { zneskovno } from "@/lib/racuni/validation";

import { prisma } from "@/lib/prisma";
import {
  getStripe,
  jeStripePripravljen,
  STRIPE_WEBHOOK_SECRET,
} from "@/lib/stripe/client";

// ============================================================================
// POST /api/stripe/webhook — Stripe pove, da je bilo plačano
// ----------------------------------------------------------------------------
// EDINO MESTO, kjer račun postane plačan. Povratni naslov po plačilu tega ne
// sme narediti: kdor ga odpre na roko, bi si račun označil za plačanega sam.
//
// POT SE UJEMA S TISTO, KI JE ŽE VPISANA PRI STRIPU. Končna točka v živem
// načinu obstaja od maja 2026 in kaže na `/api/stripe/webhook`; pot je zato
// prestavljena sem, namesto da bi spreminjal nastavitev plačil, ki že dela.
//
// Stripe → Developers → Webhooks:
//   URL:     https://zanmeke.com/api/stripe/webhook
//   Dogodki: checkout.session.completed,
//            checkout.session.async_payment_succeeded,
//            checkout.session.expired
//   Podpisno skrivnost (`whsec_…`) v `STRIPE_WEBHOOK_SECRET`.
//
// Trije varovalni koraki:
//   1. PODPIS. Brez njega bi lahko kdorkoli poslal »plačano« za tuj račun.
//   2. ENKRATNOST. Stripe isti dogodek ob negotovi dostavi pošlje večkrat;
//      zapis v `stripe_dogodki` poskrbi, da se obdela natanko enkrat.
//   3. ODGOVOR 200 TUDI OB NAPAKI obdelave — sicer Stripe poskuša znova in
//      znova. Napaka se zapiše k dogodku, da se vidi, kaj je padlo.
//
// `route.ts` je tu na mestu in ne strežniško dejanje: klicatelj je zunanji
// strežnik, ne naša stran.
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!jeStripePripravljen() || !STRIPE_WEBHOOK_SECRET) {
    console.error(
      "[stripe] webhook ni nastavljen (manjka ključ ali podpisna skrivnost).",
    );
    return NextResponse.json({ error: "Webhook ni nastavljen" }, { status: 500 });
  }

  // Telo mora biti SUROVO — podpis se računa čez bajte, kakršni so prišli.
  // `req.json()` bi jih prej razčlenil in podpis se ne bi ujemal.
  const telo = await req.text();
  const podpis = req.headers.get("stripe-signature");
  if (!podpis) {
    return NextResponse.json({ error: "Manjka podpis" }, { status: 400 });
  }

  let dogodek: Stripe.Event;
  try {
    dogodek = getStripe().webhooks.constructEvent(telo, podpis, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("[stripe] podpis se ne ujema:", e);
    return NextResponse.json({ error: "Neveljaven podpis" }, { status: 400 });
  }

  // ── Enkratnost ──────────────────────────────────────────────────────────
  try {
    const obstojec = await prisma.stripeDogodek.findUnique({
      where: { dogodekId: dogodek.id },
      select: { obdelanoAt: true },
    });
    if (obstojec?.obdelanoAt) {
      return NextResponse.json({ prejeto: true, ponovitev: true });
    }
    if (!obstojec) {
      await prisma.stripeDogodek.create({
        data: { dogodekId: dogodek.id, vrsta: dogodek.type },
      });
    }
  } catch (e) {
    // Tu 500 JE pravi odgovor: baza ni odgovorila, dogodka nismo zapisali in
    // ponoven poskus je zaželen.
    console.error("[stripe] dogodka ni bilo mogoče zapisati:", e);
    return NextResponse.json({ error: "Baza ni dosegljiva" }, { status: 500 });
  }

  try {
    switch (dogodek.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const seja = dogodek.data.object as Stripe.Checkout.Session;
        const racunId = seja.metadata?.racunId;

        // Brez oznake ne vemo, kateri račun je bil plačan. Iskanje po znesku
        // ni mogoče: dva računa za isti znesek sta nerazločljiva.
        if (!racunId) break;
        if (seja.payment_status !== "paid") break;

        const spremenjeni = await prisma.racun.updateMany({
          // `updateMany` in pogoj na stanju: če je račun medtem že plačan,
          // se ne zgodi nič. To je druga varovalka poleg enkratnosti.
          where: { id: racunId, stanje: { not: "PLACAN" } },
          data: {
            stanje: "PLACAN",
            placanoAt: new Date(),
            stripePlaciloId:
              typeof seja.payment_intent === "string" ? seja.payment_intent : null,
          },
        });

        // POTRDILO GRE SAMO OB PRVI SPREMEMBI. Stripe isti dogodek ob
        // negotovi dostavi ponovi; brez tega pogoja bi stranka dobila dve
        // enaki potrdili za eno plačilo — in to je trenutek, ko začne
        // dvomiti, ali je plačala dvakrat.
        if (spremenjeni.count > 0) await posljiPotrdilo(racunId);
        break;
      }

      case "checkout.session.expired":
        // Blagajna je potekla. Račun ostane, kakršen je — stranka lahko
        // isto povezavo odpre znova in se odpre nova blagajna.
        break;

      default:
        break;
    }

    await prisma.stripeDogodek.update({
      where: { dogodekId: dogodek.id },
      data: { obdelanoAt: new Date() },
    });
  } catch (e) {
    console.error("[stripe] obdelava dogodka ni uspela:", e);
    await prisma.stripeDogodek
      .update({
        where: { dogodekId: dogodek.id },
        data: { napaka: e instanceof Error ? e.message : String(e) },
      })
      .catch(() => undefined);
    // 200 nalašč: ponavljanje ne bo pomagalo, napaka je zapisana.
  }

  return NextResponse.json({ prejeto: true });
}

// ----------------------------------------------------------------------------
// Potrdilo o plačilu
// ----------------------------------------------------------------------------
// Pošta NE SME podreti webhooka. Stripe ob odgovoru, ki ni 200, dogodek
// ponovi — in če bi padel zaradi pošte, bi ponovil plačilo, ki je že
// obdelano. Zato je vse v `try` in napaka gre v dnevnik, ne v odgovor.
//
// Brez e-naslova potrdila ni komu poslati; račun je plačan in to je
// pomembnejše od pisma.
// ----------------------------------------------------------------------------

async function posljiPotrdilo(racunId: string): Promise<void> {
  try {
    const racun = await prisma.racun.findUnique({
      where: { id: racunId },
      select: {
        epota: true,
        stranka: true,
        podjetje: true,
        stevilka: true,
        znesekCentov: true,
        valuta: true,
        placanoAt: true,
        vrsta: true,
      },
    });
    if (!racun?.epota) return;

    await posljiPredlogo({
      za: racun.epota,
      zadeva: `Plačilo prejeto — ${zneskovno(racun.znesekCentov, racun.valuta)}`,
      predloga: "potrdilo-placila",
      vsebina: PotrdiloPlacila({
        stranka: racun.podjetje ?? racun.stranka,
        stevilka: racun.stevilka,
        znesek: zneskovno(racun.znesekCentov, racun.valuta),
        datum: new Intl.DateTimeFormat("sl-SI", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Europe/Ljubljana",
        }).format(racun.placanoAt ?? new Date()),
        naslednjiKorak:
          racun.vrsta === "PREDRACUN"
            ? "Z delom začnem takoj; javim se v enem delovnem dnevu."
            : "Nič več ni treba narediti. Za vprašanja o listini pokličite.",
      }),
    });
  } catch (e) {
    console.error("[stripe] potrdila ni bilo mogoče poslati:", e);
  }
}
