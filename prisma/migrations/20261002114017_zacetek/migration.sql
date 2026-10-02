-- CreateEnum
CREATE TYPE "StanjeSporocila" AS ENUM ('NOVO', 'V_TEKU', 'ZAKLJUCENO');

-- CreateEnum
CREATE TYPE "Zanimanje" AS ENUM ('SPLETNA_STRAN', 'FOTOGRAFIJE', 'OBOJE', 'DRUGO');

-- CreateTable
CREATE TABLE "uporabniki" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ime" TEXT NOT NULL,
    "geslo" TEXT NOT NULL,
    "zadnjaPrijava" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uporabniki_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seje" (
    "id" TEXT NOT NULL,
    "uporabnikId" TEXT NOT NULL,
    "zetonHash" TEXT NOT NULL,
    "potece" TIMESTAMP(3) NOT NULL,
    "naprava" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sporocila" (
    "id" TEXT NOT NULL,
    "ime" TEXT NOT NULL,
    "podjetje" TEXT,
    "telefon" TEXT NOT NULL,
    "epota" TEXT,
    "zanimanje" "Zanimanje" NOT NULL,
    "sporocilo" TEXT NOT NULL,
    "stanje" "StanjeSporocila" NOT NULL DEFAULT 'NOVO',
    "opomba" TEXT,
    "poslano" BOOLEAN NOT NULL DEFAULT false,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sporocila_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uporabniki_email_key" ON "uporabniki"("email");

-- CreateIndex
CREATE UNIQUE INDEX "seje_zetonHash_key" ON "seje"("zetonHash");

-- CreateIndex
CREATE INDEX "seje_uporabnikId_idx" ON "seje"("uporabnikId");

-- CreateIndex
CREATE INDEX "seje_potece_idx" ON "seje"("potece");

-- CreateIndex
CREATE INDEX "sporocila_stanje_createdAt_idx" ON "sporocila"("stanje", "createdAt");

-- AddForeignKey
ALTER TABLE "seje" ADD CONSTRAINT "seje_uporabnikId_fkey" FOREIGN KEY ("uporabnikId") REFERENCES "uporabniki"("id") ON DELETE CASCADE ON UPDATE CASCADE;
