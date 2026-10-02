import { z } from "zod";

// ============================================================================
// lib/prijava/validation.ts — sheme za prijavo in ponastavitev gesla
// ----------------------------------------------------------------------------
// Sheme so bile razsute po `actions.ts` in `geslo-actions.ts`. Pravilo te
// kodne zbirke je, da ima vsaka domena svoj `validation.ts`: shema je potem
// ena sama, uporabi jo lahko tudi obrazec na odjemalcu, in najdljiva je po
// imenu datoteke in ne po iskanju po akcijah.
//
// DOLŽINA GESLA je dvanajst znakov in ne osem. Osemmestno geslo s slovarjem
// pade v nekaj urah; tu za njim stoji administracija z računi strank.
// ============================================================================

/** Daljši e-naslovi ne obstajajo (RFC 5321); meja ustavi tudi smeti. */
const epota = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-naslov je predolg.")
  .email("Vpiši veljaven e-naslov.");

export const prijavaShema = z.object({
  email: epota,
  // Pri prijavi se dolžina NE preverja: pravilo o dolžini bi tujemu
  // poskusu povedalo, kakšno geslo iščemo, legitimnemu uporabniku pa ne
  // pomaga — njegovo geslo je bodisi pravo bodisi ne.
  geslo: z.string().min(1, "Vpiši geslo."),
  zapomni: z.boolean().optional(),
});

export const zahtevaGeslaShema = z.object({ email: epota });

export const novoGesloShema = z
  .object({
    zeton: z.string().min(10),
    geslo: z
      .string()
      .min(12, "Geslo naj ima vsaj 12 znakov.")
      .max(200, "Geslo je predolgo."),
    ponovi: z.string(),
  })
  .refine((d) => d.geslo === d.ponovi, {
    path: ["ponovi"],
    message: "Gesli se ne ujemata.",
  });

export type PrijavaInput = z.infer<typeof prijavaShema>;
export type NovoGesloInput = z.infer<typeof novoGesloShema>;
