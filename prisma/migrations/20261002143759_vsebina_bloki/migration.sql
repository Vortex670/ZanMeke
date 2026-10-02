/*
  Warnings:

  - You are about to drop the `domov_bloki` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "domov_bloki";

-- CreateTable
CREATE TABLE "vsebina_bloki" (
    "id" TEXT NOT NULL,
    "stran" TEXT NOT NULL,
    "kljuc" TEXT NOT NULL,
    "viden" BOOLEAN NOT NULL DEFAULT true,
    "zaporedje" INTEGER NOT NULL DEFAULT 0,
    "podatki" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vsebina_bloki_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vsebina_bloki_stran_viden_zaporedje_idx" ON "vsebina_bloki"("stran", "viden", "zaporedje");

-- CreateIndex
CREATE UNIQUE INDEX "vsebina_bloki_stran_kljuc_key" ON "vsebina_bloki"("stran", "kljuc");
