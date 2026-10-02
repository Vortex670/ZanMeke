import { z } from "zod";

// ============================================================================
// lib/racuni/validation.ts — kaj sme v račun
// ----------------------------------------------------------------------------
// Znesek vstopi v EVRIH (tako ga človek vtipka) in se shrani v CENTIH. Meje
// nista okras: Stripe pod 0,50 € zavrne plačilo, zgornja meja pa je varovalo
// pred tipkarsko napako — pri računu za deset tisoč evrov je verjetneje, da
// je nekdo pritisnil ničlo preveč, kot da je to res.
// ============================================================================

export const NAJMANJ_EUR = 1;
export const NAJVEC_EUR = 10_000;

export const racunSchema = z.object({
  /** Predračun je ponudba za plačilo, račun je davčni dokument. */
  vrsta: z.enum(["RACUN", "PREDRACUN"]),
  stranka: z.string().trim().min(2, "Vpišite ime stranke.").max(120),
  podjetje: z.string().trim().max(160).optional().or(z.literal("")),
  epota: z
    .string()
    .trim()
    .email("Naslov ni veljaven.")
    .max(160)
    .optional()
    .or(z.literal("")),
  opis: z
    .string()
    .trim()
    .min(3, "Napišite, kaj se plačuje.")
    .max(300, "Opis naj bo krajši — stranka ga bere na plačilni strani."),
  /** V evrih, z največ dvema decimalkama. */
  znesek: z
    .number({ message: "Vpišite znesek." })
    .min(NAJMANJ_EUR, `Najmanjši znesek je ${NAJMANJ_EUR} €.`)
    .max(NAJVEC_EUR, `Največji znesek je ${NAJVEC_EUR} €.`)
    .refine((v) => Math.round(v * 100) === v * 100, "Največ dve decimalki."),
  /** Rok plačila; prazno pomeni brez roka. */
  zapadlost: z.string().trim().optional().or(z.literal("")),
});

export type RacunInput = z.infer<typeof racunSchema>;

/** Evri → centi, brez napake zaokroževanja pri 19,99. */
export function vCente(evri: number): number {
  return Math.round(evri * 100);
}

/** Centi → zapis za ljudi: `1.790,00 €`. */
export function zneskovno(centov: number, valuta = "EUR"): string {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: valuta,
    // `useGrouping: "always"` in ne privzeto: slovenska pravila ločujejo
    // tisočice šele pri petih števkah, zato je 1190 € izpisano »1190,00 €«
    // — kar se bere kot šifra in ne kot znesek. Na listini in na plačilni
    // strani je denar vedno pisan s piko: 1.190,00 €.
    useGrouping: "always",
  }).format(centov / 100);
}
