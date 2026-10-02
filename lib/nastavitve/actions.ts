"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/helpers";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import { nastavitveSchema, type NastavitveInput } from "@/lib/nastavitve/validation";
import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/nastavitve/actions.ts — shranjevanje nastavitev
// ============================================================================

export async function shraniNastavitveAction(
  vhod: NastavitveInput,
): Promise<ActionResult> {
  await zahtevajPrijavo();

  const razclenjen = nastavitveSchema.safeParse(vhod);
  if (!razclenjen.success) {
    const napake: Record<string, string[]> = {};
    for (const n of razclenjen.error.issues) {
      const polje = String(n.path[0] ?? "_");
      (napake[polje] ??= []).push(n.message);
    }
    return { ok: false, message: "Preveri vnesene podatke.", fieldErrors: napake };
  }

  const d = razclenjen.data;

  // `upsert` in ne `update`: ob prvem shranjevanju vrstice še ni, ker je
  // branje namenoma ne ustvari.
  await prisma.nastavitve.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...d },
    update: d,
  });

  revalidatePath("/admin/nastavitve");
  revalidatePath("/admin/racuni");
  return { ok: true, message: "Nastavitve so shranjene." };
}
