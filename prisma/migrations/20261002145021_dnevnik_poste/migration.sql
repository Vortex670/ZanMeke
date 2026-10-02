-- CreateEnum
CREATE TYPE "StanjePoste" AS ENUM ('POSLANA', 'NAPAKA', 'PRESKOCENA');

-- CreateTable
CREATE TABLE "dnevnik_poste" (
    "id" TEXT NOT NULL,
    "prejemnik" TEXT NOT NULL,
    "zadeva" TEXT NOT NULL,
    "predloga" TEXT,
    "stanje" "StanjePoste" NOT NULL,
    "ponudnikId" TEXT,
    "napaka" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dnevnik_poste_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dnevnik_poste_createdAt_idx" ON "dnevnik_poste"("createdAt");

-- CreateIndex
CREATE INDEX "dnevnik_poste_stanje_createdAt_idx" ON "dnevnik_poste"("stanje", "createdAt");
