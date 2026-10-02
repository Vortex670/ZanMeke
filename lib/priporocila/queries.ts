import "server-only";

import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/priporocila/queries.ts — branje priporočil
// ============================================================================

export type Priporocilo = {
  id: string;
  ime: string;
  hisa: string | null;
  vloga: string | null;
  kraj: string | null;
  besedilo: string;
  url: string | null;
  objavljeno: boolean;
  sortOrder: number;
};

const IZBOR = {
  id: true,
  ime: true,
  hisa: true,
  vloga: true,
  kraj: true,
  besedilo: true,
  url: true,
  objavljeno: true,
  sortOrder: true,
} as const;

/** Za javno stran — samo objavljena, v urejenem vrstnem redu. */
export async function getObjavljenaPriporocila(): Promise<Priporocilo[]> {
  return prisma.priporocilo.findMany({
    where: { objavljeno: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: IZBOR,
  });
}

/** Za administracijo — vsa, tudi neobjavljena. */
export async function getPriporocila(): Promise<Priporocilo[]> {
  return prisma.priporocilo.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: IZBOR,
  });
}

export async function getPriporocilo(id: string): Promise<Priporocilo | null> {
  return prisma.priporocilo.findUnique({ where: { id }, select: IZBOR });
}
