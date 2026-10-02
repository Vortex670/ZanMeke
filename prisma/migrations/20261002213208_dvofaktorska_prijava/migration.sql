-- AlterTable
ALTER TABLE "uporabniki" ADD COLUMN     "totpPotrjenAt" TIMESTAMP(3),
ADD COLUMN     "totpSkrivnost" TEXT;

-- CreateTable
CREATE TABLE "totp_rezervne_kode" (
    "id" TEXT NOT NULL,
    "uporabnikId" TEXT NOT NULL,
    "odtis" TEXT NOT NULL,
    "uporabljena" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "totp_rezervne_kode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "totp_rezervne_kode_odtis_key" ON "totp_rezervne_kode"("odtis");

-- CreateIndex
CREATE INDEX "totp_rezervne_kode_uporabnikId_idx" ON "totp_rezervne_kode"("uporabnikId");

-- AddForeignKey
ALTER TABLE "totp_rezervne_kode" ADD CONSTRAINT "totp_rezervne_kode_uporabnikId_fkey" FOREIGN KEY ("uporabnikId") REFERENCES "uporabniki"("id") ON DELETE CASCADE ON UPDATE CASCADE;
