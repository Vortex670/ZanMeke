"use server";

import { Prisma } from "@/src/generated/prisma/client";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { zahtevajPrijavo } from "@/lib/auth/straza";
import { pageSchema, REZERVIRANI_SLUGI, type PageInput } from "@/lib/pages/validation";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/rich-text/sanitize";
import type {
  ActionFail,
  ActionResult,
  NapakePolj,
} from "@/lib/actions/helpers";

// ============================================================================
// lib/pages/actions.ts — pisanje strani
// ----------------------------------------------------------------------------
// Telo gre skozi `sanitizeHtml` OB SHRANJEVANJU, ne ob izrisu: tako je v bazi
// vedno varen HTML in nobena nova stran, ki ga prikaže, ne more pozabiti na
// čiščenje.
// ============================================================================

function fieldErrorsOf(error: z.ZodError): NapakePolj {
  const out: NapakePolj = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function osvezi(slug?: string) {
  revalidatePath("/admin/strani");
  revalidatePath("/", "layout"); // noga in meni berejo objavljene strani
  if (slug) revalidatePath(`/${slug}`);
}

function slugZasedenIfP2002(e: unknown): ActionFail | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return {
      ok: false,
      message: "Ta naslov je že v uporabi.",
      fieldErrors: { slug: ["Stran s tem naslovom že obstaja."] },
    };
  }
  return null;
}

export async function savePageAction(
  input: PageInput & { id?: string },
): Promise<ActionResult<{ id: string; slug: string }>> {
  await zahtevajPrijavo();

  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Preveri vpisana polja.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const data = parsed.data;

  if (REZERVIRANI_SLUGI.has(data.slug)) {
    return {
      ok: false,
      message: "Ta naslov je rezerviran.",
      fieldErrors: {
        slug: [`»/${data.slug}« že streže lastna stran — izberi drug naslov.`],
      },
    };
  }

  // Ob prvi objavi zapišemo datum; ob ponovnih shranjevanjih ostane prvotni,
  // sicer bi vsak popravek tipkarske napake stran prikazal kot novo.
  const prejsnja = input.id
    ? await prisma.page.findUnique({
        where: { id: input.id },
        select: { publishedAt: true },
      })
    : null;
  const publishedAt =
    data.status === "PUBLISHED" ? (prejsnja?.publishedAt ?? new Date()) : null;

  const zapis = { ...data, body: sanitizeHtml(data.body), publishedAt };

  try {
    const row = input.id
      ? await prisma.page.update({ where: { id: input.id }, data: zapis })
      : await prisma.page.create({ data: zapis });
    osvezi(row.slug);
    return {
      ok: true,
      message: input.id ? "Stran je shranjena." : "Stran je ustvarjena.",
      data: { id: row.id, slug: row.slug },
    };
  } catch (e) {
    const zaseden = slugZasedenIfP2002(e);
    if (zaseden) return zaseden;
    throw e;
  }
}

export async function deletePageAction(id: string): Promise<ActionResult> {
  await zahtevajPrijavo();
  const row = await prisma.page.delete({
    where: { id },
    select: { slug: true, title: true, status: true },
  });
  // Dnevnika sprememb ta stran (še) nima — urednik je en sam.
  osvezi(row.slug);
  return { ok: true, message: "Stran je izbrisana." };
}

export async function togglePageAction(id: string): Promise<ActionResult> {
  await zahtevajPrijavo();
  const row = await prisma.page.findUnique({
    where: { id },
    select: { status: true, slug: true, publishedAt: true },
  });
  if (!row) return { ok: false, message: "Strani ni več." };

  const objavljena = row.status === "PUBLISHED";
  await prisma.page.update({
    where: { id },
    data: {
      status: objavljena ? "DRAFT" : "PUBLISHED",
      publishedAt: objavljena ? null : (row.publishedAt ?? new Date()),
    },
  });
  osvezi(row.slug);
  return {
    ok: true,
    message: objavljena ? "Stran je umaknjena." : "Stran je objavljena.",
  };
}
