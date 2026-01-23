-- CreateEnum
CREATE TYPE "MaintenanceRole" AS ENUM ('ADMIN', 'SUPERVISEUR', 'MONTEUR');

-- AlterEnum
BEGIN;
-- Note: Skipping alteration of existing Role enum for now to avoid locking issues, 
-- we will clean it up in Phase 2
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

-- ==========================================
-- DATA MIGRATION SECTION
-- ==========================================

-- 1. Copy Users (ADMIN, SUPERVISEUR, MONTEUR) to MaintenanceUser
INSERT INTO "maintenance_users" (
    "id",
    "email",
    "password",
    "role",
    "nom",
    "prenom",
    "isActive",
    "createdAt",
    "updatedAt",
    "monteurId"
)
SELECT 
    gen_random_uuid(), -- Generate new UUID
    "email",
    "password",
    "role"::text::"MaintenanceRole", -- Cast dynamic
    "name", -- Use name for nom
    '', -- Empty prenom for now
    "isActive",
    "createdAt",
    "updatedAt",
    "monteurId"
FROM "User"
WHERE "role"::text IN ('ADMIN', 'SUPERVISEUR', 'MONTEUR')
ON CONFLICT ("email") DO NOTHING;

-- 2. Copy Refresh Tokens
INSERT INTO "maintenance_refresh_tokens" (
    "id",
    "token",
    "maintenanceUserId",
    "expiresAt",
    "createdAt"
)
SELECT 
    gen_random_uuid(),
    rt."token",
    mu."id",
    rt."expiresAt",
    rt."createdAt"
FROM "refresh_tokens" rt
JOIN "User" u ON rt."userId" = u."id"
JOIN "maintenance_users" mu ON mu."email" = u."email"
WHERE u."role"::text IN ('ADMIN', 'SUPERVISEUR', 'MONTEUR')
ON CONFLICT ("token") DO NOTHING;

-- 3. Copy Reset Tokens
INSERT INTO "maintenance_reset_tokens" (
    "id",
    "token",
    "maintenanceUserId",
    "expiresAt",
    "createdAt"
)
SELECT 
    gen_random_uuid(),
    rt."token",
    mu."id",
    rt."expiresAt",
    rt."createdAt"
FROM "reset_tokens" rt
JOIN "User" u ON rt."userId" = u."id"
JOIN "maintenance_users" mu ON mu."email" = u."email"
WHERE u."role"::text IN ('ADMIN', 'SUPERVISEUR', 'MONTEUR')
ON CONFLICT ("token") DO NOTHING;
