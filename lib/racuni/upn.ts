import "server-only";

/**
 * UPN QR — Universal Payment Order QR code formatter (Slovenian standard).
 *
 * Spec: https://www.upn-qr.si/uploads/files/EN_Tehnicni%20standard%20UPN%20QR.pdf
 *
 * Format je 19 vrstic, ločenih z LF (`\n`):
 *
 *    1. UPNQR             — header (fix)
 *    2. <iban-plačnika>   — IBAN plačnika (max 34, lahko prazno)
 *    3. <polog>           — "polog" / "" za prejem
 *    4. <dvig>            — "dvig" / ""
 *    5. <referenca-plač>  — referenca plačnika (max 26, lahko prazno)
 *    6. <ime-plač>        — ime plačnika (max 33, lahko prazno)
 *    7. <ulica-plač>      — naslov plačnika (max 33, lahko prazno)
 *    8. <kraj-plač>       — pošta plačnika (max 33, lahko prazno)
 *    9. <znesek>          — 11 znakov — leading zeros + EUR (npr. `00000067000`
 *                           = 670,00 €). Decimalka SE NE PIŠE.
 *   10. <datum-plačila>   — DD.MM.YYYY ali prazno
 *   11. <nujno>           — "X" / ""
 *   12. <koda-namena>     — 4 chars (npr. "OTHR", "RENT", "BENE")
 *   13. <namen-plačila>   — opis plačila (max 42 chars)
 *   14. <rok-plačila>     — DD.MM.YYYY ali prazno
 *   15. <iban-prejemnik>  — IBAN prejemnika (REQUIRED)
 *   16. <referenca-prej>  — "SI" + model + sklic (max 26, npr. "SI00 SH-2026-001")
 *   17. <ime-prejemnik>   — ime prejemnika (max 33)
 *   18. <ulica-prejemnik> — naslov (max 33)
 *   19. <kraj-prejemnik>  — pošta (max 33)
 *
 * Po vrstici 19 sledi 3-mestna KONTROLNA VSOTA: število vseh znakov zapisa
 * od začetka do konca zadnjega polja, VKLJUČNO z ločili (LF). Ne vsota
 * znakovnih kod, ne mod 1000 — preprosta dolžina zapisa. Mobilna banka jo
 * preveri po skenu in ob neujemanju kodo zavrne.
 *
 * Encoding: Latin-2 (Win-1250) ali UTF-8 — Win-1250 je strožji standard,
 * ker UPN je za EU. UTF-8 deluje v večini m-bančnih aplikacij. Mi pišemo
 * UTF-8, ker JS string default + qrcode library byte-mode handle-a Unicode.
 */

type UpnInput = {
  /** IBAN prejemnika (obvezno). Lahko z presledki ali brez. */
  recipientIban: string;
  /** Ime prejemnika. */
  recipientName: string;
  /** Naslov prejemnika (ulica). */
  recipientStreet?: string;
  /** Pošta + kraj prejemnika (npr. "1000 Ljubljana"). */
  recipientCity?: string;
  /** Znesek v EUR (npr. 670 ali 670.50). Pretvorjen v 11-stelno UPN format. */
  amount: number;
  /** Sklic (npr. booking code "SH-2026-001"). Format SI00. */
  reference: string;
  /** Namen plačila (npr. "Rezervacija Apartman Rogoznica 1.-8.5.2026"). */
  purpose: string;
  /** Rok plačila — Date objekt, formatiran v DD.MM.YYYY. */
  paymentDeadline?: Date;
  /** Koda namena (4 chars) — default "OTHR" (general). */
  purposeCode?: string;
};

/**
 * Transliteracija slovenskih/hrvaških znakov → ASCII.
 *
 * **Zakaj**: UPN-QR spec dovoljuje UTF-8 in Win-1250 encoding, ampak nekatere
 * m-banking aplikacije (Delavska Hranilnica, NLB starejše verzije, Hranilnica
 * Sežana) imajo strict Latin-2 parser. Če QR vsebuje multibyte UTF-8 sekvence
 * (Ž = 2 bytes), parser jih napačno interpretira → "napaka strukture".
 *
 * Transliteracija je varna izguba (gost še vedno vidi "Zan Meke" namesto
 * "Žan Meke"). Banke ne primerjajo imena na nakazilu z imenom na računu —
 * le IBAN se preverja. Tako da ASCII-safe ime je BREZ semantične izgube.
 */
function transliterate(value: string): string {
  const map: Record<string, string> = {
    Ž: "Z",
    ž: "z",
    Š: "S",
    š: "s",
    Č: "C",
    č: "c",
    Ć: "C",
    ć: "c",
    Đ: "D",
    đ: "d",
    Ä: "A",
    ä: "a",
    Ö: "O",
    ö: "o",
    Ü: "U",
    ü: "u",
    ß: "ss",
  };
  return value.replace(/[^\x00-\x7F]/g, (ch) => map[ch] ?? "");
}

/** Trim + transliterate + truncate na max chars. */
function field(value: string | undefined, maxLen: number): string {
  if (!value) return "";
  return transliterate(value.trim()).slice(0, maxLen);
}

