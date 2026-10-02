-- CreateEnum
CREATE TYPE "StanjeRacuna" AS ENUM ('OSNUTEK', 'POSLAN', 'PLACAN', 'PREKLICAN');

-- CreateTable
CREATE TABLE "racuni" (
    "id" TEXT NOT NULL,
    "stevilka" TEXT NOT NULL,
    "stranka" TEXT NOT NULL,
    "epota" TEXT,
    "podjetje" TEXT,
    "opis" TEXT NOT NULL,
    "znesekCentov" INTEGER NOT NULL,
    "valuta" TEXT NOT NULL DEFAULT 'EUR',
    "stanje" "StanjeRacuna" NOT NULL DEFAULT 'OSNUTEK',
    "zeton" TEXT NOT NULL,
    "stripeSejaId" TEXT,
    "stripePlaciloId" TEXT,
    "poslanoAt" TIMESTAMP(3),
    "placanoAt" TIMESTAMP(3),
    "zapadlost" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "racuni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_dogodki" (
    "id" TEXT NOT NULL,
    "dogodekId" TEXT NOT NULL,
    "vrsta" TEXT NOT NULL,
    "obdelanoAt" TIMESTAMP(3),
    "napaka" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_dogodki_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "racuni_stevilka_key" ON "racuni"("stevilka");

-- CreateIndex
CREATE UNIQUE INDEX "racuni_zeton_key" ON "racuni"("zeton");

-- CreateIndex
CREATE INDEX "racuni_stanje_createdAt_idx" ON "racuni"("stanje", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_dogodki_dogodekId_key" ON "stripe_dogodki"("dogodekId");
