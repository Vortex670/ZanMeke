import { z } from "zod";

// ============================================================================
// lib/kontakt/validation.ts — kaj je veljavno povpraševanje
// ----------------------------------------------------------------------------
// Sheme so samo tu. V akciji ni inline Zod-a: ko se pravilo spremeni, se
// spremeni na enem mestu in obrazec ter strežnik ostaneta v koraku.
//
// Telefon je obvezen, e-pošta ni. To ni spregled: gostilničar odgovarja na
// klic in ne na pošto, pri povpraševanju pa je številka tisto, kar zares
// omogoči nadaljevanje. E-pošta je za tiste, ki raje pišejo.
// ============================================================================

export const ZANIMANJE = ["SPLETNA_STRAN", "FOTOGRAFIJE", "OBOJE", "DRUGO"] as const;

export const ZANIMANJE_NAPIS: Record<(typeof ZANIMANJE)[number], string> = {
  SPLETNA_STRAN: "Spletna stran",
  FOTOGRAFIJE: "Fotografiranje",
  OBOJE: "Oboje",
  DRUGO: "Nekaj drugega",
};

/** Slovenska številka z ali brez predpone, s presledki ali brez. */
const TELEFON = /^(\+386|0)[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

export const povprasevanjeSchema = z.object({
  ime: z
    .string()
    .trim()
    .min(2, "Napišite ime, da vem, koga pokličem.")
    .max(80, "Ime je predolgo."),
  podjetje: z.string().trim().max(120, "Ime podjetja je predolgo.").optional(),
  telefon: z
    .string()
    .trim()
    .min(1, "Brez številke vas ne morem poklicati.")
    .regex(TELEFON, "Telefonska številka ni videti pravilna (npr. 041 401 521)."),
  epota: z
    .union([z.literal(""), z.string().trim().email("E-naslov ni videti pravilen.")])
    .optional(),
  zanimanje: z.enum(ZANIMANJE),
  sporocilo: z
    .string()
    .trim()
    .min(10, "Napišite vsaj stavek — kaj vas muči ali kaj potrebujete.")
    .max(2000, "Sporočilo je predolgo; raje pokličite."),
  /** Past za bote — človek je ne vidi in je ne izpolni. */
  podjetjeUrl: z.string().max(0).optional(),
});

export type PovprasevanjeVhod = z.infer<typeof povprasevanjeSchema>;
