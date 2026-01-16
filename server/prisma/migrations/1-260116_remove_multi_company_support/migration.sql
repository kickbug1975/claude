-- DropForeignKey
ALTER TABLE "chantiers" DROP CONSTRAINT IF EXISTS "chantiers_companyId_fkey";

-- DropForeignKey
ALTER TABLE "feuilles_travail" DROP CONSTRAINT IF EXISTS "feuilles_travail_companyId_fkey";

-- DropForeignKey
ALTER TABLE "monteurs" DROP CONSTRAINT IF EXISTS "monteurs_companyId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_companyId_fkey";

-- AlterTable
ALTER TABLE "chantiers" DROP COLUMN IF EXISTS "companyId";

-- AlterTable
ALTER TABLE "feuilles_travail" DROP COLUMN IF EXISTS "companyId";

-- AlterTable
ALTER TABLE "monteurs" DROP COLUMN IF EXISTS "companyId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "companyId";
