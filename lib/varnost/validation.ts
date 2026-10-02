import { z } from "zod";

// ============================================================================
// lib/varnost/validation.ts — vhod na strani »Varnost«
// ============================================================================

const geslo = z
  .string()
  .min(12, "Geslo naj ima vsaj 12 znakov.")
  .max(200, "Geslo je predolgo.");

export const zamenjajGesloShema = z
  .object({
    trenutno: z.string().min(1, "Vpiši trenutno geslo."),
    novo: geslo,
    ponovi: z.string(),
  })
  .refine((d) => d.novo === d.ponovi, {
    path: ["ponovi"],
    message: "Gesli se ne ujemata.",
  })
  .refine((d) => d.novo !== d.trenutno, {
    path: ["novo"],
    message: "Novo geslo mora biti drugačno od trenutnega.",
  });

/** Šest števk; presledke in vezaje odstranimo, ker jih generatorji dodajajo. */
export const totpKodaShema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().length(6, "Koda ima šest števk."));

/** Rezervna koda: 16 šestnajstiških znakov, vezaji so okras. */
export const rezervnaKodaShema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").toUpperCase())
  .pipe(z.string().regex(/^[0-9A-F]{16}$/, "Rezervna koda ni veljavna."));

/** Pri izklopu 2FA in brisanju računa zahtevamo geslo — ne samo odprte seje. */
export const sPotrditvijoGeslaShema = z.object({
  geslo: z.string().min(1, "Vpiši geslo."),
});

export const izbrisRacunaShema = z.object({
  geslo: z.string().min(1, "Vpiši geslo."),
  potrdilo: z.literal("IZBRIŠI", {
    message: "Za potrditev vpiši IZBRIŠI.",
  }),
});
