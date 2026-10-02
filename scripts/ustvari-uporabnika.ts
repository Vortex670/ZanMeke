import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import { zasifriraj } from "@/lib/auth/geslo";
import { PrismaClient } from "@/src/generated/prisma/client";

// ============================================================================
// scripts/ustvari-uporabnika.ts — prvi račun za admin
// ----------------------------------------------------------------------------
//   npx tsx scripts/ustvari-uporabnika.ts
//
// Geslo se vpiše TU, v terminal, in nikamor drugam: ne v klepet, ne v ukaz
// (zgodovina lupine), ne v datoteko. Vpis je skrit — na zaslonu ni znakov.
//
// Če račun s tem e-naslovom že obstaja, se mu geslo zamenja. Tako je to tudi
// orodje za pozabljeno geslo, dokler ponastavitve po pošti ni.
// ============================================================================

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

/** Vprašanje brez izpisovanja vtipkanega — za geslo. */
async function skrivaj(vprasanje: string): Promise<string> {
  const vmesnik = createInterface({ input: stdin, output: stdout, terminal: true });
  const tihi = stdout.write.bind(stdout);
  stdout.write(vprasanje);
  // Med vpisom gesla ne izpisujemo ničesar razen prve vrstice vprašanja.
  (stdout as unknown as { write: typeof tihi }).write = () => true;
  const odgovor = await vmesnik.question("");
  (stdout as unknown as { write: typeof tihi }).write = tihi;
  stdout.write("\n");
  vmesnik.close();
  return odgovor.trim();
}

async function glavno() {
  const vmesnik = createInterface({ input: stdin, output: stdout });
  const email = (await vmesnik.question("E-naslov: ")).trim().toLowerCase();
  const ime = (await vmesnik.question("Ime in priimek: ")).trim();
  vmesnik.close();

  const geslo = await skrivaj("Geslo (vpis je skrit): ");
  const ponovi = await skrivaj("Ponovi geslo: ");

  if (geslo !== ponovi) {
    console.error("✗ Gesli se ne ujemata.");
    process.exit(1);
  }
  if (geslo.length < 12) {
    console.error("✗ Geslo naj ima vsaj 12 znakov. To je edino geslo te strani.");
    process.exit(1);
  }

  const zapis = await zasifriraj(geslo);
  const uporabnik = await prisma.uporabnik.upsert({
    where: { email },
    update: { geslo: zapis, ime },
    create: { email, ime, geslo: zapis },
    select: { id: true, email: true, createdAt: true, updatedAt: true },
  });

  const nov = uporabnik.createdAt.getTime() === uporabnik.updatedAt.getTime();
  console.log(nov ? "✓ Račun ustvarjen:" : "✓ Geslo zamenjano za:", uporabnik.email);
  await prisma.$disconnect();
}

glavno().catch(async (e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
