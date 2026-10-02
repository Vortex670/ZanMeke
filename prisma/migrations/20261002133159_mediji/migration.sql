-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateTable
CREATE TABLE "mediji" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "blurDataUrl" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mediji_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mediji_bucket_idx" ON "mediji"("bucket");

-- CreateIndex
CREATE UNIQUE INDEX "mediji_bucket_path_key" ON "mediji"("bucket", "path");

-- AddForeignKey
ALTER TABLE "mediji" ADD CONSTRAINT "mediji_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "uporabniki"("id") ON DELETE SET NULL ON UPDATE CASCADE;
