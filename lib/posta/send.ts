import "server-only";

import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// lib/posta/send.ts — EDINA vrata, skozi katera gre pošta
// ----------------------------------------------------------------------------
// Vsak klic se zapiše v `dnevnik_poste`, tudi neuspel in tudi preskočen.
// Razlog je en sam: ko stranka reče »nič nisem dobil«, mora obstajati
// odgovor, ki ni ugibanje.
//
// POŠILJANJE NIKOLI NE VRŽE. Povpraševanje se shrani v bazo pred pošto, in
// če pošta ne gre skozi, sporočilo ni izgubljeno — zato je napaka tu
// podatek in ne dogodek, ki bi smel podreti oddajo obrazca.
//
// Brez ključa se pošta PRESKOČI in to se zapiše. V razvoju je to pravilno
// vedenje: nočem, da preizkusi strani pošiljajo pravo pošto.
// ============================================================================

type Pismo = {
  /** En naslov ali več; v dnevnik gredo zapisani z vejico. */
  za: string | string[];
  zadeva: string;
  html: string;
  besedilo?: string;
  /** Ključ predloge — da se v dnevniku vidi, katera pošta je šla. */
  predloga?: string;
  /** Kam odgovori stranka, kadar se razlikuje od pošiljatelja. */
  odgovorNa?: string;
};

export type IzidPoste =
  { ok: true; id: string | null; preskoceno: boolean } | { ok: false; napaka: string };

function posiljatelj(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || `${STRAN.ime} <${STRAN.epota}>`;
}

/**
 * Pošta iz PREDLOGE — edini način, kako naj gre kaj ven.
 *
 * Predloge v `emails/` so doslej živele samo v predogledu v adminu: resnična
 * pošta je bila golo besedilo ali `<pre>`, in nihče ni opazil razlike, ker
 * predogled je bil lep. Stranka je dobila nekaj drugega, kot sem videl jaz.
 *
 * Golo besedilo se izriše iz ISTE predloge in ne piše posebej: dve različici
 * istega sporočila se vedno razideta, in tista, ki se razide, je tista, ki je
 * nihče ne gleda.
 */
export async function posljiPredlogo(p: {
  za: string | string[];
  zadeva: string;
  /** Ključ iz `lib/posta/katalog.ts` — zapiše se v dnevnik. */
  predloga: string;
  vsebina: ReactElement;
  odgovorNa?: string;
}): Promise<IzidPoste> {
  const [html, besedilo] = await Promise.all([
    render(p.vsebina),
    render(p.vsebina, { plainText: true }),
  ]);

  return posljiPosto({
    za: p.za,
    zadeva: p.zadeva,
    html,
    besedilo,
    predloga: p.predloga,
    ...(p.odgovorNa ? { odgovorNa: p.odgovorNa } : {}),
  });
}

export async function posljiPosto(pismo: Pismo): Promise<IzidPoste> {
  const prejemnik = Array.isArray(pismo.za) ? pismo.za.join(", ") : pismo.za;
  const kljuc = process.env.RESEND_API_KEY?.trim();

  // ── Brez ključa: zapišemo in gremo naprej ───────────────────────────────
  if (!kljuc) {
    await zapisi({
      prejemnik,
      zadeva: pismo.zadeva,
      predloga: pismo.predloga,
      stanje: "PRESKOCENA",
      napaka: "RESEND_API_KEY ni nastavljen",
    });
    return { ok: true, id: null, preskoceno: true };
  }

  try {
    const { data, error } = await new Resend(kljuc).emails.send({
      from: posiljatelj(),
      to: Array.isArray(pismo.za) ? pismo.za : [pismo.za],
      subject: pismo.zadeva,
      html: pismo.html,
      text: pismo.besedilo,
      ...(pismo.odgovorNa ? { replyTo: pismo.odgovorNa } : {}),
    });

    if (error) {
      await zapisi({
        prejemnik,
        zadeva: pismo.zadeva,
        predloga: pismo.predloga,
        stanje: "NAPAKA",
        napaka: error.message,
      });
      return { ok: false, napaka: error.message };
    }

    await zapisi({
      prejemnik,
      zadeva: pismo.zadeva,
      predloga: pismo.predloga,
      stanje: "POSLANA",
      ponudnikId: data?.id ?? null,
    });
    return { ok: true, id: data?.id ?? null, preskoceno: false };
  } catch (e) {
    const sporocilo = e instanceof Error ? e.message : String(e);
    await zapisi({
      prejemnik,
      zadeva: pismo.zadeva,
      predloga: pismo.predloga,
      stanje: "NAPAKA",
      napaka: sporocilo,
    });
    return { ok: false, napaka: sporocilo };
  }
}

/**
 * Zapis v dnevnik ne sme nikoli podreti pošiljanja.
 *
 * Če pade baza, je pošta morda vseeno odšla — in takrat je slabše vreči
 * napako (obrazec bi javil neuspeh) kot ostati brez vrstice v dnevniku.
 */
async function zapisi(vnos: {
  prejemnik: string;
  zadeva: string;
  predloga?: string;
  stanje: "POSLANA" | "NAPAKA" | "PRESKOCENA";
  ponudnikId?: string | null;
  napaka?: string | null;
}): Promise<void> {
  try {
    await prisma.dnevnikPoste.create({
      data: {
        prejemnik: vnos.prejemnik.slice(0, 300),
        zadeva: vnos.zadeva.slice(0, 300),
        predloga: vnos.predloga ?? null,
        stanje: vnos.stanje,
        ponudnikId: vnos.ponudnikId ?? null,
        napaka: vnos.napaka?.slice(0, 500) ?? null,
      },
    });
  } catch (e) {
    console.error("[posta] dnevnika ni bilo mogoče zapisati:", e);
  }
}
