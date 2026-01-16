-- Script pour réinitialiser la base de données et permettre le wizard de premier admin
-- Supprime toutes les données et recrée une company vierge

-- 1. Supprimer toutes les données (dans l'ordre des dépendances)
DELETE FROM "frais";
DELETE FROM "fichiers";
DELETE FROM "feuilles_travail";
DELETE FROM "refresh_tokens";
DELETE FROM "reset_tokens";
DELETE FROM "users";
DELETE FROM "monteurs";
DELETE FROM "chantiers";
DELETE FROM "companies";

-- 2. Créer une company vierge (non configurée)
INSERT INTO "companies" (id, name, "isSetupComplete", active, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Mon Entreprise',
  false,  -- Setup non complété pour activer le wizard
  true,
  NOW(),
  NOW()
);

-- Vérification
SELECT 
  'Base de données réinitialisée. Accédez au wizard pour créer le premier admin.' as message,
  (SELECT COUNT(*) FROM "users") as users_count,
  (SELECT COUNT(*) FROM "companies") as companies_count,
  (SELECT "isSetupComplete" FROM "companies" LIMIT 1) as setup_complete;
