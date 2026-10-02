-- CreateTable
CREATE TABLE "zetoni_gesla" (
    "id" TEXT NOT NULL,
    "uporabnikId" TEXT NOT NULL,
    "zetonHash" TEXT NOT NULL,
    "potece" TIMESTAMP(3) NOT NULL,
    "porabljen" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zetoni_gesla_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zetoni_gesla_zetonHash_key" ON "zetoni_gesla"("zetonHash");

-- CreateIndex
CREATE INDEX "zetoni_gesla_uporabnikId_idx" ON "zetoni_gesla"("uporabnikId");

-- CreateIndex
CREATE INDEX "zetoni_gesla_potece_idx" ON "zetoni_gesla"("potece");

-- AddForeignKey
ALTER TABLE "zetoni_gesla" ADD CONSTRAINT "zetoni_gesla_uporabnikId_fkey" FOREIGN KEY ("uporabnikId") REFERENCES "uporabniki"("id") ON DELETE CASCADE ON UPDATE CASCADE;
