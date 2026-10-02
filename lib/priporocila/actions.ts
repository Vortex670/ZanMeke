"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/helpers";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import { prisma } from "@/lib/prisma";
import { priporociloSchema, type PriporociloInput } from "@/lib/priporocila/validation";

// ============================================================================
// lib/priporocila/actions.ts
// ----------------------------------------------------------------------------
// Osvežita se obe poti: administracija in DOMAČA STRAN. Brez drugega bi
// urednik priporočilo objavil, stran pa bi ostala enaka — gumb, ki javi
// uspeh in ne naredi nič, je najslabša vrsta napake.
// ============================================================================

function napake(e: { issues: { path: PropertyKey[]; message: string }[] }) {
  const n: Record<string, string[]> = {};
  for (const i of e.issues) (n[String(i.path[0] ?? "_")] ??= []).push(i.message);
  return n;
}

export async function shraniPriporociloAction(
  id: string | null,
  vhod: PriporociloInput,
): Promise<ActionResult> {
  await zahtevajPrijavo();

  const r = priporociloSchema.safeParse(vhod);
  if (!r.success) {
    return { ok: false, message: "Preveri vnesene podatke.", fieldErrors: napake(r.error) };
  }

  const d = {
    ...r.data,
    hisa: r.data.hisa || null,
    vloga: r.data.vloga || null,
    kraj: r.data.kraj || null,
    url: r.data.url || null,
  };

  if (id) await prisma.priporocilo.update({ where: { id }, data: d });
  else await prisma.priporocilo.create({ data: d });

  revalidatePath("/admin/priporocila");
  revalidatePath("/");
  return { ok: true, message: id ? "Priporočilo je shranjeno." : "Priporočilo je dodano." };
}

export async function izbrisiPriporociloAction(id: string): Promise<ActionResult> {
  await zahtevajPrijavo();
  await prisma.priporocilo.delete({ where: { id } });
  revalidatePath("/admin/priporocila");
  revalidatePath("/");
  return { ok: true, message: "Priporočilo je izbrisano." };
}
