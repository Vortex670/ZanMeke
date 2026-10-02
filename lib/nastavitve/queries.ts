import "server-only";

import { prisma } from "@/lib/prisma";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// lib/nastavitve/queries.ts — branje nastavitev
// ----------------------------------------------------------------------------
// Vrstica morda še ne obstaja (prvi zagon, prazna baza). Takrat vrnemo
// privzetke in NE ustvarimo zapisa: branje ne sme pisati v bazo, sicer vsak
// obisk javne strani ustvari vrstico.
// ============================================================================

export type NastavitveStanje = {
  izdajateljIme: string;
  izdajateljUlica: string;
  izdajateljPosta: string;
  izdajateljDrzava: string;
  davcnaStevilka: string;
  maticnaStevilka: string;
  zavezanecZaDdv: boolean;
  klavzulaBrezDdv: string;
  /** Stopnja v odstotkih; uporabi se samo pri zavezancu. */
  stopnjaDdv: number;
  iban: string;
  banka: string;
  bic: string;
  telefon: string;
  epota: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  googleUrl: string;
};

const PRIVZETE: NastavitveStanje = {
  izdajateljIme: "",
  izdajateljUlica: "",
  izdajateljPosta: "",
  izdajateljDrzava: "Slovenija",
  davcnaStevilka: "",
  maticnaStevilka: "",
  zavezanecZaDdv: false,
  klavzulaBrezDdv: "DDV ni obračunan na podlagi 1. odstavka 94. člena ZDDV-1.",
  stopnjaDdv: 22,
  iban: "",
  banka: "",
  bic: "",
  telefon: STRAN.telefon,
  epota: STRAN.epota,
  instagramUrl: "",
  facebookUrl: "",
  linkedinUrl: "",
  googleUrl: "",
};

export async function getNastavitve(): Promise<NastavitveStanje> {
  const v = await prisma.nastavitve
    .findUnique({ where: { id: "singleton" } })
    .catch(() => null);
  if (!v) return PRIVZETE;

  return {
    izdajateljIme: v.izdajateljIme,
    izdajateljUlica: v.izdajateljUlica,
    izdajateljPosta: v.izdajateljPosta,
    izdajateljDrzava: v.izdajateljDrzava,
    davcnaStevilka: v.davcnaStevilka,
    maticnaStevilka: v.maticnaStevilka,
    zavezanecZaDdv: v.zavezanecZaDdv,
    klavzulaBrezDdv: v.klavzulaBrezDdv,
    stopnjaDdv: v.stopnjaDdv,
    iban: v.iban,
    banka: v.banka,
    bic: v.bic,
    telefon: v.telefon || STRAN.telefon,
    epota: v.epota || STRAN.epota,
    instagramUrl: v.instagramUrl,
    facebookUrl: v.facebookUrl,
    linkedinUrl: v.linkedinUrl,
    googleUrl: v.googleUrl,
  };
}

/**
 * Česa manjka, da bi se račun smel izdati.
 *
 * Ime, naslov in davčna so po ZDDV-1 obvezni na vsakem računu. IBAN ni
 * zakonsko obvezen, a brez njega stranka nima kam nakazati in UPN kode ni.
 */
export function manjkaZaRacun(n: NastavitveStanje): string[] {
  const manjka: string[] = [];
  if (!n.izdajateljIme) manjka.push("ime izdajatelja");
  if (!n.izdajateljUlica) manjka.push("ulica");
  if (!n.izdajateljPosta) manjka.push("pošta in kraj");
  if (!n.davcnaStevilka) manjka.push("davčna številka");
  if (!n.iban) manjka.push("IBAN");
  return manjka;
}
