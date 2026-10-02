import { z } from "zod";

// ============================================================================
// lib/priporocila/validation.ts
// ----------------------------------------------------------------------------
// Besedilo ima SPODNJO mejo in ne le zgornjo: »super, priporočam« ni
// priporočilo, ampak okras. Prepričljivo je tisto, ki pove, kaj se je pri
// stranki spremenilo — za to je treba vsaj eno celo poved.
// ============================================================================

export const priporociloSchema = z.object({
  ime: z.string().trim().min(2, "Vpišite ime.").max(80),
  hisa: z.string().trim().max(120).optional().or(z.literal("")),
  vloga: z.string().trim().max(80).optional().or(z.literal("")),
  kraj: z.string().trim().max(80).optional().or(z.literal("")),
  besedilo: z
    .string()
    .trim()
    .min(40, "Vsaj ena cela poved — kratka pohvala ne prepriča nikogar.")
    .max(600, "Daljše od šestih vrstic nihče ne prebere."),
  url: z
    .string()
    .trim()
    .max(200)
    .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
    .refine((v) => v === "" || /^https:\/\/[^\s]+\.[^\s]+$/i.test(v), "Povezava ni veljavna."),
  objavljeno: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export type PriporociloInput = z.infer<typeof priporociloSchema>;
