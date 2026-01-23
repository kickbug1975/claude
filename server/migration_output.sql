-- CreateEnum
CREATE TYPE "MaintenanceRole" AS ENUM ('ADMIN', 'SUPERVISEUR', 'MONTEUR');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'DRIVER', 'USER', 'MODERATOR');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'DRIVER';
COMMIT;

-- CreateTable
CREATE TABLE "maintenance_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "MaintenanceRole" NOT NULL DEFAULT 'MONTEUR',
    "nom" TEXT,
    "prenom" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monteurId" TEXT,

    CONSTRAINT "maintenance_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "maintenanceUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "maintenanceUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_users_email_key" ON "maintenance_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_users_monteurId_key" ON "maintenance_users"("monteurId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_refresh_tokens_token_key" ON "maintenance_refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_reset_tokens_token_key" ON "maintenance_reset_tokens"("token");

-- AddForeignKey
ALTER TABLE "maintenance_users" ADD CONSTRAINT "maintenance_users_monteurId_fkey" FOREIGN KEY ("monteurId") REFERENCES "monteurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_refresh_tokens" ADD CONSTRAINT "maintenance_refresh_tokens_maintenanceUserId_fkey" FOREIGN KEY ("maintenanceUserId") REFERENCES "maintenance_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reset_tokens" ADD CONSTRAINT "maintenance_reset_tokens_maintenanceUserId_fkey" FOREIGN KEY ("maintenanceUserId") REFERENCES "maintenance_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

