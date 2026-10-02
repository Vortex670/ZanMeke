-- CreateEnum
CREATE TYPE "StanjeStrani" AS ENUM ('OSNUTEK', 'OBJAVLJENO');

-- CreateTable
CREATE TABLE "obiskovalci" (
    "id" TEXT NOT NULL,
    "anonId" TEXT NOT NULL,
    "prviObisk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zadnjiObisk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drzava" TEXT,
    "mesto" TEXT,
    "naprava" TEXT,
    "os" TEXT,
    "brskalnik" TEXT,
    "jezik" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "obiskovalci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obiski" (
    "id" TEXT NOT NULL,
    "obiskovalecId" TEXT NOT NULL,
    "zacetek" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "konec" TIMESTAMP(3),
    "vir" TEXT,
    "utmVir" TEXT,
    "utmMedij" TEXT,
    "utmKampanja" TEXT,
    "vstopnaPot" TEXT,

    CONSTRAINT "obiski_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ogledi_strani" (
    "id" TEXT NOT NULL,
    "obiskId" TEXT NOT NULL,
    "pot" TEXT NOT NULL,
    "naslov" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ogledi_strani_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dogodki" (
    "id" TEXT NOT NULL,
    "obiskId" TEXT NOT NULL,
    "ime" TEXT NOT NULL,
    "pot" TEXT,
    "podatki" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dogodki_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strani" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "naslov" TEXT NOT NULL,
    "seoNaslov" TEXT,
    "seoOpis" TEXT,
    "stanje" "StanjeStrani" NOT NULL DEFAULT 'OBJAVLJENO',
    "objavljeno" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strani_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloki" (
    "id" TEXT NOT NULL,
    "stranId" TEXT NOT NULL,
    "vrsta" TEXT NOT NULL,
    "podatki" JSONB NOT NULL,
    "zaporedje" INTEGER NOT NULL,
    "skrit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloki_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "obiskovalci_anonId_key" ON "obiskovalci"("anonId");

-- CreateIndex
CREATE INDEX "obiskovalci_zadnjiObisk_idx" ON "obiskovalci"("zadnjiObisk");

-- CreateIndex
CREATE INDEX "obiski_obiskovalecId_idx" ON "obiski"("obiskovalecId");

-- CreateIndex
CREATE INDEX "obiski_zacetek_idx" ON "obiski"("zacetek");

-- CreateIndex
CREATE INDEX "ogledi_strani_obiskId_idx" ON "ogledi_strani"("obiskId");

-- CreateIndex
CREATE INDEX "ogledi_strani_pot_createdAt_idx" ON "ogledi_strani"("pot", "createdAt");

-- CreateIndex
CREATE INDEX "dogodki_ime_createdAt_idx" ON "dogodki"("ime", "createdAt");

-- CreateIndex
CREATE INDEX "dogodki_obiskId_idx" ON "dogodki"("obiskId");

-- CreateIndex
CREATE UNIQUE INDEX "strani_slug_key" ON "strani"("slug");

-- CreateIndex
CREATE INDEX "bloki_stranId_zaporedje_idx" ON "bloki"("stranId", "zaporedje");

-- AddForeignKey
ALTER TABLE "obiski" ADD CONSTRAINT "obiski_obiskovalecId_fkey" FOREIGN KEY ("obiskovalecId") REFERENCES "obiskovalci"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ogledi_strani" ADD CONSTRAINT "ogledi_strani_obiskId_fkey" FOREIGN KEY ("obiskId") REFERENCES "obiski"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dogodki" ADD CONSTRAINT "dogodki_obiskId_fkey" FOREIGN KEY ("obiskId") REFERENCES "obiski"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloki" ADD CONSTRAINT "bloki_stranId_fkey" FOREIGN KEY ("stranId") REFERENCES "strani"("id") ON DELETE CASCADE ON UPDATE CASCADE;
