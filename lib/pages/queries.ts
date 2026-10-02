import "server-only";

import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/pages/queries.ts — branje strani
// ============================================================================

export type PageRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: "DRAFT" | "PUBLISHED";
  showInFooter: boolean;
  showInMenu: boolean;
  sortOrder: number;
  menuOrder: number;
  publishedAt: Date | null;
  updatedAt: Date;
};

const ROW_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  status: true,
  showInFooter: true,
  showInMenu: true,
  sortOrder: true,
  menuOrder: true,
  publishedAt: true,
  updatedAt: true,
} as const;

export async function getPages(
  filter: { status?: "DRAFT" | "PUBLISHED"; q?: string } = {},
) {
  const q = filter.q?.trim();
  return prisma.page.findMany({
    where: {
      ...(filter.status ? { status: filter.status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: ROW_SELECT,
  });
}

export async function getPageCounts(): Promise<{
  all: number;
  published: number;
  drafts: number;
}> {
  const [all, published] = await Promise.all([
    prisma.page.count(),
    prisma.page.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { all, published, drafts: all - published };
}

export async function getPageById(id: string) {
  return prisma.page.findUnique({ where: { id } });
}

/** Javna stran po naslovu — samo objavljena. */
export async function getPublishedPage(slug: string) {
  return prisma.page.findFirst({ where: { slug, status: "PUBLISHED" } });
}

/** Povezave v nogi (piškotki, zasebnost, pogoji). */
/**
 * VSE objavljene strani za zemljevid — ne samo tiste v nogi.
 *
 * Zemljevid je bral `getFooterPages()`, torej je vanj prišla samo stran, ki
 * sem jo postavil v nogo. Pravna besedila so tam in so se izpisala, nova
 * pristajalna stran pa ne bi — in stran, ki je iskalnik ne najde v
 * zemljevidu, je stran, ki sem jo pisal zase. Noga je odločitev o postavitvi
 * in ne o tem, kaj sme v iskalnik.
 */
export async function getPublishedPagesForSitemap() {
  return prisma.page.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { slug: true, updatedAt: true, showInFooter: true },
  });
}

export async function getFooterPages() {
  return prisma.page.findMany({
    where: { status: "PUBLISHED", showInFooter: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    // `updatedAt` je tu zaradi zemljevida strani: pri pravnem besedilu je
    // datum zadnje spremembe podatek, ne okras.
    select: { slug: true, title: true, updatedAt: true },
  });
}

/** Povezave v glavnem meniju. */
export async function getMenuPages() {
  return prisma.page.findMany({
    where: { status: "PUBLISHED", showInMenu: true },
    orderBy: [{ menuOrder: "asc" }, { title: "asc" }],
    select: { slug: true, title: true },
  });
}

/** Za stransko vrstico admina: strani kot podvnosi pod »Strani«. */
export async function getPagesForNav() {
  const rows = await prisma.page.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, slug: true, title: true, status: true },
    take: 20,
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    draft: r.status === "DRAFT",
  }));
}

/** Vsi naslovi objavljenih strani — za `sitemap.ts`. */
export async function getPublishedSlugs() {
  return prisma.page.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });
}
