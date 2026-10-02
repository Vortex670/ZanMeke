/*
  Warnings:

  - You are about to drop the column `naslov` on the `strani` table. All the data in the column will be lost.
  - You are about to drop the column `objavljeno` on the `strani` table. All the data in the column will be lost.
  - You are about to drop the column `seoNaslov` on the `strani` table. All the data in the column will be lost.
  - You are about to drop the column `seoOpis` on the `strani` table. All the data in the column will be lost.
  - You are about to drop the column `stanje` on the `strani` table. All the data in the column will be lost.
  - You are about to drop the column `vsebina` on the `strani` table. All the data in the column will be lost.
  - Added the required column `title` to the `strani` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "strani" DROP COLUMN "naslov",
DROP COLUMN "objavljeno",
DROP COLUMN "seoNaslov",
DROP COLUMN "seoOpis",
DROP COLUMN "stanje",
DROP COLUMN "vsebina",
ADD COLUMN     "body" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "menuOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "showInFooter" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInMenu" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "title" TEXT NOT NULL;

-- DropEnum
DROP TYPE "StanjeStrani";

-- CreateIndex
CREATE INDEX "strani_status_sortOrder_idx" ON "strani"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "strani_showInFooter_sortOrder_idx" ON "strani"("showInFooter", "sortOrder");
