import "server-only";

import QRCode from "qrcode";

import { buildUpnString } from "@/lib/racuni/upn";

// ============================================================================
// lib/racuni/qr.ts — UPN koda za nakazilo
// ----------------------------------------------------------------------------
// Slovenska mobilna banka skenira UPN QR in izpolni nalog sama: prejemnika,
// IBAN, znesek in sklic. Brez nje stranka osem števk IBAN-a prepisuje na roko,
// in ena napačna števka pomeni nakazilo, ki se vrne čez teden dni.
//
// Koda je v PDF VLOŽENA kot slika (data URL) in ne naložena z omrežja: račun
// se pogosto odpre brez povezave, natisne ali shrani — koda mora biti del
// datoteke.
//
// Popravek napak je `M` (srednji, ~15 %): koda prenese madež ali pregib na
// natisnjenem listu, pri tem pa ostane dovolj redka, da jo telefon prebere
// tudi s slabše osvetljenega zaslona.
//
// MIRNA CONA (`margin`) JE DEL KODE IN NE ROB OKOLI NJE. Standard zahteva
// štiri module praznine na vsaki strani; brez nje čitalnik ne najde roba.
// Koda je stala na sivi kartici v PDF-ju in na temni ploskvi plačilne strani
// — v obeh primerih se je zadnji stolpec modulov dotikal podlage in telefon
// je kodo iskal, dokler ni človek obupal. Praznina je bela, ker mora biti
// svetlejša od modulov tudi takrat, ko je vse okoli nje temno.
// ============================================================================

export type UpnPodatki = {
  iban: string;
  imePrejemnika: string;
  ulica?: string;
  posta?: string;
  /** Znesek v CENTIH — pretvorbo v evre naredi ta funkcija. */
  znesekCentov: number;
  /** Sklic brez predpone, npr. »2026-001«. */
  sklic: string;
  namen: string;
  rok?: Date | null;
};

/**
 * PNG kode kot data URL; `null`, kadar je ni mogoče sestaviti.
 *
 * `null` ni napaka: brez IBAN-a ali pri ničelnem znesku koda nima pomena in
 * PDF jo preprosto izpusti. Koda, ki vodi na prazen nalog, je slabša od
 * nobene — stranka jo skenira, dobi napako in misli, da je narobe račun.
 */
export async function upnKoda(p: UpnPodatki): Promise<string | null> {
  const niz = buildUpnString({
    recipientIban: p.iban,
    recipientName: p.imePrejemnika,
    recipientStreet: p.ulica,
    recipientCity: p.posta,
    amount: p.znesekCentov / 100,
    reference: p.sklic,
    purpose: p.namen,
    paymentDeadline: p.rok ?? undefined,
  });
  if (!niz) return null;

  try {
    return await QRCode.toDataURL(niz, {
      errorCorrectionLevel: "M",
      margin: 4,
      // Slika je večja, kot je kjerkoli izrisana (142 pt v PDF-ju, 176 px na
      // strani): na zaslonu z dvojno gostoto je modul tako še vedno oster,
      // zmanjšanje pa je vedno lepše od povečave.
      width: 512,
      color: { dark: "#14181a", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}
