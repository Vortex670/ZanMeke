import "server-only";

import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/sporocila/queries.ts — branje povpraševanj
// ----------------------------------------------------------------------------
// Pregled potrebuje dvoje: koliko jih čaka in katera so zadnja. Oboje v eni
// poizvedbi na klic, ker je tabela majhna in bo še dolgo.
// ============================================================================

export async function stejSporocila() {
  const [novo, vTeku, skupaj] = await Promise.all([
    prisma.sporocilo.count({ where: { stanje: "NOVO" } }),
    prisma.sporocilo.count({ where: { stanje: "V_TEKU" } }),
    prisma.sporocilo.count(),
  ]);
  return { novo, vTeku, skupaj };
}

export async function zadnjaSporocila(koliko = 20) {
  return prisma.sporocilo.findMany({
    orderBy: { createdAt: "desc" },
    take: koliko,
  });
}
