-- CreateTable
CREATE TABLE "fichiers" (
    "id" TEXT NOT NULL,
    "feuilleId" TEXT,
    "nom" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fichiers_cle_key" ON "fichiers"("cle");

-- CreateIndex
CREATE INDEX "fichiers_feuilleId_idx" ON "fichiers"("feuilleId");

-- AddForeignKey
ALTER TABLE "fichiers" ADD CONSTRAINT "fichiers_feuilleId_fkey" FOREIGN KEY ("feuilleId") REFERENCES "feuilles_travail"("id") ON DELETE SET NULL ON UPDATE CASCADE;
