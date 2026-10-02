-- CreateTable
CREATE TABLE "priporocila" (
    "id" TEXT NOT NULL,
    "ime" TEXT NOT NULL,
    "hisa" TEXT,
    "vloga" TEXT,
    "kraj" TEXT,
    "besedilo" TEXT NOT NULL,
    "url" TEXT,
    "objavljeno" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "priporocila_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "priporocila_objavljeno_sortOrder_idx" ON "priporocila"("objavljeno", "sortOrder");
