import { z } from "zod";

// ============================================================================
// lib/nastavitve/validation.ts — kaj sme v nastavitve
// ----------------------------------------------------------------------------
// IBAN in davčna se preverita po obliki, ne le po dolžini. Napačna davčna na
// računu je težava, ki se odkrije pri računovodkinji mesece pozneje; preverba
// ob vnosu je edini trenutek, ko to še nič ne stane.
// ============================================================================

/** Slovenska davčna: osem števk, po želji s predpono SI. */
const davcna = z
  .string()
  .trim()
  .regex(/^(SI)?\d{8}$/i, "Davčna je osem števk, lahko s predpono SI.")
  .or(z.literal(""));

/**
 * IBAN brez presledkov, dolžina po državi.
 *
 * Preverimo tudi KONTROLNO ŠTEVILO (mod 97). Brez tega bi prestregli samo
 * napačno dolžino — zamenjani števki v sredini pa gresta skozi, in nakazilo
 * potuje na tuj račun ali pa se vrne čez teden dni.
 */
const iban = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, "").toUpperCase())
  .refine(
    (v) => v === "" || /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v),
    "IBAN ni veljaven.",
  )
  .refine((v) => v === "" || mod97(v) === 1, "IBAN ima napačno kontrolno številko.");

function mod97(v: string): number {
  const preurejen = v.slice(4) + v.slice(0, 4);
  const stevilke = preurejen.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  // Po kosih, ker je število daljše od tega, kar zmore `Number`.
  let ostanek = 0;
  for (const znak of stevilke) ostanek = (ostanek * 10 + Number(znak)) % 97;
  return ostanek;
}

/**
 * Povezava na profil — prazno ali polni naslov s `https://`.
 *
 * Zakaj ne samo `url()`: nekdo vpiše `instagram.com/ime` brez sheme in
 * povezava v nogi pelje na `zanmeke.com/instagram.com/ime`. Zato shema
 * manjkajoči `https://` doda sama, namesto da bi vnos zavrnila.
 */
const povezava = z
  .string()
  .trim()
  .max(200)
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .refine((v) => v === "" || /^https:\/\/[^\s]+\.[^\s]+$/i.test(v), "Povezava ni veljavna.");

export const nastavitveSchema = z.object({
  izdajateljIme: z.string().trim().max(160),
  izdajateljUlica: z.string().trim().max(160),
  izdajateljPosta: z.string().trim().max(120),
  izdajateljDrzava: z.string().trim().max(80),
  davcnaStevilka: davcna,
  maticnaStevilka: z.string().trim().max(40),
  zavezanecZaDdv: z.boolean(),
  klavzulaBrezDdv: z.string().trim().max(300),
  stopnjaDdv: z.coerce.number().int().min(0).max(99),
  iban,
  banka: z.string().trim().max(120),
  bic: z.string().trim().max(20),
  telefon: z.string().trim().max(40),
  epota: z.string().trim().email("Naslov ni veljaven.").max(160).or(z.literal("")),
  instagramUrl: povezava,
  facebookUrl: povezava,
  linkedinUrl: povezava,
  googleUrl: povezava,
});

export type NastavitveInput = z.infer<typeof nastavitveSchema>;
