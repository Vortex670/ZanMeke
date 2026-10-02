-- CreateTable
CREATE TABLE "omejitve_poskusov" (
    "id" TEXT NOT NULL,
    "kljuc" TEXT NOT NULL,
    "zacetekOkna" TIMESTAMP(3) NOT NULL,
    "stevilo" INTEGER NOT NULL DEFAULT 1,
    "potece" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "omejitve_poskusov_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sled" (
    "id" TEXT NOT NULL,
    "dejanje" TEXT NOT NULL,
    "tarca" TEXT,
    "oznaka" TEXT,
    "uporabnikId" TEXT,
    "ip" TEXT,
    "naprava" TEXT,
    "podatki" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sled_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "omejitve_poskusov_potece_idx" ON "omejitve_poskusov"("potece");

-- CreateIndex
CREATE UNIQUE INDEX "omejitve_poskusov_kljuc_zacetekOkna_key" ON "omejitve_poskusov"("kljuc", "zacetekOkna");

-- CreateIndex
CREATE INDEX "sled_dejanje_createdAt_idx" ON "sled"("dejanje", "createdAt");

-- CreateIndex
CREATE INDEX "sled_createdAt_idx" ON "sled"("createdAt");
