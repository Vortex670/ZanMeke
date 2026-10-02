import { z } from "zod";

import { slugSchema } from "@/lib/validation/shared";

// ============================================================================
// lib/pages/validation.ts — strani (pravna besedila in vse ostalo)
// ----------------------------------------------------------------------------
// Meje SEO polj niso naše: Google odreže naslov pri ~60 in opis pri ~155
// znakih. Polje, ki dovoli več, obljublja nekaj, česar iskalnik ne pokaže.
// ============================================================================

export const PAGE_MAX = {
  title: 160,
  excerpt: 300,
  seoTitle: 60,
  seoDescription: 155,
  /** Telo je HTML iz urejevalnika; meja je obramba pred prilepljenim romanom. */
  body: 200_000,
} as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null);

const checkbox = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === "boolean" ? v : v === "on" || v === "true"))
  .default(false);

export const pageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2, "Vpiši naslov strani").max(PAGE_MAX.title),
  body: z.string().max(PAGE_MAX.body).default(""),
  excerpt: optionalText(PAGE_MAX.excerpt),
  seoTitle: optionalText(PAGE_MAX.seoTitle),
  seoDescription: optionalText(PAGE_MAX.seoDescription),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  showInFooter: checkbox,
  showInMenu: checkbox,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  menuOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export type PageInput = z.input<typeof pageSchema>;
export type PageData = z.output<typeof pageSchema>;

/**
 * Poti, ki jih strežejo lastne strani. Stran s takim naslovom bi jih zasenčila
 * ali pa bi ostala nedosegljiva — v obeh primerih zmeda, zato jih zavrnemo.
 */
export const REZERVIRANI_SLUGI = new Set([
  "admin",
  "api",
  "jedilnik",
  "malica",
  "malice",
  "novice",
  "rezervacija",
  "rezervacije",
  "kontakt",
  "login",
  "prijava",
  "novicnik",
  "odjava",
]);
