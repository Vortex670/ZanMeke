import "server-only";

import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/posta/queries.ts — branje dnevnika pošte
// ============================================================================

export async function getPosta(stanje?: "POSLANA" | "NAPAKA" | "PRESKOCENA") {
  return prisma.dnevnikPoste.findMany({
    where: stanje ? { stanje } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getPostaCounts() {
  const [poslana, napaka, preskocena, skupaj] = await Promise.all([
    prisma.dnevnikPoste.count({ where: { stanje: "POSLANA" } }),
    prisma.dnevnikPoste.count({ where: { stanje: "NAPAKA" } }),
    prisma.dnevnikPoste.count({ where: { stanje: "PRESKOCENA" } }),
    prisma.dnevnikPoste.count(),
  ]);
  return { poslana, napaka, preskocena, skupaj };
}
