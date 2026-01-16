-- Vérifier l'état de la base de données
SELECT 
  'État de la base de données' as info,
  (SELECT COUNT(*) FROM "users") as total_users,
  (SELECT COUNT(*) FROM "companies") as total_companies,
  (SELECT "isSetupComplete" FROM "companies" LIMIT 1) as setup_complete,
  (SELECT name FROM "companies" LIMIT 1) as company_name;
