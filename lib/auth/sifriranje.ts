import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// ============================================================================
// lib/auth/sifriranje.ts — skrivnost generatorja v bazi ni berljiva
// ----------------------------------------------------------------------------
// TOTP skrivnost je enakovredna geslu: kdor jo ima, zna ustvariti veljavno
// kodo za vedno. Geslo hranimo kot argon2 odtis, ki ga ni mogoče obrniti;
// skrivnosti pa ne smemo odtisniti, ker jo moramo znati prebrati nazaj. Edina
// pot je šifriranje s ključem, ki NI v bazi.
//
// AES-256-GCM in ne CBC: GCM poleg skrivnosti ščiti tudi celovitost — zapis,
// ki bi ga kdo v bazi spremenil, se ne dešifrira, ampak vrže napako.
//
// KLJUČ JE `TOTP_KEY` iz okolja. Mora biti isti povsod, kjer se bere ista
// baza; če se zamenja, 2FA nikomur več ne deluje in ga je treba vklopiti
// znova. To je cena tega, da izvoz baze sam po sebi ne odpre ničesar.
//
// Zapis je `iv:oznaka:besedilo`, vse v base64url — tri polja, ker GCM poleg
// šifriranega besedila potrebuje tudi vektor in oznako pristnosti.
// ============================================================================

const ALGORITEM = "aes-256-gcm";
const IV_DOLZINA = 12; // priporočilo za GCM

function kljuc(): Buffer {
  const vir = process.env.TOTP_KEY?.trim();
  if (!vir) {
    throw new Error(
      "TOTP_KEY ni nastavljen — brez njega dvofaktorske prijave ni mogoče uporabljati.",
    );
  }
  // SHA-256 iz poljubno dolgega niza da natanko 32 bajtov, kolikor jih
  // potrebuje AES-256. Tako je ključ lahko navaden niz iz okolja.
  return createHash("sha256").update(vir).digest();
}

export function jeSifriranjePripravljeno(): boolean {
  return Boolean(process.env.TOTP_KEY?.trim());
}

export function zasifriraj(besedilo: string): string {
  const iv = randomBytes(IV_DOLZINA);
  const sifrer = createCipheriv(ALGORITEM, kljuc(), iv);
  const vsebina = Buffer.concat([sifrer.update(besedilo, "utf8"), sifrer.final()]);
  return [iv, sifrer.getAuthTag(), vsebina].map((b) => b.toString("base64url")).join(":");
}

/** `null`, kadar zapisa ni mogoče prebrati — pokvarjen zapis ni veljavna skrivnost. */
export function odsifriraj(zapis: string): string | null {
  try {
    const [iv, oznaka, vsebina] = zapis.split(":");
    if (!iv || !oznaka || !vsebina) return null;

    const desifrer = createDecipheriv(ALGORITEM, kljuc(), Buffer.from(iv, "base64url"));
    desifrer.setAuthTag(Buffer.from(oznaka, "base64url"));
    return Buffer.concat([
      desifrer.update(Buffer.from(vsebina, "base64url")),
      desifrer.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
