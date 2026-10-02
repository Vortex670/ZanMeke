/*
  Warnings:

  - You are about to drop the `bloki` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bloki" DROP CONSTRAINT "bloki_stranId_fkey";

-- AlterTable
ALTER TABLE "strani" ADD COLUMN     "vsebina" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "bloki";

-- CreateTable
CREATE TABLE "domov_bloki" (
    "id" TEXT NOT NULL,
    "kljuc" TEXT NOT NULL,
    "viden" BOOLEAN NOT NULL DEFAULT true,
    "zaporedje" INTEGER NOT NULL DEFAULT 0,
    "podatki" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domov_bloki_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domov_bloki_kljuc_key" ON "domov_bloki"("kljuc");

-- CreateIndex
CREATE INDEX "domov_bloki_viden_zaporedje_idx" ON "domov_bloki"("viden", "zaporedje");