/**
 * Reference field — striktno alfanumerično (brez dashes, presledkov,
 * specialov). Delavska Hranilnica + NLB strict parser zavrne SI99 z dashe-i
 * ali z presledkom. `SH-2026-0001` → `SH20260001`.
 *
 * **Zgodovina (april 2026)**: pre-f9c886f je bil ta sanitizer aktiven. Komit
 * f9c886f ga je odstranil v upanju, da bo `SI99 SH-2026-0001` (s presledkom +
 * dashe) prikazal pravilno polje Referenca v Delavski / NLB. Test je pokazal
 * obratno: QR se ni dal skenirati ("napaka strukture"), zato je treba ostati
 * pri striktnem alfanumeričnem formatu.
 */
function sanitizeReference(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").slice(0, 22);
}

/**
 * Sklic z modelom — ENO MESTO za kodo IN za izpis.
 *
 * Doslej sta bila dva: koda je nosila `SI99` + strnjeno številko, listina,
 * admin in plačilna stran pa so izpisovali `SI00 2026-001`. Kdor je kodo
 * skeniral, je plačal z enim sklicem, kdor jo je prepisal, z drugim — in
 * prvo, kar na izpisku iščem, je ravno sklic.
 *
 * **Model se izbere po vsebini.** `SI00` je slovenski model s predpisano
 * zgradbo in SAMO ŠTEVKAMI; računi (`2026-001` → `2026001`) vanj gredo in
 * tam tudi sodijo, ker ga računovodstvo pričakuje. Predračun (`P-2026-001`)
 * ima črko, zato ostane pri `SI99` — model »brez sklica«, ki vsebino prenese
 * kot besedilo.
 *
 * Vezaj pade ven v obeh primerih: strict parser Delavske in NLB je kodo z
 * vezajem zavrnil z »napako strukture« (revert f9c886f).
 */
export function upnSklic(stevilka: string): string {
  const cisto = sanitizeReference(stevilka);
  return `${/^\d+$/.test(cisto) ? "SI00" : "SI99"}${cisto}`.slice(0, 26);
}

/** Isti sklic, kot ga prebere človek: »SI00 2026001«. */
export function upnSklicIzpis(stevilka: string): string {
  const s = upnSklic(stevilka);
  return `${s.slice(0, 4)} ${s.slice(4)}`;
}

/** Format Date → DD.MM.YYYY (Slovenian + Croatian standard). */
function formatDate(date: Date | undefined): string {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

/** Amount → 11-char leading zero string brez decimalke (cents inline). */
function formatAmount(amount: number): string {
  const cents = Math.round(amount * 100);
  return String(cents).padStart(11, "0");
}

/** Normalize IBAN — odstrani presledke + uppercase. */
function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

/**
 * Build UPN QR string. Vrne celotno payload pripravljeno za QR encoding.
 *
 * **Validation**: če manjka IBAN ALI amount ≤ 0, vrne `null` — QR brez
 * teh dveh polj ne bi imel smisla (mobilna banka bi javila napako).
 */
export function buildUpnString(input: UpnInput): string | null {
  const iban = normalizeIban(input.recipientIban);
  if (!iban || input.amount <= 0) return null;

  const lines = [
    "UPNQR",
    "", // 2. IBAN plačnika
    "", // 3. polog
    "", // 4. dvig
    "", // 5. referenca plačnika
    "", // 6. ime plačnika
    "", // 7. ulica plačnika
    "", // 8. kraj plačnika
    formatAmount(input.amount), // 9. znesek
    "", // 10. datum plačila
    "", // 11. nujno
    field(input.purposeCode ?? "OTHR", 4), // 12. koda namena
    field(input.purpose, 42), // 13. namen plačila
    formatDate(input.paymentDeadline), // 14. rok plačila
    iban, // 15. IBAN prejemnika
    // 16. referenca prejemnika — model + sklic BREZ presledka (spec UPN-QR
    // v1.13). Model izbere `upnSklic`; ista funkcija ga izpiše na listino,
    // da se skenirano in prepisano plačilo ne razideta.
    upnSklic(input.reference),
    field(input.recipientName, 33), // 17. ime prejemnika
    field(input.recipientStreet, 33), // 18. ulica prejemnika
    field(input.recipientCity, 33), // 19. kraj prejemnika
  ];

  // KONTROLNA VSOTA JE DOLŽINA ZAPISA in ne vsota dolžin polj.
  //
  // Tu je bila napaka, zaradi katere nobena mobilna banka kode ni prebrala:
  // seštevek je izpuščal glavo »UPNQR« in vseh devetnajst prelomov vrstice,
  // torej je bil VEDNO premajhen za 24. Banka kodo prebere, preveri vsoto,
  // vidi neujemanje in jo zavrne — na zaslonu piše le, da kode ni mogoče
  // prebrati, zato je napaka izgledala kot slaba koda in ne kot napačna
  // številka na koncu.
  //
  // Polja gredo skozi `transliterate`, zato je zapis čisti ASCII in je
  // število znakov enako številu bajtov — tudi za bralnik, ki pričakuje
  // ISO-8859-2.
  const zapis = `${lines.join("\n")}\n`;

  return `${zapis}${String(zapis.length).padStart(3, "0")}`;
}
