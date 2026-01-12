-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISEUR', 'MONTEUR');

-- CreateEnum
CREATE TYPE "StatutFeuille" AS ENUM ('BROUILLON', 'SOUMIS', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "TypeFrais" AS ENUM ('TRANSPORT', 'MATERIEL', 'REPAS', 'AUTRES');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MONTEUR',
    "monteurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monteurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "dateEmbauche" TIMESTAMP(3) NOT NULL,
    "numeroIdentification" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monteurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chantiers" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chantiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feuilles_travail" (
    "id" TEXT NOT NULL,
    "monteurId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "dateTravail" TIMESTAMP(3) NOT NULL,
    "dateSaisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "heuresTotales" DOUBLE PRECISION NOT NULL,
    "descriptionTravail" TEXT NOT NULL,
    "statut" "StatutFeuille" NOT NULL DEFAULT 'BROUILLON',
    "valideParId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feuilles_travail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frais" (
    "id" TEXT NOT NULL,
    "feuilleId" TEXT NOT NULL,
    "typeFrais" "TypeFrais" NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "fichierProuve" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "frais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_monteurId_key" ON "users"("monteurId");

-- CreateIndex
CREATE UNIQUE INDEX "monteurs_email_key" ON "monteurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "monteurs_numeroIdentification_key" ON "monteurs"("numeroIdentification");

-- CreateIndex
CREATE UNIQUE INDEX "chantiers_reference_key" ON "chantiers"("reference");

-- CreateIndex
CREATE INDEX "feuilles_travail_monteurId_idx" ON "feuilles_travail"("monteurId");

-- CreateIndex
CREATE INDEX "feuilles_travail_chantierId_idx" ON "feuilles_travail"("chantierId");

-- CreateIndex
CREATE INDEX "feuilles_travail_dateTravail_idx" ON "feuilles_travail"("dateTravail");

-- CreateIndex
CREATE INDEX "feuilles_travail_statut_idx" ON "feuilles_travail"("statut");

-- CreateIndex
CREATE INDEX "frais_feuilleId_idx" ON "frais"("feuilleId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_monteurId_fkey" FOREIGN KEY ("monteurId") REFERENCES "monteurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuilles_travail" ADD CONSTRAINT "feuilles_travail_monteurId_fkey" FOREIGN KEY ("monteurId") REFERENCES "monteurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuilles_travail" ADD CONSTRAINT "feuilles_travail_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "chantiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuilles_travail" ADD CONSTRAINT "feuilles_travail_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frais" ADD CONSTRAINT "frais_feuilleId_fkey" FOREIGN KEY ("feuilleId") REFERENCES "feuilles_travail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
