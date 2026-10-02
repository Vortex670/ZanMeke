import { LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthKartica } from "@/components/auth/AuthKartica";
import { ObrazecNovoGeslo } from "@/components/auth/ObrazecNovoGeslo";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";

// ============================================================================
// /prijava/geslo/[zeton] — nastavitev novega gesla
// ----------------------------------------------------------------------------
// Veljavnost se preveri ŽE OB IZRISU, ne šele ob oddaji: kdor odpre potečeno
// povezavo, naj to izve takoj in ne po tem, ko si je izmislil geslo in ga
// dvakrat vtipkal.
// ============================================================================

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Novo geslo",
  robots: { index: false, follow: false },
};

export default async function NovoGeslo({
  params,
}: {
  params: Promise<{ zeton: string }>;
}) {
  const { zeton } = await params;
  const zapis = await prisma.zetonGesla.findUnique({
    where: { zetonHash: createHash("sha256").update(zeton).digest("hex") },
    select: { potece: true, porabljen: true },
  });

  const veljaven = Boolean(zapis && !zapis.porabljen && zapis.potece > new Date());

  if (!veljaven) {
    return (
      <AuthKartica
        ikona={<LockKeyhole strokeWidth={1.5} aria-hidden />}
        oznaka="Administracija"
        naslov="Povezava ne velja več"
        opis="Povezava za ponastavitev velja eno uro in samo enkrat. Zahtevaj novo."
      >
        <p className="type-label text-center">
          <Link href="/prijava/geslo" className="text-poudarek">
            Zahtevaj novo povezavo
          </Link>
        </p>
      </AuthKartica>
    );
  }

  return (
    <AuthKartica
      ikona={<LockKeyhole strokeWidth={1.5} aria-hidden />}
      oznaka="Administracija"
      naslov="Novo geslo"
      opis="Vpiši geslo, s katerim se boš odslej prijavljal."
    >
      <ObrazecNovoGeslo zeton={zeton} />
    </AuthKartica>
  );
}
