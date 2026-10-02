import "server-only";

import { prisma } from "@/lib/prisma";

// ============================================================================
// Obvestila
// ----------------------------------------------------------------------------
// Obvestilo na tej strani je lahko ena sama stvar: NOVO POVPRAŠEVANJE. Vse
// drugo (sistem posodobljen, varnostna kopija narejena) je šum, ki zvonec
// nauči, da ga ni treba pogledati — in takrat pravo obvestilo izgine med
// nepravimi.
//
// Ko bo strani kaj dodano (plačila, naročila), dobi vsak nov vir svojo vrsto
// tu; zvonec se ne spremeni.
// ============================================================================

export type Obvestilo = {
  id: string;
  naslov: string;
  opis: string;
  kdaj: Date;
  pot: string;
};

export async function obvestila(): Promise<{
  neprebrana: number;
  seznam: Obvestilo[];
}> {
  const [neprebrana, nova] = await Promise.all([
    prisma.sporocilo.count({ where: { stanje: "NOVO" } }),
    prisma.sporocilo.findMany({
      where: { stanje: "NOVO" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        ime: true,
        podjetje: true,
        sporocilo: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    neprebrana,
    seznam: nova.map((s) => ({
      id: s.id,
      naslov: s.podjetje ? `${s.ime} · ${s.podjetje}` : s.ime,
      // Prvi del sporočila pove, ali je nujno — brez odpiranja.
      opis: s.sporocilo.length > 90 ? `${s.sporocilo.slice(0, 90)}…` : s.sporocilo,
      kdaj: s.createdAt,
      pot: "/admin/sporocila",
    })),
  };
}
