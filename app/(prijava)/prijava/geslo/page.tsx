import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthKartica } from "@/components/auth/AuthKartica";
import { ObrazecZahtevajGeslo } from "@/components/auth/ObrazecZahtevajGeslo";

export const metadata: Metadata = {
  title: "Pozabljeno geslo",
  robots: { index: false, follow: false },
};

export default function PozabljenoGeslo() {
  return (
    <AuthKartica
      ikona={<KeyRound strokeWidth={1.5} aria-hidden />}
      oznaka="Administracija"
      naslov="Pozabljeno geslo"
      opis="Vpiši e-naslov računa. Poslal bom povezavo, s katero nastaviš novo geslo."
    >
      <ObrazecZahtevajGeslo />

      <p className="type-label text-bledo mt-s3 text-center">
        <Link href="/prijava" className="hover:text-crnilo transition-colors">
          Nazaj na prijavo
        </Link>
      </p>
    </AuthKartica>
  );
}
