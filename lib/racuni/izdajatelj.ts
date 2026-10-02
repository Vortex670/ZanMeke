// ============================================================================
// lib/racuni/izdajatelj.ts — kdo izdaja račun
// ----------------------------------------------------------------------------
// Podatki, ki morajo po slovenski zakonodaji stati na računu. Tu in nikjer
// drugje: isti podatki gredo na PDF, v UPN kodo in na plačilno stran, in če
// bi bili prepisani na treh mestih, bi se ob prvi spremembi razšli.
//
// POLJA SO PRAZNA, DOKLER JIH NE VPIŠEŠ. To ni opustitev: davčne številke,
// naslova in IBAN si ne smem izmisliti, napačen podatek na računu pa je
// težava, ki se odkrije pri računovodkinji ali inšpekciji. Dokler je prazno,
// `manjkaZaRacun()` to pove in PDF se ne izdela.
//
// Če račune izdaja druga pravna oseba (npr. s. p. ali d. o. o., prek
// katerega delaš), vpiši NJENE podatke — ime na računu mora biti ime
// izdajatelja, ne ime izvajalca.
// ============================================================================

export const IZDAJATELJ = {
  /** Polno ime, kakor je v poslovnem registru. */
  ime: "",
  /** Ulica in hišna številka. */
  ulica: "",
  /** Poštna številka in kraj, npr. »8290 Sevnica«. */
  posta: "",
  drzava: "Slovenija",

  /** Davčna številka (s predpono SI, če si zavezanec za DDV). */
  davcna: "",
  /** Matična številka. */
  maticna: "",

  /** IBAN za nakazilo. Brez njega ni UPN kode na računu. */
  iban: "",
  /** Banka — na računu ni obvezna, a pomaga pri nakazilu. */
  banka: "",

  /**
   * Ali si zavezanec za DDV.
   *
   * Če NISI, mora na računu stati klavzula o oprostitvi — brez nje račun ni
   * popoln. Besedilo spodaj je standardno za male davčne zavezance.
   */
  zavezanecZaDdv: false,
  klavzulaBrezDdv: "DDV ni obračunan na podlagi 1. odstavka 94. člena ZDDV-1.",

  epota: "info@zanmeke.com",
  telefon: "041 401 521",
} as const;

/**
 * Katera polja manjkajo, da bi se račun smel izdati.
 *
 * Ime, naslov in davčna so po ZDDV-1 obvezni na vsakem računu. IBAN ni
 * zakonsko obvezen, a brez njega stranka nima kam nakazati — in UPN kode ni.
 */
export function manjkaZaRacun(): string[] {
  const manjka: string[] = [];
  if (!IZDAJATELJ.ime.trim()) manjka.push("ime izdajatelja");
  if (!IZDAJATELJ.ulica.trim()) manjka.push("ulica");
  if (!IZDAJATELJ.posta.trim()) manjka.push("pošta in kraj");
  if (!IZDAJATELJ.davcna.trim()) manjka.push("davčna številka");
  if (!IZDAJATELJ.iban.trim()) manjka.push("IBAN");
  return manjka;
}
