-- CreateEnum
CREATE TYPE "VrstaRacuna" AS ENUM ('PREDRACUN', 'RACUN');

-- AlterTable
ALTER TABLE "racuni" ADD COLUMN     "vrsta" "VrstaRacuna" NOT NULL DEFAULT 'RACUN';

-- CreateIndex
CREATE INDEX "racuni_vrsta_stanje_idx" ON "racuni"("vrsta", "stanje");
